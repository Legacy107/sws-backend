// src/company/entities/company.entity.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';

import {
  FilterableCursorConnection,
  FilterableField,
  FilterableRelation,
  IDField,
  PagingStrategies,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

import {
  CompanyPriceClose,
  CompanyPriceCloseDTO,
} from './company-price.entity';
import { CompanyScore, CompanyScoreDTO } from './company-score.entity';

@Entity('swsCompany')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  ticker_symbol?: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  exchange_symbol?: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  unique_symbol?: string;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  date_generated?: Date;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  security_name?: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  exchange_country_iso?: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  listing_currency_iso?: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  canonical_url?: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  unique_symbol_slug?: string;

  @OneToOne(() => CompanyScore, (score) => score.company)
  score?: Relation<CompanyScore>;

  @OneToMany(() => CompanyPriceClose, (price) => price.company)
  price?: Relation<CompanyPriceClose[]>;

  dividend_score: number;
  future_score: number;
  health_score: number;
  past_score: number;
  value_score: number;
  total_score: number;
}

@ObjectType('Company')
@QueryOptions({
  pagingStrategy: PagingStrategies.OFFSET,
  enableTotalCount: true,
})
@FilterableRelation('score', () => CompanyScoreDTO, {
  update: { enabled: true },
  enableLookAhead: true,
})
@FilterableCursorConnection('price', () => CompanyPriceCloseDTO, {
  update: { enabled: true },
})
export class CompanyDTO {
  @IDField(() => ID)
  id: string;

  @FilterableField(() => String)
  name: string;

  @FilterableField(() => String, { nullable: true })
  ticker_symbol?: string;

  @FilterableField(() => String, { nullable: true })
  exchange_symbol?: string;

  @FilterableField(() => String, { nullable: true })
  unique_symbol?: string;

  @Field(() => Date, { nullable: true })
  date_generated?: Date;

  @Field(() => String, { nullable: true })
  security_name?: string;

  @Field(() => String, { nullable: true })
  exchange_country_iso?: string;

  @Field(() => String, { nullable: true })
  listing_currency_iso?: string;

  @Field(() => String, { nullable: true })
  canonical_url?: string;

  @Field(() => String, { nullable: true })
  unique_symbol_slug?: string;

  @FilterableField(() => Number, { nullable: true, filterOnly: true })
  dividend_score: number;

  @FilterableField(() => Number, { nullable: true, filterOnly: true })
  future_score: number;

  @FilterableField(() => Number, { nullable: true, filterOnly: true })
  health_score: number;

  @FilterableField(() => Number, { nullable: true, filterOnly: true })
  past_score: number;

  @FilterableField(() => Number, { nullable: true, filterOnly: true })
  value_score: number;

  @FilterableField(() => Number, { nullable: true, filterOnly: true })
  total_score: number;

  @FilterableField(() => Number, { nullable: true, filterOnly: true })
  price_fluctuation?: number;
}

export type SnowflakeKeys = (typeof SNOWFLAKE_KEYS)[number];

export const SNOWFLAKE_KEYS = [
  'dividend_score',
  'future_score',
  'health_score',
  'past_score',
  'value_score',
  'total_score',
] as const;

export const SNOWFLAKE_FOREIGN_KEYS: Record<SnowflakeKeys, string> = {
  dividend_score: 'dividend',
  future_score: 'future',
  health_score: 'health',
  past_score: 'past',
  value_score: 'value',
  total_score: 'total',
};

export function isSnowflakeKey(key: string): key is SnowflakeKeys {
  const snowflakeKeysAsStrings: readonly string[] = SNOWFLAKE_KEYS;
  return snowflakeKeysAsStrings.includes(key);
}
