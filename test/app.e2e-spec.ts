import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as request from 'supertest';

import { AppModule } from 'src/app.module';

describe('Container Test (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Health Check', () => {
    return request(app.getHttpServer()).get('/health').expect(HttpStatus.OK);
  });

  const created = {
    id: '46B285BC-B25F-4814-985C-390A4BFA2023',
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
          company: created,
        },
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
        companyId: created.id,
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
