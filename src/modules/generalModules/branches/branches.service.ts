import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BRANCHES_REPOSITORY } from '../../../shared/constants';
import { Branch } from './entities/branch.entity';
import { CompanyBranchDepartment } from '../companyBranch-department';
import { CompanyBranch } from '../company-branch';
import { Company } from '../companies/entities/company.entity';
import { CompanyType } from '../company-types';
import { Department } from '../departments/entities/department.entity';
import { sequelize, Transaction } from '../../../database/sequelize.provider'; // Adjust the path accordingly
import { ResponseService } from '../../../common/utility/response/response.service';
import { EXCEPTION } from '../../../shared/messages.constants';
import { ToggleIsActiveDto } from 'src/shared/dtos/toggleIsActive.dto';
import { City } from './../cities/index';
@Injectable()
export class BranchesService {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private branchesRepository: typeof Branch,
    private readonly responseService: ResponseService,
  ) {}

  async create(createBranchDto: CreateBranchDto) {
    const t: Transaction = await sequelize.transaction();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    try {
      const {
        name,
        description,
        cityId,

        code,
        friendlyName,
        address,
        phone,
        email,
      } = createBranchDto;
      const newCompany = await this.branchesRepository.create(
        {
          name: name,
          description: description,
          cityId: cityId,
          code,
          friendlyName,
          address,
          phone,
          email,
        },
        { transaction: t },
      );
      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        newCompany,
        'Branch Created Successfully',
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
  async tempApi(tempBody: any) {
    const t: Transaction = await sequelize.transaction();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    try {
      tempBody.sort((a, b) => {
        const cityA = a.city.toLowerCase();
        const cityB = b.city.toLowerCase();

        if (cityA < cityB) {
          return -1;
        }
        if (cityA > cityB) {
          return 1;
        }
        return 0;
      });
      console.log('tempBody', tempBody[0]);
      tempBody = tempBody.map((cityDto) => ({
        ...cityDto,
        cityCode: cityDto.city, // Replace this with your logic to generate city codes
      }));
      const city = await City.bulkCreate(tempBody);
      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        city,
        'Branch Created Successfully',
      );
    } catch (error) {
      console.log('error', error.message);
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        error.message,
      );
    }
  }

  async findAll(): Promise<Branch[]> {
    try {
      const branches = await this.branchesRepository.findAll({
        include: [{ model: City }],
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        branches,
        'Branches retrieved successfully',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
    // return this.branchesRepository.findAll({
    //   // include: [Department],
    // });
  }

  async findOne(id: number) {
    try {
      const branch = await this.branchesRepository.findByPk(id);
      return this.responseService.createResponse(
        HttpStatus.OK,
        branch,
        'Branch retrieved successfully',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }

  async update(id: number, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    try {
      const branch = await this.branchesRepository.findByPk(id);
      if (!branch) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Branch not found',
        );
      }

      branch.name = updateBranchDto.name || branch.name; // Update if provided, otherwise keep the existing value
      branch.description = updateBranchDto.description || branch.description;
      branch.cityId = updateBranchDto.cityId || branch.cityId;

      await branch.save(); // Save the changes

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
  async updateThisCompany(
    id: number,
    updateBranchDto: UpdateBranchDto,
  ): Promise<Branch> {
    try {
      const branch = await this.branchesRepository.findByPk(id);
      if (!branch) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Branch not found',
        );
      }

      branch.name = updateBranchDto.name || branch.name; // Update if provided, otherwise keep the existing value
      branch.description = updateBranchDto.description || branch.description;

      await branch.save(); // Save the changes

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
  async remove(id: number): Promise<void> {
    try {
      const branch = await this.branchesRepository.findByPk(id);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDropdown(currentCompanyId: number, companyId: number) {
    try {
      const whereOptions: any = {};
      if (currentCompanyId) {
        whereOptions.companyId = currentCompanyId;
      } else {
        whereOptions.companyId = companyId;
      }
      const dropdownsArray = await CompanyBranch.findAll({
        where: whereOptions,
        include: [
          {
            model: Branch,
            include: [{ model: City }],
          },
        ],
      });
      let branches = [];

      branches = dropdownsArray.map((branch) => ({
        id: branch.id,
        name: `${branch.branch.code}-${branch.branch.name}-${branch.branch.city.city}`,
        branchName: branch.branch.name,
        branchCode: branch.branch.code,
        city: branch.branch.city.city,
      }));
      return this.responseService.createResponse(
        HttpStatus.OK,
        branches,
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
  async getCitiesDropdown() {
    try {
      const dropdownsArray = await City.findAll({});
      let branches = [];
      branches = dropdownsArray.map((item) => ({
        id: item.id,
        name: `${item.city} - ${item.cityCode}`,
      }));
      return this.responseService.createResponse(
        HttpStatus.OK,
        branches,
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
  async getBranchesDropdown() {
    try {
      const dropdownsArray = await this.branchesRepository.findAll({});
      let branches = [];
      branches = dropdownsArray.map((branch) => ({
        id: branch.id,
        name: branch.name,
      }));
      return this.responseService.createResponse(
        HttpStatus.OK,
        branches,
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
  async getSimpleBranchesWhereNotInCompanyDropdown(
    currentCompanyId: number,
    companyId: number,
  ) {
    try {
      const whereOptions: any = {};

      if (currentCompanyId) {
        whereOptions.companyId = currentCompanyId;
      } else {
        whereOptions.companyId = companyId;
      }
      const dropdownsArray = await this.branchesRepository.findAll({
        // where: whereOptions,
        include: [{ model: City }],
      });
      let branches = [];
      branches = dropdownsArray.map((branch) => ({
        id: branch.id,
        name: `${branch.code}-${branch.name}-${branch.city.city}`,
        branchName: branch.name,
        branchCode: branch.code,
        city: branch.city.city,
      }));
      return this.responseService.createResponse(
        HttpStatus.OK,
        branches,
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
  async getCompanyBranchDepDropdown() {
    try {
      const dropdownsArray = await Company.findAll({
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
      }).then(async function (a) {
        //you may need to iterate over an array
        return await a.map((company) => ({
          id: company.id,
          name: company.name,
          companyType: {
            id: company.companyType.id,
            name: company.companyType.name,
          },
          branches: Array.isArray(company.companyBranches)
            ? company.companyBranches.map((branch) => ({
                id: branch.id,
                branchId: branch.branchId,
                name: branch.branch.name,
                departments: Array.isArray(branch.companyBranchDepartments)
                  ? branch.companyBranchDepartments.map((department) => ({
                      id: department.id,
                      departmentId: department.departmentId,

                      name: department.department.name,
                    }))
                  : [],
              }))
            : [],
        }));
      });

      return dropdownsArray;
      // return transformedBranches;
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }
  // Company Admin
  async getBranchesByThisCompanyAPI(
    currentCompanyId: number,
  ): Promise<Branch[]> {
    try {
      const branches = await CompanyBranch.findAll({
        where: {
          companyId: currentCompanyId,
        },
        attributes: {
          include: [
            [
              // Note the wrapping parentheses in the call below!
              sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM CompanyBranchDepartments AS companyBranchDepartments
                    WHERE
                    companyBranchDepartments.CompanyBranchId = CompanyBranch.id
                       
                )`),
              'companyBranchDepartmentsCount',
            ],
          ],
        },
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
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        branches,
        'Branches retrieved successfully',
      );
    } catch (error) {
      console.log(error);
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
    // return this.branchesRepository.findAll({
    //   // include: [Department],
    // });
  }
  async findOneThisCompany(currentCompanyId: number, id: number) {
    try {
      const branch = await CompanyBranch.findOne({
        where: {
          id,
          companyId: currentCompanyId,
        },
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
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        branch,
        'Branch retrieved successfully',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }
  async toggleIsActive(
    currentCompanyId: number,
    id: number,
    toggleIsActiveDto: ToggleIsActiveDto,
  ): Promise<any> {
    const t: Transaction = await sequelize.transaction();

    try {
      const whereOptions: any = { id };
      if (currentCompanyId) {
        whereOptions.companyId = currentCompanyId;
      }
      const user = await CompanyBranch.findOne({ where: whereOptions });
      if (!user) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Branch not found',
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
