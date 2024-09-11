import { Injectable } from '@nestjs/common';
import { ArgsType } from '@nestjs/graphql';

import {
  InjectQueryService,
  ProxyQueryService,
  QueryOptions,
} from '@ptc-org/nestjs-query-core';
import { QueryArgsType } from '@ptc-org/nestjs-query-graphql';
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm';
import { SelectQueryBuilder } from 'typeorm';

import { CompanyRepository } from './company.repository';
import { CompanyPriceClose } from './entities/company-price.entity';
import { Company, CompanyDTO } from './entities/company.entity';

@ArgsType()
export class CompanyQuery extends QueryArgsType(CompanyDTO) {}

@Injectable()
export class CompanyService extends ProxyQueryService<CompanyDTO> {
  constructor(
    @InjectQueryService(Company)
    readonly service: TypeOrmQueryService<CompanyDTO>,
    private readonly companyRepository: CompanyRepository,
  ) {
    super(service);
  }

  async query(
    query: CompanyQuery,
    opts?: QueryOptions<CompanyDTO>,
  ): Promise<CompanyDTO[]> {
    const selectedFields = this.getQuerySelectedFields(opts);
    let queryBuilder = this.companyRepository
      .createQueryBuilder()
      .select(selectedFields)
      .offset(query.paging?.offset)
      .limit(query.paging?.limit);

    queryBuilder = this.applyScoreFilterAndSorting(query, queryBuilder);
    queryBuilder = this.applyPriceFluctuationSorting(query, queryBuilder);
    queryBuilder = this.service.filterQueryBuilder.applyFilter(
      queryBuilder,
      query.filter,
    );
    queryBuilder = this.service.filterQueryBuilder.applySorting(
      queryBuilder as any,
      query.sorting,
    );

    return queryBuilder.getMany();
  }

  private getQuerySelectedFields(opts?: QueryOptions<CompanyDTO>): string[] {
    const excludeKeys = ['score', 'price', 'price_fluctuation'];
    const selectedFields = Object.keys(
      (opts.resolveInfo.fields as any).nodes.fields,
    )
      .filter((f) => !excludeKeys.includes(f))
      .map((f) => `Company.${f}`);

    if (!selectedFields.includes('Company.id')) {
      selectedFields.push('Company.id');
    }

    return selectedFields;
  }

  private applyScoreFilterAndSorting(
    query: CompanyQuery,
    queryBuilder: SelectQueryBuilder<Company>,
  ) {
    const scoreSorting = query.sorting.find((s) => s.field === 'total_score');
    if (query.filter?.total_score || scoreSorting) {
      queryBuilder = queryBuilder.leftJoinAndSelect('Company.score', 'score');
    }

    if (query.filter?.total_score) {
      queryBuilder = this.service.filterQueryBuilder.applyFilter(
        queryBuilder,
        {
          ['total' as any]: query.filter.total_score,
        },
        'score',
      );

      delete query.filter.total_score;
    }

    if (scoreSorting) {
      queryBuilder = queryBuilder.addOrderBy(
        'score.total',
        scoreSorting.direction,
      );

      query.sorting = query.sorting.filter((s) => s.field !== 'total_score');
    }

    return queryBuilder;
  }

  private applyPriceFluctuationSorting(query: CompanyQuery, queryBuilder: any) {
    const priceFluctuationSorting = query.sorting.find(
      (s) => s.field === 'price_fluctuation',
    );

    if (priceFluctuationSorting) {
      queryBuilder = queryBuilder
        .leftJoin(
          (subQuery) => {
            return subQuery
              .select('priceClose.company_id', 'company_id')
              .addSelect('MAX(priceClose.price)', 'max_price')
              .addSelect('MIN(priceClose.price)', 'min_price')
              .addSelect(
                '((MAX(priceClose.price) - MIN(priceClose.price)) / MIN(priceClose.price)) * 100',
                'price_fluctuation',
              )
              .from(CompanyPriceClose, 'priceClose')
              .where("priceClose.date >= DATE('now', '-90 days')")
              .groupBy('priceClose.company_id');
          },
          'PriceFluctuation',
          'PriceFluctuation.company_id = "Company"."id"',
        )
        .addSelect('PriceFluctuation.price_fluctuation', 'price_fluctuation')
        .addOrderBy(
          'PriceFluctuation.price_fluctuation',
          priceFluctuationSorting.direction,
        );

      query.sorting = query.sorting.filter(
        (s) => s.field !== 'price_fluctuation',
      );
    }

    return queryBuilder;
  }
}
