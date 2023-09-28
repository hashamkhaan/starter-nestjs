import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ROLES_REPOSITORY } from '../../../shared/constants';
import { Role } from './entities/role.entity';
import { Right } from '../rights';
import { AddRightsInRoleDto } from './dto/addRightsInRole.dto';
import { RoleRight } from '../role-right';
import { sequelize, Transaction } from '../../../database/sequelize.provider'; // Adjust the path accordingly
import { ResponseService } from '../../../common/utility/response/response.service';
import { EXCEPTION } from '../../../shared/messages.constants';

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private rolesRepository: typeof Role,
    private readonly responseService: ResponseService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const t: Transaction = await sequelize.transaction();

    try {
      const { rights, ...rest } = createRoleDto;

      const newRole = await this.rolesRepository.create(
        { name: rest.name, description: rest.description },
        { transaction: t },
      );
      if (rights) {
        await Promise.all(
          rights.map(async (rightId) => {
            await RoleRight.create(
              {
                roleId: newRole.id,
                rightId: rightId,
              },
              { transaction: t },
            );
          }),
        );
      }
      await t.commit();

      return this.responseService.createResponse(
        HttpStatus.OK,
        newRole,
        'Role Added',
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
  async addRightsInRole(addRightsInRoleDto: AddRightsInRoleDto) {
    const t: Transaction = await sequelize.transaction();

    try {
      const { roleId, rights } = addRightsInRoleDto;
      if (rights) {
        await Promise.all(
          rights.map(async (rightData) => {
            await RoleRight.create(
              {
                roleId,
                rightId: rightData.id,
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
        'Rights Added',
      );
    } catch (error) {
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }

  async findAll(): Promise<Role[]> {
    try {
      const role = await this.rolesRepository.findAll({
        include: [Right],
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        role,
        'Roles Fetched',
      );
    } catch (error) {
      // await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }

  async findOne(id: number) {
    try {
      const role = await this.rolesRepository.findByPk(id, {
        include: Right,
      });
      const rightsIds = role.rights.map((right) => right.id);
      return this.responseService.createResponse(
        HttpStatus.OK,
        { ...role.toJSON(), rights: rightsIds },
        'role retrieved successfully',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const t = await sequelize.transaction(); // Start the transaction

    try {
      const { name, description, rights } = updateRoleDto;
      const existingRole = await Role.findByPk(id, {
        include: [{ model: Right }],
      });

      if (!existingRole) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Role not found',
        );
      }

      // Update the role details
      await existingRole.update({ name, description }, { transaction: t });

      // Fetch the existing rights associated with the role
      const existingRightsIds = existingRole.rights.map((right) => right.id);

      // Find the new rights to be added
      const newRights = rights.filter(
        (rightId) => !existingRightsIds.includes(rightId),
      );
      // Find the rights to be removed
      const rightsToRemove = existingRightsIds.filter(
        (rightId) => !rights.some((right) => right === rightId),
      );

      // Remove rights from the role
      await Promise.all(
        rightsToRemove.map(async (rightId) => {
          const right = await Right.findByPk(rightId);
          if (right) {
            await RoleRight.destroy({
              where: { roleId: id, rightId },
              transaction: t,
            });
          }
        }),
      );
      // Add new rights to the role

      await Promise.all(
        newRights.map(async (rightId) => {
          const right = await Right.findByPk(rightId);
          if (right) {
            await RoleRight.create(
              {
                roleId: id,
                rightId: rightId,
              },
              { transaction: t },
            );
          }
        }),
      );

      // Commit the transaction after the update is successful
      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Role updated successfully',
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

  async remove(id: number): Promise<void> {
    const t: Transaction = await sequelize.transaction();

    try {
      const role = await this.rolesRepository.findByPk(id);
      if (!role) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'role not found',
        );
      }
      await RoleRight.destroy({ where: { roleId: id }, transaction: t });

      await role.destroy({ transaction: t });
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
  async getDropdown() {
    try {
      const dropdownsArray = await this.rolesRepository.findAll({
        attributes: ['id', 'name'],
        // include: [Right],
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
  async getRightsDropdown() {
    try {
      const dropdownsArray = await Right.findAll({
        attributes: ['id', 'name'],
        // include: [Right],
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
}
