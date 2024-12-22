import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CigarModule } from './cigar/cigar.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import configuration from 'environment/config';

@Module({
  imports: [
    CigarModule,
    MongooseModule.forRootAsync({
      useFactory: async (config) => ({
        uri: `${process.env.MONGO_DB_URL}`,
      })
    }),
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/environment/${process.env.NODE_ENV || 'development'}.env`,
      isGlobal: true,
      load: [configuration]
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
