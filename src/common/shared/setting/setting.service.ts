import { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';

import { formatError } from 'src/common/format/graphql-error.format';

import { UtilService } from '../services/util.service';

@Injectable()
export class SettingService {
  constructor(private readonly utilService: UtilService) {}

  get graphqlUseFactory():
    | Omit<ApolloDriverConfig, 'driver'>
    | (Promise<Omit<ApolloDriverConfig, 'driver'>> & { uploads: boolean }) {
    return {
      uploads: false,
      autoSchemaFile: join(
        process.cwd(),
        `${this.utilService.nodeEnv === 'test' ? 'test' : 'src'}/graphql-schema.gql`,
      ),
      sortSchema: true,
      playground: false,
      ...(!this.utilService.isProduction && {
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
      }),
      context: ({ req, res }) => ({ req, res }),
      cache: 'bounded',
      formatError:
        this.utilService.nodeEnv === 'production' ? formatError : undefined,
    };
  }

  get typeOrmUseFactory():
    | TypeOrmModuleOptions
    | Promise<TypeOrmModuleOptions> {
    return {
      type: 'sqlite',
      database:
        this.utilService.nodeEnv === 'test'
          ? ':memory:'
          : join(process.cwd(), this.utilService.getString('DB_FILE_PATH')),
      entities:
        this.utilService.nodeEnv === 'test'
          ? [join(process.cwd(), 'src', '**', '*.entity.{ts,js}')]
          : ['dist/**/*.entity.js'],
      synchronize: this.utilService.nodeEnv !== 'production',
      autoLoadEntities: true,
      dropSchema: this.utilService.nodeEnv === 'test',
      logging: true, // if you want to see the query log, change it to true
    };
  }

  get throttleUseFactory():
    | ThrottlerModuleOptions
    | Promise<ThrottlerModuleOptions> {
    return [
      {
        ttl: this.utilService.getNumber('THROTTLE_TTL'),
        limit: this.utilService.getNumber('THROTTLE_LIMIT'),
      },
    ];
  }
}
