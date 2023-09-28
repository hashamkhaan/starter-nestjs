import { Sequelize } from 'sequelize-typescript';
import { Transaction, Op } from 'sequelize';
import { databaseConfig } from 'src/database/config/default';

import { User } from '../modules/generalModules/users/entities/user.entity';
import { Branch } from '../modules/generalModules/branches/entities/branch.entity';
import { Department } from '../modules/generalModules/departments/entities/department.entity';
import { CompanyBranchDepartment } from '../modules/generalModules/companyBranch-department';
import { CompanyBranch } from '../modules/generalModules/company-branch';
import { RoleRight } from '../modules/generalModules/role-right/index';
import { Right } from '../modules/generalModules/rights';
import { Role } from '../modules/generalModules/roles/entities/role.entity';
import { CompanyBranchDepartmentUserRoles } from '../modules/generalModules/company-branch-department-user-roles/index';
import { Company } from '../modules/generalModules/companies/entities/company.entity';
import { CompanyType } from '../modules/generalModules/company-types';
import { UserCompanyBranchDepartment } from '../modules/generalModules/user-companyBranchDepartment';
import { City } from '../modules/generalModules/cities';
import { UserProfile } from '../modules/generalModules/users/entities/userProfile.entity';

const dbConfig = databaseConfig[process.env.NODE_ENV || 'development']; // Load the appropriate config based on environment
const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  dialectOptions: dbConfig.dialectOptions,
});

sequelize.addModels([
  User,
  Branch,
  Department,
  CompanyBranchDepartment,
  CompanyBranch,
  Right,
  Role,
  RoleRight,
  CompanyBranchDepartmentUserRoles,
  Company,
  CompanyType,
  UserCompanyBranchDepartment,
  City,
  UserProfile,
]);

// Sync the models with the database, dropping and recreating tables Test233\
sequelize
  // .sync({
  //   force: true,
  // })
  .sync()
  .then(() => {
    console.log('Database synchronized..');
  })
  .catch((error) => {
    console.error('Error synchronizing the database:', error);
  });

export { sequelize, Transaction, Op };
