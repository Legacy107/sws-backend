import { ObjectType } from '@nestjs/graphql';

import { SortDirection } from '@ptc-org/nestjs-query-core';
import {
  FilterableField,
  FilterableRelation,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';

import { Company, CompanyDTO } from './company.entity';

@Entity('swsCompanyPriceClose')
export class CompanyPriceClose {
  @PrimaryColumn({ type: 'date' })
  date: Date;

  @PrimaryColumn({ type: 'uniqueidentifier' })
  company_id: string;

  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  date_created: Date;

  @ManyToOne(() => Company, (company) => company.price)
  @JoinColumn({ name: 'company_id' })
  company!: Relation<Company>;
}

@ObjectType('CompanyPriceClose')
@QueryOptions({
  maxResultsSize: 200,
  defaultSort: [{ field: 'date', direction: SortDirection.DESC }],
})
@FilterableRelation('company', () => CompanyDTO)
export class CompanyPriceCloseDTO {
  @FilterableField(() => String)
  date: Date;

  @FilterableField(() => String)
  company_id: string;

  @FilterableField(() => Number)
  price: number;

  @FilterableField(() => Date)
  date_created: Date;
}
