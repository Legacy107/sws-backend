import { Module } from '@nestjs/common';

import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';

import { TypeOrmExModule } from 'src/common/modules/typeorm.module';

import { CompanyRepository } from './company.repository';
import { CompanyService } from './company.service';
import { CompanyPriceClose } from './entities/company-price.entity';
import { CompanyScore } from './entities/company-score.entity';
import { Company, CompanyDTO } from './entities/company.entity';

@Module({
  providers: [CompanyService],
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        TypeOrmExModule.forCustomRepository([CompanyRepository]),
        NestjsQueryTypeOrmModule.forFeature([
          Company,
          CompanyPriceClose,
          CompanyScore,
        ]),
      ],
      services: [CompanyService],
      resolvers: [
        {
          DTOClass: CompanyDTO,
          EntityClass: Company,
          ServiceClass: CompanyService,
        },
      ],
    }),
  ],
})
export class CompanyModule {}
