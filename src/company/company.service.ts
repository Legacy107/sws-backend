import { Injectable } from '@nestjs/common';
import { ArgsType } from '@nestjs/graphql';

import {
  InjectQueryService,
  ProxyQueryService,
  QueryOptions,
} from '@ptc-org/nestjs-query-core';
import { QueryArgsType } from '@ptc-org/nestjs-query-graphql';
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm';

import { CompanyRepository } from './company.repository';
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
    const relations = ['score', 'price'];
    const selectedFields = Object.keys(
      (opts.resolveInfo.fields as any).nodes.fields,
    )
      .filter((f) => !relations.includes(f))
      .map((f) => `Company.${f}`);

    if (!selectedFields.includes('Company.id')) {
      selectedFields.push('Company.id');
    }

    let queryBuilder = this.companyRepository
      .createQueryBuilder()
      .select(selectedFields)
      .skip(query.paging?.offset)
      .take(query.paging?.limit);

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

    queryBuilder = this.service.filterQueryBuilder.applyFilter(
      queryBuilder,
      query.filter,
    );

    if (scoreSorting) {
      queryBuilder = queryBuilder.addOrderBy(
        'score.total',
        scoreSorting.direction,
      );

      query.sorting = query.sorting.filter((s) => s.field !== 'total_score');
    }

    queryBuilder = this.service.filterQueryBuilder.applySorting(
      queryBuilder,
      query.sorting,
    );

    return queryBuilder.getMany();
  }
}
