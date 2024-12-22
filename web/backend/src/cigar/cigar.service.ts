import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cigar, Pack } from './cigar.schema';

@Injectable()
export class CigarsService {
    constructor(
        @InjectModel(Cigar.name) private cigarModel: Model<Cigar>,
    ) { }

    // Helper function to parse range strings into MongoDB range queries
    // parseRanges(ranges: string[]): RegExp[] {
    //     return ranges.map(range => {
    //         const [min, max] = range.split('-').map(Number);
    //         return new RegExp(`^(${min}|${max}|${min}-.*|.*-${max}|${min}-.+-.+|.+-.+-${max})$`);
    //     });
    // }

    parseRanges(ranges: string[], key: string): any[] {
        return ranges.map(range => {
            const [min, max] = range.split('-').map(Number);
            return { [key]: { $gte: min, $lte: max } };
        });
    }

    async searchCigars(
        query: string,
        page: number,
        limit: number,
        filters: { brand?: string[], length?: string[], ring?: string[], strength?: string[], origin?: string[], shape?: string[] }
    ): Promise<{
        cigars: Cigar[],
        totalPages: number,
        totalRecords: number,
        skip: number
    }> {
        const criteria = {};
        const skip = (page - 1) * limit >= 0 ? (page - 1) * limit : 0;
        Object.keys(filters).forEach(key => {
            if (filters[key] && filters[key].length > 0) {
                if (key === 'ring' || key === 'length') {
                    if (!criteria['$and']) {
                        criteria['$and'] = []
                    }
                    criteria['$and'].push({ '$or': this.parseRanges(filters[key], key) });
                } else {
                    criteria[key] = { $in: filters[key].map(value => new RegExp(`^${value}$`, 'i')) };
                }
            }
        });

        if (!query) {
            const totalRecords = await this.cigarModel.countDocuments(criteria).exec();
            const cigars = await this.cigarModel.find(criteria)
                .skip(skip)
                .limit(limit)
                .exec();

            const totalPages = Math.ceil(totalRecords / limit);
            return { cigars, totalPages, totalRecords, skip };
        }

        if (query) {
            const queryWords = query.split(' ').map(word => word.trim()).filter(word => word);
            const searchString = queryWords.map(word => `\"${word}\"`).join(' ');
            criteria['$text'] = { $search: searchString };
        }

        const totalRecords = await this.cigarModel.countDocuments(criteria).exec();
        const cigars = await this.cigarModel.find(criteria, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .exec();

        const totalPages = Math.ceil(totalRecords / limit);
        return { cigars, totalPages, totalRecords, skip };
    }


    async getFilters(): Promise<any> {
        const uniqueAttributes = await this.cigarModel.aggregate([
            {
                $project: {
                    // brand_lower: { $toLower: '$brand' },
                    // length_lower: { $toLower: '$length' },
                    // ring_lower: { $toLower: '$ring' },
                    // strength_lower: { $toLower: '$strength' },
                    origin_lower: { $toLower: '$origin' },
                    shape_lower: { $toLower: '$shape' },
                }
            },
            {
                $group: {
                    _id: null,
                    // brands: { $addToSet: '$brand' },
                    // lengths: { $addToSet: '$length' },
                    // rings: { $addToSet: '$ring' },
                    // strengths: { $addToSet: '$strength' },
                    origins: { $addToSet: '$origin_lower' },
                    shapes: { $addToSet: '$shape_lower' },
                }
            },
            {
                $project: {
                    _id: 0,
                    // brands: 1,
                    // lengths: 1,
                    // rings: 1,
                    // strengths: 1,
                    origins: 1,
                    shapes: 1
                }
            }
        ]).exec();

        return uniqueAttributes[0];
    }

    async getSuggestions(query: string): Promise<Cigar[]> {
        if (!query) {
            return [];
        }

        const queryWords = query.split(" ").map(word => word.trim()).filter(word => word);
        const searchString = queryWords.map(word => `\"${word}\"`).join(' ');
        const cigars = await this.cigarModel.find({
            $text: { $search: searchString }
        }, { name: 1 }, { score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" } })
            .exec();
        return cigars.slice(0, 10);
    }

    async findById(id: string): Promise<Cigar> {
        return this.cigarModel.findById(id).exec();
    }
}
