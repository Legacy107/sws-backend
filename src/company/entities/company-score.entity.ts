import { Field, ID, ObjectType } from '@nestjs/graphql';

import {
  FilterableField,
  FilterableRelation,
  IDField,
  PagingStrategies,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  ObjectType as TypeOrmObjectType,
} from 'typeorm';

import { Company, CompanyDTO } from './company.entity';

@Entity('swsCompanyScore')
export class CompanyScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uniqueidentifier' })
  company_id: string;

  @Column({ type: 'datetime' })
  date_generated: Date;

  @Column({ type: 'int' })
  dividend: number;

  @Column({ type: 'int' })
  future: number;

  @Column({ type: 'int' })
  health: number;

  @Column({ type: 'int' })
  management: number;

  @Column({ type: 'int' })
  past: number;

  @Column({ type: 'int' })
  value: number;

  @Column({ type: 'int' })
  misc: number;

  @Column({ type: 'int' })
  total: number;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  sentence?: string;

  @OneToOne(
    (): TypeOrmObjectType<Company> => Company,
    (company) => company.score,
  )
  @JoinColumn({ name: 'company_id' })
  company!: Relation<Company>;
}

@ObjectType('CompanyScore')
@QueryOptions({ pagingStrategy: PagingStrategies.OFFSET })
@FilterableRelation('company', () => CompanyDTO)
export class CompanyScoreDTO {
  @IDField(() => ID)
  id: number;

  @FilterableField(() => String)
  company_id: string;

  @FilterableField(() => Date)
  date_generated: Date;

  @FilterableField(() => Number)
  dividend: number;

  @FilterableField(() => Number)
  future: number;

  @FilterableField(() => Number)
  health: number;

  @FilterableField(() => Number)
  management: number;

  @FilterableField(() => Number)
  past: number;

  @FilterableField(() => Number)
  value: number;

  @FilterableField(() => Number)
  misc: number;

  @FilterableField(() => Number)
  total: number;

  @Field(() => String, { nullable: true })
  sentence?: string;
}
