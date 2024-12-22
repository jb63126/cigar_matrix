import { Controller, Get, Param, Query } from '@nestjs/common';
import { CigarsService } from './cigar.service';
import { Cigar } from './cigar.schema';

@Controller('cigar')
export class CigarController {

    constructor(private readonly cigarsService: CigarsService) { }

    @Get('search')
    async searchCigars(
        @Query('query') query: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('brand') brand?: string[],
        @Query('length') length?: string[],
        @Query('ring') ring?: string[],
        @Query('strength') strength?: string[],
        @Query('origin') origin?: string[],
        @Query('shape') shape?: string[]
    ): Promise<{ cigars: Cigar[], totalPages: number }> {
        const filters = { brand, length, ring, strength, origin, shape };
        return this.cigarsService.searchCigars(query, page, limit, filters);
    }

    @Get('filters')
    async getFilters() {
        return this.cigarsService.getFilters();
    }

    @Get(':id')
    async getCigarById(@Param('id') id: string) {
        return this.cigarsService.findById(id);
    }

    @Get('suggestions')
    getSuggestions(@Query('query') query: string) {
        return this.cigarsService.getSuggestions(query);
    }
}
