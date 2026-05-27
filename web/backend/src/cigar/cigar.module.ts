import { Module } from '@nestjs/common';
import { CigarsService } from './cigar.service';
import { CigarController } from './cigar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cigar, CigarSchema } from './cigar.schema';
import { NormalizedCigar, NormalizedCigarSchema } from './normalized-cigar.schema';
import { NormalizedCigarService } from './normalized-cigar.service';
import { NormalizationService } from './normalization.service';
import { CompareController } from './compare.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Cigar.name, schema: CigarSchema },
            { name: NormalizedCigar.name, schema: NormalizedCigarSchema },
        ])
    ],
    providers: [CigarsService, NormalizedCigarService, NormalizationService],
    controllers: [CigarController, CompareController],
    exports: [CigarsService, NormalizedCigarService],
})
export class CigarModule {}
