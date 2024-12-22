import { Module } from '@nestjs/common';
import { CigarsService } from './cigar.service';
import { CigarController } from './cigar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cigar, CigarSchema } from './cigar.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{
            name: Cigar.name,
            schema: CigarSchema
        }])
    ],
    providers: [CigarsService],
    controllers: [CigarController],
    exports: [CigarsService]
})
export class CigarModule { }
