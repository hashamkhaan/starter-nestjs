import { Department } from './entities/department.entity';
import { DEPARTMENTS_REPOSITORY } from '../../../shared/constants';

export const departmentsProviders = [
  {
    provide: DEPARTMENTS_REPOSITORY,
    useValue: Department,
  },
];
