import { Company } from './entities/company.entity';
import { COMPANIES_REPOSITORY } from '../../../shared/constants';

export const companiesProviders = [
  {
    provide: COMPANIES_REPOSITORY,
    useValue: Company,
  },
];
