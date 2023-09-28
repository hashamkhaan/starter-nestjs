import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { ResponseService } from '../../common/utility/response/response.service';

import { Reflector } from '@nestjs/core';

import { User } from '../../modules/generalModules/users/entities/user.entity';
import { CompanyBranchDepartmentUserRoles } from '../../modules/generalModules/company-branch-department-user-roles/company-branch-department-user-role.entity';
// import { CompanyBranchDepartment } from '../../modules/generalModules/company-branch-department';
import { Role } from '../../modules/generalModules/roles/entities/role.entity';
import { Right } from '../../modules/generalModules/rights/right.entity';
import { Company } from '../../modules/generalModules/companies/entities/company.entity';
// import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly responseService: ResponseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let requiredGuardParams = this.reflector.get<any>(
      'guardParams',
      context.getHandler(),
    );
    if (!requiredGuardParams)
      requiredGuardParams = this.reflector.get<any>(
        'guardParams',
        context.getClass(),
      );
    if (!requiredGuardParams) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }
    const userId = user.id;
    const userRights = await this.findUserRights(userId);
    for (const sub of requiredGuardParams) {
      const allowedRoles = sub.roles || [];
      const allowedBranchId = sub.branchId;
      const allowedDepartmentId = sub.departmentId;
      const allowedCompanyId = sub.companyId;
      const allowedCompanyTypeId = sub.companyTypeId;

      const isAllowed = userRights.some((right) => {
        const isMatchingBranch =
          allowedBranchId === 0 || right.branchId === allowedBranchId;
        // ||
        // right.branchId === null;
        const isMatchingDepartment =
          allowedDepartmentId === 0 ||
          right.departmentId === allowedDepartmentId;
        //  ||
        // right.departmentId === null;
        const isMatchingCompany =
          allowedCompanyId === 0 || right.companyId === allowedCompanyId;
        // ||
        // right.companyId === null;
        const isMatchingCompanyType =
          allowedCompanyTypeId === 0 ||
          right.companyTypeId === allowedCompanyTypeId;
        // ||          right.companyTypeId === null;

        return (
          (allowedRoles.length === 0 || allowedRoles.includes(right.rightId)) &&
          isMatchingBranch &&
          isMatchingDepartment &&
          isMatchingCompany &&
          isMatchingCompanyType
        );
      });
      if (isAllowed) {
        return true;
      }
    }
    return false;
    // return requiredGuardParams.includes(user.role);
  }
  async findUserRights(userId: number): Promise<any> {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: CompanyBranchDepartmentUserRoles,
            include: [
              { model: Company },
              { model: Role, include: [{ model: Right }] },
            ],
          },
        ],
      });
      if (!user) {
        return this.responseService.createResponse(
          HttpStatus.BAD_REQUEST,
          null,
          'User Not Found',
        );
      }
      const userRightsArray = [];
      if (user && user.userRoles) {
        user.userRoles.forEach((branchDepartment) => {
          if (branchDepartment.role) {
            branchDepartment.role.rights.forEach((right) => {
              if (
                branchDepartment.company === null ||
                branchDepartment.company.isActive === 1
              )
                userRightsArray.push({
                  companyTypeId:
                    branchDepartment.company?.companyTypeId || null,
                  companyId: branchDepartment.companyId,
                  branchId: branchDepartment.branchId,
                  departmentId: branchDepartment.departmentId,
                  roleName: branchDepartment.role.name,
                  rightId: right.id,
                  rightName: right.name,
                });
            });
          }
        });
      }

      return userRightsArray;
    } catch (error) {
      console.error('Error finding user rights:', error);
      return null;
    }
  }
}
