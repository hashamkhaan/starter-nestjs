/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { COMPANIES_REPOSITORY } from '../../../shared/constants';
import { Company } from './entities/company.entity';
import { CompanyBranchDepartment } from '../companyBranch-department';
import { CompanyBranch } from '../company-branch';
import { CompanyType } from '../company-types';
import { Department } from '../departments/entities/department.entity';
import { Branch } from '../branches/entities/branch.entity';
import { sequelize, Transaction } from '../../../database/sequelize.provider'; // Adjust the path accordingly
import { ResponseService } from '../../../common/utility/response/response.service';
import { EXCEPTION } from '../../../shared/messages.constants';
import { City } from '../cities';
import { AddBranchWithDepartmentsInCompanyDto } from './dto/addBranchWithDepartmentsInCompany.dto';
import { AddNewDepartmentInBranchCompanyDto } from './dto/addNewDepartmentInBranchCompany.dto';
import { ToggleIsActiveDto } from 'src/shared/dtos/toggleIsActive.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @Inject(COMPANIES_REPOSITORY)
    private companiesRepository: typeof Company,
    private readonly responseService: ResponseService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const t: Transaction = await sequelize.transaction();

    try {
      const { branches, ...rest } = createCompanyDto;

      const newCompany = await this.companiesRepository.create(
        {
          name: rest.name,
          companyTypeId: rest.companyTypeId,
          description: rest.description,
        },
        { transaction: t },
      );

      if (branches.length > 0) {
        await Promise.all(
          branches.map(async (branchData) => {
            const companyBranch = await CompanyBranch.create(
              {
                companyId: newCompany.id,
                branchId: branchData,
              },
              { transaction: t },
            );
            // if (branchData.departments) {
            //   await Promise.all(
            //     branchData.departments.map(async (departmentData) => {
            //       await CompanyBranchDepartment.create(
            //         {
            //           companyBranchId: companyBranch.id,
            //           departmentId: departmentData.id,
            //         },
            //         { transaction: t },
            //       );
            //     }),
            //   );
            // } else {
            //   return this.responseService.createResponse(
            //     HttpStatus.INTERNAL_SERVER_ERROR,
            //     null,
            //     'Provide atleast one department',
            //   );
            // }
          }),
        );
      }

      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        newCompany,
        'Success',
      );
    } catch (error) {
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }

  async findAll() {
    try {
      const companiesWithBranchesCount = await this.companiesRepository.findAll(
        {
          attributes: {
            include: [
              [
                // Note the wrapping parentheses in the call below!
                sequelize.literal(`(
                      SELECT COUNT(*)
                      FROM CompanyBranches AS companyBranches
                      WHERE
                      companyBranches.companyId = company.id
                         
                  )`),
                'companyBranchesCount',
              ],
            ],
          },
          include: [
            {
              model: CompanyBranch,
              include: [
                {
                  model: Branch,
                },
                {
                  model: CompanyBranchDepartment,
                  include: [
                    {
                      model: Department,
                    },
                  ],
                },
              ],
            },
            {
              model: CompanyType,
            },
          ],
          // raw: true,
        },
      );

      return this.responseService.createResponse(
        HttpStatus.OK,
        companiesWithBranchesCount,
        'Success',
      );
    } catch (error) {
      console.log(error);
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }

  async findOne(id: number) {
    try {
      const company = await this.companiesRepository.findByPk(id, {
        include: [
          {
            model: CompanyBranch,

            include: [
              {
                model: Branch,
                include: [
                  {
                    model: City,
                  },
                ],
              },
              {
                model: CompanyBranchDepartment,
                include: [
                  {
                    model: Department,
                  },
                ],
              },
            ],
          },

          {
            model: CompanyType,
          },
        ],
      });

      return this.responseService.createResponse(
        HttpStatus.OK,
        company,
        'Success',
      );
    } catch (error) {
      console.log(error);
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.companiesRepository.findByPk(id);
    if (!company) {
      return this.responseService.createResponse(
        HttpStatus.NOT_FOUND,
        null,
        'company not found',
      );
    }
    const { name, description } = updateCompanyDto;
    company.name = name;
    company.description = description;
    await company.save(); // Save the changes

    return this.responseService.createResponse(HttpStatus.OK, null, 'Success');
  }

  remove(id: number) {
    return `This action removes a #${id} company`;
  }

  async getDropdown() {
    try {
      const dropdownsArray = await this.companiesRepository.findAll({
        attributes: ['id', 'name'],
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        dropdownsArray,
        'Success',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }
  async getTypesDropdown() {
    try {
      const dropdownsArray = await CompanyType.findAll({
        attributes: ['id', 'name'],
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        dropdownsArray,
        'Success',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }
  async addBranchWithDepartmentsInCompany(
    currentCompanyId: number,
    addBranchWithDepartmentsInCompanyDto: AddBranchWithDepartmentsInCompanyDto,
    // companyId,
  ) {
    const t: Transaction = await sequelize.transaction();

    try {
      let companyId = null;
      const { departments, branchId } = addBranchWithDepartmentsInCompanyDto;
      if (currentCompanyId) {
        companyId = currentCompanyId;
      } else {
        companyId = addBranchWithDepartmentsInCompanyDto.companyId;
      }
      if (departments) {
        // let companyBranch = null;
        let companyBranch = await CompanyBranch.findOne({
          where: {
            companyId,
            branchId,
          },
        });

        if (!companyBranch) {
          companyBranch = await CompanyBranch.create(
            {
              companyId,
              branchId,
            },
            { transaction: t },
          );
        }
        await Promise.all(
          departments.map(async (departmentId) => {
            await CompanyBranchDepartment.create(
              {
                companyBranchId: companyBranch.id,
                departmentId: departmentId,
              },
              { transaction: t },
            );
          }),
        );
      }

      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Branch with department added successfully',
      );
    } catch (error) {
      // console.log(error);
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
  async addNewDepartmentInBranchCompany(
    currentCompanyId: number,
    addNewDepartmentInBranchCompanyDto: AddNewDepartmentInBranchCompanyDto,
    // companyId,
  ) {
    const t: Transaction = await sequelize.transaction();

    try {
      let companyId = null;
      const { departmentId, branchId } = addNewDepartmentInBranchCompanyDto;
      if (currentCompanyId) {
        companyId = currentCompanyId;
      } else {
        companyId = addNewDepartmentInBranchCompanyDto.companyId;
      }
      if (departmentId) {
        // let companyBranch = await CompanyBranch.findOne({
        //   where: {
        //     companyId,
        //     branchId,
        //   },
        // });
        // if (!companyBranch) {
        //   companyBranch = await CompanyBranch.create(
        //     {
        //       companyId,
        //       branchId,
        //     },
        //     { transaction: t },
        //   );
        // }
        if (departmentId) {
          await CompanyBranchDepartment.create(
            {
              companyBranchId: branchId,
              departmentId: departmentId,
            },
            { transaction: t },
          );
        }
      }
      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'department added successfully',
      );
    } catch (error) {
      console.log(error);
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
  async deleteBranchInCompany(id: number) {
    try {
      const branch = await CompanyBranch.findByPk(id);
      if (!branch) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Branch not found',
        );
      }
      await branch.destroy();
      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Success',
      );
    } catch (error) {
      console.log(error);
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
  async deleteDepartmentInCompanyBranch(id: number) {
    try {
      const companyBranchDepartment = await CompanyBranchDepartment.findByPk(
        id,
      );
      if (!companyBranchDepartment) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Department not found',
        );
      }
      await companyBranchDepartment.destroy();
      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Success',
      );
    } catch (error) {
      console.log(error);
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
  async toggleIsActive(
    id: number,
    toggleIsActiveDto: ToggleIsActiveDto,
  ): Promise<any> {
    const t: Transaction = await sequelize.transaction();

    try {
      const user = await this.companiesRepository.findByPk(id);
      if (!user) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'User not found',
        );
      }

      user.isActive = toggleIsActiveDto.isActive || 0;

      await user.save({ transaction: t }); // Save the changes
      await t.commit();

      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Success',
      );
    } catch (error) {
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
}
