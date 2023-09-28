/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
  Session,
  Req,
  Query,
} from '@nestjs/common';
import { CurrentCompanyId } from 'src/common/decorators/currentCompanyId.decorator';
import { ToggleIsActiveDto } from 'src/shared/dtos/toggleIsActive.dto';

import { getUserCompanyId } from '../../auth/getUserDecodedData';

import { RolesGuard } from '../../../common/guards/roles.guard';

// import { AuthGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { SessionData } from 'express-session';
import {
  SUPERADMIN_SUBJECT,
  SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT,
} from 'src/common/aclSubjects';

@Controller('branches')
@UseGuards(RolesGuard)
@Roles(SUPERADMIN_SUBJECT)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  async create(@Body() createBranchDto: CreateBranchDto) {
    try {
      const result = await this.branchesService.create(createBranchDto);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  @Post('tempApi')
  async tempApi(@Body() tempBody: any) {
    try {
      const result = await this.branchesService.tempApi(tempBody);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }
  @Get('thisCompany')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  getBranchesByThisCompanyAPI(@CurrentCompanyId() currentCompanyId: number) {
    return this.branchesService.getBranchesByThisCompanyAPI(currentCompanyId);
  }
  @Get('thisCompany/:id')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  findOneThisCompany(
    @CurrentCompanyId() currentCompanyId: number,
    @Param('id') id: string,
  ) {
    return this.branchesService.findOneThisCompany(currentCompanyId, +id);
  }
  @Get('getExampleData')
  async getExampleData(@Session() session: SessionData, @Req() req: Request) {
    // const companyId = session.companyId;
    const decodedUserData = getUserCompanyId(req);

    return {
      message: 'Company-specific data',
      companyId: req['user'].companyId,
      decodedUserData,
      // ... other data ...
    };
  }
  @Get('dropdown')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  getDropdown(
    @CurrentCompanyId() currentCompanyId: number,
    @Query('companyId') companyId?: number,
  ) {
    return this.branchesService.getDropdown(currentCompanyId, companyId);
  }
  @Get('citiesDropdown')
  @Roles(SUPERADMIN_SUBJECT)
  getCitiesDropdown() {
    return this.branchesService.getCitiesDropdown();
  }
  @Get('branchesDropdown')
  getBranchesDropdown() {
    return this.branchesService.getBranchesDropdown();
  }
  @Get('simpleBranchesWhereNotInCompanyDropdown')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  getSimpleBranchesWhereNotInCompanyDropdown(
    @CurrentCompanyId() currentCompanyId: number,
    @Query('companyId') companyId: number,
  ) {
    return this.branchesService.getSimpleBranchesWhereNotInCompanyDropdown(
      currentCompanyId,
      companyId,
    );
  }
  @Get('getCompanyBranchDepDropdown')
  getCompanyBranchDepDropdown() {
    return this.branchesService.getCompanyBranchDepDropdown();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(+id);
  }

  @Patch('thisCompany/:id')
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(+id, updateBranchDto);
  }
  @Patch('toggleIsActive/:id')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  toggleIsActive(
    @CurrentCompanyId() currentCompanyId: number,

    @Param('id') id: string,
    @Body() toggleIsActiveDto: ToggleIsActiveDto,
  ) {
    return this.branchesService.toggleIsActive(
      currentCompanyId,
      +id,
      toggleIsActiveDto,
    );
  }
  @Patch(':id')
  updateThisCompany(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.updateThisCompany(+id, updateBranchDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(+id);
  }
}
