import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  // HttpException,
  // HttpStatus,
  Query,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  SUPERADMIN_SUBJECT,
  SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT,
} from 'src/common/aclSubjects';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Controller('departments')
@UseGuards(RolesGuard)
@Roles(SUPERADMIN_SUBJECT)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const branch = await this.departmentsService.create(createDepartmentDto);
    return branch;
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }
  @Get('dropdown')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  getDropdown(@Query('branchId') branchId?: number) {
    return this.departmentsService.getDropdown(branchId);
  }
  @Get('departmentsdropdown')
  @Roles(SUPERADMIN_ALL_COMPANIES_ADMIN_SUBJECT)
  getDepartmentsdropdown() {
    return this.departmentsService.getDepartmentsdropdown();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(+id, updateDepartmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(+id);
  }
}
