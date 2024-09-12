import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SortDirection } from '@ptc-org/nestjs-query-core';

import {
  MockQueryService,
  MockQueryServiceFactory,
  MockRepository,
  MockRepositoryFactory,
} from 'src/common/factory/mockFactory';
import { ExtendedRepository } from 'src/common/graphql/customExtended';
import { UtilModule } from 'src/common/shared/services/util.module';
import { UtilService } from 'src/common/shared/services/util.service';

import { CompanyRepository } from './company.repository';
import { CompanyQuery, CompanyService } from './company.service';
import { Company, CompanyDTO } from './entities/company.entity';

describe('CompanyService', () => {
  let service: CompanyService;
  let mockedRepository: MockRepository<ExtendedRepository<Company>>;
  let mockedQueryService: MockQueryService<Company>;
  let utilService: UtilService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UtilModule],
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(CompanyRepository),
          useFactory:
            MockRepositoryFactory.getMockRepository(CompanyRepository),
        },
        {
          provide: 'CompanyQueryService',
          useFactory: MockQueryServiceFactory.getMockQueryService<Company>(),
        },
      ],
    }).compile();

    utilService = module.get<UtilService>(UtilService);
    service = module.get<CompanyService>(CompanyService);
    mockedQueryService = module.get<MockQueryService<Company>>(
      'CompanyQueryService',
    );
    mockedRepository = module.get<MockRepository<ExtendedRepository<Company>>>(
      getRepositoryToken(CompanyRepository),
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('query', () => {
    it('should return a list of companies', async () => {
      const query: CompanyQuery = {
        paging: { offset: 0, limit: 10 },
        sorting: [],
        filter: {},
      };

      const companies: CompanyDTO[] = [
        {
          id: utilService.getRandomUUID,
          name: 'Company 1',
          unique_symbol: 'C1',
        },
        {
          id: utilService.getRandomUUID,
          name: 'Company 2',
          unique_symbol: 'C2',
        },
      ] as any;

      const mockedQueryBuilder = {
        applyFilter: jest.fn().mockImplementation((qb) => qb),
        applySorting: jest.fn().mockImplementation((qb) => qb),
      };
      // @ts-expect-error: ignore type on mocked object
      mockedQueryService.filterQueryBuilder = mockedQueryBuilder;

      jest
        // @ts-expect-error: ignore type on mocked object
        .spyOn(service, 'getQuerySelectedFields')
        // @ts-expect-error: ignore type on mocked object
        .mockReturnValue([
          'Company.id',
          'Company.name',
          'Company.unique_symbol',
        ]);
      jest.spyOn(mockedRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(companies),
      } as any);

      const result = await service.query(query);
      expect(result).toEqual(companies);
    });
  });

  describe('getQuerySelectedFields', () => {
    it('should return selected fields excluding specific keys', () => {
      const opts = {
        resolveInfo: {
          fields: {
            nodes: {
              fields: {
                id: {},
                name: {},
                unique_symbol: {},
                score: {},
                price: {},
                price_fluctuation: {},
              },
            },
          },
        },
      };

      // @ts-expect-error: access private method
      const result = service.getQuerySelectedFields(opts);
      expect(result).toEqual([
        'Company.id',
        'Company.name',
        'Company.unique_symbol',
      ]);
    });
  });

  describe('applyScoreFilterAndSorting', () => {
    it('should apply score filter and sorting', () => {
      const query: CompanyQuery = {
        sorting: [{ field: 'total_score', direction: SortDirection.ASC }],
        filter: { total_score: { gt: 50 } },
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
      } as any;

      const filterQueryBuilder = {
        applyFilter: jest.fn().mockImplementation((qb) => qb),
      };
      // @ts-expect-error: ignore type on mocked object
      mockedQueryService.filterQueryBuilder = filterQueryBuilder;

      // @ts-expect-error: access private method
      const result = service.applyScoreFilterAndSorting(query, queryBuilder);
      expect(result).toEqual(queryBuilder);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'Company.score',
        'score',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'score.total',
        'ASC',
      );
    });
  });

  describe('applyPriceFluctuationSorting', () => {
    it('should apply price fluctuation sorting', () => {
      const query: CompanyQuery = {
        sorting: [
          { field: 'price_fluctuation', direction: SortDirection.DESC },
        ],
        filter: {},
      };

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
      } as any;

      // @ts-expect-error: access private method
      const result = service.applyPriceFluctuationSorting(query, queryBuilder);
      expect(result).toEqual(queryBuilder);
      expect(queryBuilder.leftJoin).toHaveBeenCalled();
      expect(queryBuilder.addSelect).toHaveBeenCalledWith(
        'PriceFluctuation.price_fluctuation',
        'price_fluctuation',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'PriceFluctuation.price_fluctuation',
        'DESC',
      );
    });
  });
});
