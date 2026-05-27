import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class RetailerPrice {
    @Prop() site_name: string;
    @Prop() prod_url: string;
    @Prop() scraped_at: Date;
    @Prop({ type: [Object] }) packs: {
        name: string;
        price: number;
        availability: string;
    }[];
}

export const RetailerPriceSchema = SchemaFactory.createForClass(RetailerPrice);

@Schema({ collection: 'normalized_cigars' })
export class NormalizedCigar extends Document {
    // Canonical identity
    @Prop({ unique: true, index: true }) normalized_id: string;
    @Prop({ index: true }) name: string;
    @Prop({ index: true }) brand: string;
    @Prop() sub_brand: string;
    @Prop() shape: string;
    @Prop() strength: string;
    @Prop() origin: string;
    @Prop() length: number;
    @Prop() ring: number;

    // All retailer prices — the core value prop
    @Prop({ type: [RetailerPriceSchema] }) retailers: RetailerPrice[];

    // Computed fields for fast querying
    @Prop() best_price: number;           // lowest single price across all retailers
    @Prop() best_price_retailer: string;  // which retailer has the best price
    @Prop() best_price_url: string;       // direct URL to best price
    @Prop() in_stock_count: number;       // how many retailers have it in stock

    @Prop() last_updated: Date;
}

export const NormalizedCigarSchema = SchemaFactory.createForClass(NormalizedCigar);

// Text index for search
NormalizedCigarSchema.index(
    { name: 'text', brand: 'text', sub_brand: 'text' },
    { weights: { name: 10, brand: 5, sub_brand: 3 } }
);
