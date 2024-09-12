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
import {
  Company,
  CompanyDTO,
  SNOWFLAKE_FOREIGN_KEYS,
  isSnowflakeKey,
} from './entities/company.entity';

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
    const scoreSorting = query.sorting.filter((s) => isSnowflakeKey(s.field));
    const scoreFilter = Object.keys(query.filter).filter((f) =>
      isSnowflakeKey(f),
    );
    if (scoreFilter.length || scoreSorting.length) {
      queryBuilder = queryBuilder.leftJoinAndSelect('Company.score', 'score');
    }

    if (query.filter?.total_score) {
      queryBuilder = this.service.filterQueryBuilder.applyFilter(
        queryBuilder,
        Object.fromEntries(
          scoreFilter.map((f) => [SNOWFLAKE_FOREIGN_KEYS[f], query.filter[f]]),
        ),
        'score',
      );

      scoreFilter.forEach((f) => delete query.filter[f]);
    }

    if (scoreSorting) {
      for (const s of scoreSorting) {
        queryBuilder = queryBuilder.addOrderBy(
          `score.${SNOWFLAKE_FOREIGN_KEYS[s.field]}`,
          s.direction,
        );
      }

      query.sorting = query.sorting.filter((s) => !isSnowflakeKey(s.field));
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
