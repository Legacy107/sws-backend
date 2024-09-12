import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { join } from 'path';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { formatError } from 'src/common/format/graphql-error.format';
import { GqlThrottlerGuard } from 'src/common/guards/throttler.guard';

import { getEnvPath } from '../common/helper/env.helper';
import { CompanyModule } from './company.module';

describe('CompanyModule', () => {
  let app: INestApplication;
  let savedId: string;

  beforeAll(async () => {
    const datasource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [join(process.cwd(), 'src', '**', '*.entity.{ts,js}')],
      synchronize: true,
    });

    await datasource.initialize();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: getEnvPath(process.cwd()),
        }),
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
          driver: ApolloDriver,
          useFactory: () => ({
            context: ({ req }) => ({ req }),
            cache: 'bounded',
            formatError,
            autoSchemaFile: join(process.cwd(), 'test/graphql-schema.gql'),
            sortSchema: true,
          }),
        }),
        ThrottlerModule.forRoot([
          {
            ttl: 60,
            limit: 10,
          },
        ]),
        CompanyModule,
      ],
    })
      .overrideProvider(DataSource)
      .useValue(datasource)
      .overrideProvider(GqlThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const created = {
    name: 'sampleString',
  };

  it('create', async () => {
    const keyName = 'createOneCompany';

    const gqlQuery = {
      query: `
        mutation CreateOneCompany($input: CreateOneCompanyInput!) {
          ${keyName}(input: $input) {
            id
            ${Object.keys(created).join('\n')}
          }
        }
      `,
      variables: {
        input: {
          company: {
            id: '46B285BC-B25F-4814-985C-390A4BFA2023',
            ...created,
          },
        },
      },
    };

    await request(app.getHttpServer())
      .post('/graphql')
      .send(gqlQuery)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK)
      .expect(({ body: { data } }) => {
        const { id } = data[keyName];
        savedId = id;
        expect(data[keyName]).toMatchObject(created);
      });
  });

  it('getMany', async () => {
    const keyName = 'companies';

    const gqlQuery = {
      query: `
        query {
          ${keyName} {
            nodes {
              ${Object.keys(created).join('\n')}
            }
          }
        }
      `,
    };

    await request(app.getHttpServer())
      .post('/graphql')
      .send(gqlQuery)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK)
      .expect(({ body: { data } }) => {
        expect(data[keyName]).toMatchObject({ nodes: [created] });
      });
  });

  it('getOne', async () => {
    const keyName = 'company';

    const gqlQuery = {
      query: `
        query ($companyId: ID!) {
          ${keyName} (id: $companyId) {
            ${Object.keys(created).join('\n')}
          }
        }
      `,
      variables: {
        companyId: savedId,
      },
    };

    await request(app.getHttpServer())
      .post('/graphql')
      .send(gqlQuery)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK)
      .expect(({ body: { data } }) => {
        expect(data[keyName]).toMatchObject(created);
      });
  });
});
