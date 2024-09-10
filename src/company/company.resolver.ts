import { Resolver } from '@nestjs/graphql';

import { InjectQueryService } from '@ptc-org/nestjs-query-core';
import { CRUDResolver } from '@ptc-org/nestjs-query-graphql';

import { CompanyService } from './company.service';
import { Company, CompanyDTO } from './entities/company.entity';

@Resolver(() => CompanyDTO)
export class CompanyResolver extends CRUDResolver(CompanyDTO, {
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true },
}) {
  constructor(@InjectQueryService(Company) readonly service: CompanyService) {
    super(service);
  }
}
