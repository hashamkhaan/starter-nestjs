import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,

  // HttpStatus,
  // HttpException,
} from '@nestjs/common';
import { CurrentCompanyId } from 'src/common/decorators/currentCompanyId.decorator';

import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

import { AddBranchWithDepartmentsInCompanyDto } from './dto/addBranchWithDepartmentsInCompany.dto';
import { AddNewDepartmentInBranchCompanyDto } from './dto/addNewDepartmentInBranchCompany.dto';
import { ToggleIsActiveDto } from 'src/shared/dtos/toggleIsActive.dto';
import {
  SUPERADMIN_SUBJECT,
  SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT,
} from 'src/common/aclSubjects';
@Controller('companies')
@UseGuards(RolesGuard)
@Roles(SUPERADMIN_SUBJECT)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return await this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get('dropdown')
  getDropdowns() {
    return this.companiesService.getDropdown();
  }
  @Get('typesDropdown')
  getTypesDropdown() {
    return this.companiesService.getTypesDropdown();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(+id, updateCompanyDto);
  }
  @Patch('toggleIsActive/:id')
  toggleIsActive(
    @Param('id') id: string,
    @Body() toggleIsActiveDto: ToggleIsActiveDto,
  ) {
    return this.companiesService.toggleIsActive(+id, toggleIsActiveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // dshdjkshj
    return this.companiesService.remove(+id);
  }

  @Post('addBranchWithDepartmentsInCompany')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  async addBranchWithDepartmentsInCompany(
    @CurrentCompanyId() currentCompanyId: number,
    @Body()
    addBranchWithDepartmentsInCompanyDto: AddBranchWithDepartmentsInCompanyDto,
  ) {
    return await this.companiesService.addBranchWithDepartmentsInCompany(
      currentCompanyId,
      addBranchWithDepartmentsInCompanyDto,
    );
  }

  @Post('addNewDepartmentInBranchCompany')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  async addNewDepartmentInBranchCompany(
    @CurrentCompanyId() currentCompanyId: number,
    @Body()
    addNewDepartmentInBranchCompanyDto: AddNewDepartmentInBranchCompanyDto,
  ) {
    return await this.companiesService.addNewDepartmentInBranchCompany(
      currentCompanyId,
      addNewDepartmentInBranchCompanyDto,
    );
  }
  @Delete('deleteBranchInCompany/:id')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  deleteBranchInCompany(@Param('id') id: string) {
    return this.companiesService.deleteBranchInCompany(+id);
  }
  @Delete('deleteDepartmentInCompanyBranch/:id')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  deleteDepartmentInCompanyBranch(@Param('id') id: string) {
    return this.companiesService.deleteDepartmentInCompanyBranch(+id);
  }
}
