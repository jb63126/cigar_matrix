import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NormalizedCigarService } from './normalized-cigar.service';
import { NormalizationService } from './normalization.service';

@Controller('compare')
export class CompareController {

    constructor(
        private readonly normalizedService: NormalizedCigarService,
        private readonly normalizationService: NormalizationService,
    ) {}

    // GET /compare/search?query=oliva+serie+v&page=1&limit=20
    @Get('search')
    async search(
        @Query('query') query: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('brand') brand?: string[],
        @Query('strength') strength?: string[],
        @Query('origin') origin?: string[],
        @Query('shape') shape?: string[],
        @Query('ring') ring?: string[],
        @Query('length') length?: string[],
        @Query('min_retailers') min_retailers?: number,
    ) {
        const filters = { brand, strength, origin, shape, ring, length, min_retailers };
        return this.normalizedService.search(query, page, limit, filters);
    }

    // GET /compare/suggestions?query=oliva
    @Get('suggestions')
    async suggestions(@Query('query') query: string) {
        return this.normalizedService.getSuggestions(query);
    }

    // GET /compare/filters
    @Get('filters')
    async filters() {
        return this.normalizedService.getFilters();
    }

    // GET /compare/:id
    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.normalizedService.getById(id);
    }

    // POST /compare/normalize — trigger a normalization run (call after each scrape)
    @Post('normalize')
    async normalize() {
        return this.normalizationService.normalize();
    }
}
