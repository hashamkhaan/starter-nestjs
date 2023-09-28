import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DEPARTMENTS_REPOSITORY } from '../../../shared/constants';
import { Department } from './entities/department.entity';
import { CompanyBranchDepartment } from '../companyBranch-department';
import { ResponseService } from '../../../common/utility/response/response.service';
import { EXCEPTION } from '../../../shared/messages.constants';

@Injectable()
export class DepartmentsService {
  constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private departmentsRepository: typeof Department,
    private readonly responseService: ResponseService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      const newCompany = await this.departmentsRepository.create(
        {
          name: createDepartmentDto.name,
          description: createDepartmentDto.name,
        },
        // { transaction: t },
      );
      return this.responseService.createResponse(
        HttpStatus.OK,
        newCompany,
        'Success',
      );
    } catch (error) {
      // await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }

  async findAll(): Promise<Department[]> {
    try {
      const departments = await this.departmentsRepository.findAll({});

      return this.responseService.createResponse(
        HttpStatus.OK,
        departments,
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
  async findOne(id: number) {
    try {
      const department = await this.departmentsRepository.findByPk(id);
      return this.responseService.createResponse(
        HttpStatus.OK,
        department,
        'department retrieved successfully',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    try {
      const department = await this.departmentsRepository.findByPk(id);
      if (!department) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Department not found',
        );
      }
      department.name = updateDepartmentDto.name || department.name; // Update if provided, otherwise keep the existing value
      department.description =
        updateDepartmentDto.description || department.description;

      await department.save(); // Save the changes

      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Success',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const department = await this.departmentsRepository.findByPk(id);
      if (!department) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Department not found',
        );
      }
      await department.destroy();
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
  //
  async getDropdown(branchId: number) {
    try {
      const whereOptions: any = {};
      if (branchId) {
        whereOptions.companyBranchId = branchId;
      }
      const dropdownsArray = await CompanyBranchDepartment.findAll({
        where: whereOptions,
        include: [
          {
            model: Department,
          },
        ],
      });
      let departments = [];
      departments = dropdownsArray.map((department) => ({
        id: department.id,
        departmentId: department.departmentId,
        name: department.department.name,
      }));
      return this.responseService.createResponse(
        HttpStatus.OK,
        departments,
        'Success',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
  async getDepartmentsdropdown() {
    try {
      const dropdownsArray = await Department.findAll({});
      let departments = [];
      departments = dropdownsArray.map((department) => ({
        id: department.id,
        name: department.name,
      }));
      return this.responseService.createResponse(
        HttpStatus.OK,
        departments,
        'Success',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
}
