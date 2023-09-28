import { Branch } from './entities/branch.entity';
import { BRANCHES_REPOSITORY } from '../../../shared/constants';

export const branchesProviders = [
  {
    provide: BRANCHES_REPOSITORY,
    useValue: Branch,
  },
];
