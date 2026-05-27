import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cigar } from './cigar.schema';
import { NormalizedCigar } from './normalized-cigar.schema';

// Words to strip when building a canonical name for matching
const NOISE_WORDS = [
    'cigars', 'cigar', 'the', 'de', 'la', 'el', 'los', 'las',
    'single', 'box', 'pack', 'bundle', 'sampler', 'tin',
    'natural', 'maduro', 'claro', 'colorado',
];

// Retailers to exclude (samplers, accessories, etc.)
const SAMPLER_KEYWORDS = [
    'sampler', 'bundle', 'variety', 'assortment', 'mix', 'collection',
    'starter', 'gift', 'set', 'pack of', 'intro', 'taster'
];

@Injectable()
export class NormalizationService {
    private readonly logger = new Logger(NormalizationService.name);

    constructor(
        @InjectModel(Cigar.name) private cigarModel: Model<Cigar>,
        @InjectModel(NormalizedCigar.name) private normalizedModel: Model<NormalizedCigar>,
    ) {}

    /**
     * Build a canonical key from a cigar name for cross-retailer matching.
     * "Oliva Serie V Melanio Robusto 5x52" → "olivaserievelaniorobusto"
     */
    private buildNormalizedId(name: string, brand: string, ring: number, length: number): string {
        const cleanName = name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')       // strip punctuation
            .replace(/\d+(\.\d+)?\s*x\s*\d+/g, '') // strip size (6x52)
            .split(/\s+/)
            .filter(w => w.length > 1 && !NOISE_WORDS.includes(w))
            .join('');

        // Include ring gauge in key — same name, different vitola = different cigar
        const ringKey = ring ? `r${ring}` : '';
        return `${cleanName}${ringKey}`;
    }

    /**
     * Check if a cigar name looks like a sampler — exclude these.
     */
    private isSampler(name: string): boolean {
        const lower = name.toLowerCase();
        return SAMPLER_KEYWORDS.some(kw => lower.includes(kw));
    }

    /**
     * Find the best (lowest) single-cigar price across all packs.
     * Ignores box prices when calculating per-cigar value.
     */
    private getBestPrice(retailers: any[]): { price: number; retailer: string; url: string } {
        let best = { price: Infinity, retailer: '', url: '' };

        for (const r of retailers) {
            for (const pack of r.packs) {
                if (
                    pack.availability?.toLowerCase().includes('in stock') &&
                    pack.price &&
                    pack.price < best.price
                ) {
                    best = { price: pack.price, retailer: r.site_name, url: r.prod_url };
                }
            }
        }

        return best.price === Infinity ? { price: null, retailer: '', url: '' } : best;
    }

    /**
     * Run full normalization — groups all raw cigars into normalized_cigars.
     * Safe to run repeatedly (upserts).
     */
    async normalize(): Promise<{ processed: number; normalized: number }> {
        this.logger.log('Starting normalization run...');

        const allCigars = await this.cigarModel.find({}).lean().exec();
        this.logger.log(`Found ${allCigars.length} raw cigar records`);

        // Group by normalized_id
        const groups = new Map<string, any[]>();

        for (const cigar of allCigars) {
            if (this.isSampler(cigar.name)) continue;

            const nid = this.buildNormalizedId(cigar.name, cigar.brand, cigar.ring, cigar.length);
            if (!nid || nid.length < 4) continue;

            if (!groups.has(nid)) groups.set(nid, []);
            groups.get(nid).push(cigar);
        }

        this.logger.log(`Grouped into ${groups.size} unique cigars`);

        let upserted = 0;
        for (const [nid, records] of groups) {
            // Pick the record with the most complete data as canonical
            const canonical = records.sort((a, b) =>
                Object.values(b).filter(Boolean).length - Object.values(a).filter(Boolean).length
            )[0];

            const retailers = records.map(r => ({
                site_name: r.site_name,
                prod_url: r.prod_url,
                scraped_at: r.scraped_at,
                packs: r.packs,
            }));

            const { price, retailer, url } = this.getBestPrice(retailers);
            const inStockCount = retailers.filter(r =>
                r.packs.some(p => p.availability?.toLowerCase().includes('in stock'))
            ).length;

            await this.normalizedModel.updateOne(
                { normalized_id: nid },
                {
                    $set: {
                        normalized_id: nid,
                        name: canonical.name,
                        brand: canonical.brand,
                        sub_brand: canonical.sub_brand || '',
                        shape: canonical.shape || '',
                        strength: canonical.strength || '',
                        origin: canonical.origin || '',
                        length: canonical.length,
                        ring: canonical.ring,
                        retailers,
                        best_price: price,
                        best_price_retailer: retailer,
                        best_price_url: url,
                        in_stock_count: inStockCount,
                        last_updated: new Date(),
                    }
                },
                { upsert: true }
            );
            upserted++;
        }

        this.logger.log(`Normalization complete. ${upserted} cigars upserted.`);
        return { processed: allCigars.length, normalized: upserted };
    }
}
