import { ExtendedRepository } from 'src/common/graphql/customExtended';

import { CustomRepository } from '../common/decorators/typeorm.decorator';
import { Company } from './entities/company.entity';

@CustomRepository(Company)
export class CompanyRepository extends ExtendedRepository<Company> {}
