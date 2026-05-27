import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NormalizedCigar } from './normalized-cigar.schema';

@Injectable()
export class NormalizedCigarService {
    constructor(
        @InjectModel(NormalizedCigar.name) private normalizedModel: Model<NormalizedCigar>,
    ) {}

    async search(
        query: string,
        page: number = 1,
        limit: number = 20,
        filters: {
            brand?: string[];
            strength?: string[];
            origin?: string[];
            shape?: string[];
            ring?: string[];
            length?: string[];
            min_retailers?: number;  // only show cigars available at 2+ retailers
        } = {}
    ) {
        const skip = Math.max((page - 1) * limit, 0);
        const criteria: any = {};

        // Always exclude cigars only found at one retailer from comparison view
        if (filters.min_retailers) {
            criteria.in_stock_count = { $gte: filters.min_retailers };
        }

        if (filters.brand?.length)    criteria.brand    = { $in: filters.brand.map(b => new RegExp(`^${b}$`, 'i')) };
        if (filters.strength?.length) criteria.strength = { $in: filters.strength.map(s => new RegExp(`^${s}$`, 'i')) };
        if (filters.origin?.length)   criteria.origin   = { $in: filters.origin.map(o => new RegExp(`^${o}$`, 'i')) };
        if (filters.shape?.length)    criteria.shape    = { $in: filters.shape.map(s => new RegExp(`^${s}$`, 'i')) };

        if (filters.ring?.length) {
            criteria['$and'] = criteria['$and'] || [];
            criteria['$and'].push({ $or: this.parseRanges(filters.ring, 'ring') });
        }
        if (filters.length?.length) {
            criteria['$and'] = criteria['$and'] || [];
            criteria['$and'].push({ $or: this.parseRanges(filters.length, 'length') });
        }

        if (query?.trim()) {
            const words = query.trim().split(/\s+/).map(w => `"${w}"`).join(' ');
            criteria['$text'] = { $search: words };
        }

        const [cigars, totalRecords] = await Promise.all([
            query?.trim()
                ? this.normalizedModel
                    .find(criteria, { score: { $meta: 'textScore' } })
                    .sort({ score: { $meta: 'textScore' } })
                    .skip(skip).limit(limit).lean().exec()
                : this.normalizedModel
                    .find(criteria)
                    .sort({ best_price: 1 })
                    .skip(skip).limit(limit).lean().exec(),
            this.normalizedModel.countDocuments(criteria).exec(),
        ]);

        return {
            cigars,
            totalPages: Math.ceil(totalRecords / limit),
            totalRecords,
            skip,
        };
    }

    async getSuggestions(query: string): Promise<any[]> {
        if (!query?.trim()) return [];
        const words = query.trim().split(/\s+/).map(w => `"${w}"`).join(' ');
        return this.normalizedModel
            .find({ $text: { $search: words } }, { name: 1, brand: 1, score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(10)
            .lean()
            .exec();
    }

    async getById(id: string): Promise<NormalizedCigar> {
        return this.normalizedModel.findById(id).lean().exec();
    }

    async getFilters() {
        const result = await this.normalizedModel.aggregate([
            {
                $group: {
                    _id: null,
                    origins:   { $addToSet: { $toLower: '$origin' } },
                    shapes:    { $addToSet: { $toLower: '$shape' } },
                    strengths: { $addToSet: '$strength' },
                    brands:    { $addToSet: '$brand' },
                }
            },
            { $project: { _id: 0, origins: 1, shapes: 1, strengths: 1, brands: 1 } }
        ]).exec();

        return result[0] || {};
    }

    private parseRanges(ranges: string[], key: string) {
        return ranges.map(range => {
            const [min, max] = range.split('-').map(Number);
            return { [key]: { $gte: min, $lte: max } };
        });
    }
}
