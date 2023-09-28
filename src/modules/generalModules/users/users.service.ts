import {
  Injectable,
  Inject,
  HttpStatus,
  //  Session
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ToggleIsActiveDto } from 'src/shared/dtos/toggleIsActive.dto';

import { User } from './entities/user.entity';
import { City } from '../cities';
import { USERS_REPOSITORY } from '../../../shared/constants';
import * as bcrypt from 'bcrypt';
import { databaseConfig } from 'src/database/config/default';

// import { SessionData } from 'express-session';

import { CompanyBranchDepartmentUserRoles } from '../company-branch-department-user-roles';
import { Role } from '../roles/entities/role.entity';
import { Right } from '../rights/right.entity';
import { Company } from '../companies/entities/company.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Department } from '../departments/entities/department.entity';
import { CompanyBranchDepartment } from '../companyBranch-department';
import { CompanyBranch } from '../company-branch';
import { UserCompanyBranchDepartment } from '../user-companyBranchDepartment';
import {
  sequelize,
  Transaction,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Op,
} from '../../../database/sequelize.provider';

import { ResponseService } from '../../../common/utility/response/response.service';
import {
  EXCEPTION,
  GET_SUCCESS,
  SAVED_SUCCESS,
} from '../../../shared/messages.constants';
import { AssignRolesToUserDto } from './dto/assignRolesToUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserProfile } from './entities/userProfile.entity';

// eslint-disable-next-line @typescript-eslint/no-unused-vars

const dbConfig = databaseConfig[process.env.NODE_ENV || 'development']; // Load the appropriate config based on environment
const PASSWORD_SECRET = dbConfig.PASSWORD_SECRET;

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: typeof User,
    private readonly responseService: ResponseService,
  ) {}

  async create(
    currentCompanyId: number,
    createUserDto: CreateUserDto,
  ): Promise<User> {
    const t: Transaction = await sequelize.transaction();
    try {
      const { password, branch, department, roles, ...rest } = createUserDto;
      let company;
      if (currentCompanyId) {
        company = currentCompanyId;
      } else {
        company = createUserDto.company;
      }
      const hashedPassword = await bcrypt.hash(password + PASSWORD_SECRET, 10); // Hash the password with a salt of 10 rounds
      let companyBranch = null;
      let companyBranchDepartment = null;
      const newUser = await this.userRepository.create(
        {
          ...rest,
          password: hashedPassword,
        },
        { transaction: t },
      );
      if (branch && department) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const userCompanyBranchDepartment =
          await UserCompanyBranchDepartment.create(
            {
              companyBranchDepartmentId: department,
              userId: newUser.id,
            },
            { transaction: t },
          );
      }
      if (branch) {
        companyBranch = await CompanyBranch.findByPk(branch);
        companyBranch = companyBranch.branchId;
      }
      if (department) {
        companyBranchDepartment = await CompanyBranchDepartment.findByPk(
          department,
        );
        companyBranchDepartment = companyBranchDepartment.departmentId;
      }
      if (roles.length > 0) {
        await Promise.all(
          roles.map(async (roleData) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const role = await CompanyBranchDepartmentUserRoles.create(
              {
                userId: newUser.id,
                roleId: roleData,
                companyId: company,
                branchId: companyBranch || null,
                departmentId: companyBranchDepartment || null,
              },
              { transaction: t },
            );
          }),
        );
      }

      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        newUser,
        SAVED_SUCCESS,
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

  async findByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.userRepository.findOne({
        where: { email },
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        users,
        GET_SUCCESS,
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
  async findByEmailAndCompany(
    email: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    companyId: number,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      include: [
        {
          model: CompanyBranchDepartmentUserRoles,
          where: { companyId: companyId },
        },
      ],
    });
  }
  // Login Function
  async findUserWithCompanyByEmail(
    email: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: 1 },
      include: [
        {
          model: CompanyBranchDepartmentUserRoles,
          // where: { companyId: companyId },
        },
      ],
    });
    return user;
  }
  // Login Function
  async findByIdAndCompany(
    id: number,
    companyId: number,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, isActive: 1 },
      include: [
        {
          model: CompanyBranchDepartmentUserRoles,
          where: { companyId },
        },
      ],
    });
  }
  async findAll(currentCompanyId: number, req): Promise<User[]> {
    try {
      console.log('params ', req.query);
      const whereOptions: any = {};
      const whereOptionsMain: any = {};
      const whereOptionsCompanyId: any = {};
      const whereOptionsBranchId: any = {};
      const whereOptionsDepartmentId: any = {};
      if (currentCompanyId) {
        whereOptions.companyId = currentCompanyId;
      }
      if (req.query.companyId > 0) {
        whereOptionsCompanyId.companyId = req.query.companyId;
      }
      if (req.query.branchId > 0) {
        whereOptionsBranchId.id = req.query.branchId;
      }
      if (req.query.departmentId > 0) {
        whereOptionsDepartmentId.id = req.query.departmentId;
      }
      if (req.query.q) {
        whereOptionsMain.username = {
          [Op.like]: `%${req.query.q}%`,
        };
      }
      const users = await this.userRepository.findAll({
        where: whereOptionsMain,
        include: [
          {
            model: CompanyBranchDepartmentUserRoles,
            where: whereOptions,
            include: [
              {
                model: Company,
              },
              {
                model: Branch,
              },
              {
                model: Department,
              },
              { model: Role, include: [{ model: Right }] },
            ],
          },
          {
            model: CompanyBranchDepartment,
            where: whereOptionsDepartmentId,
            include: [
              {
                model: Department,
              },
              {
                model: CompanyBranch,
                where: { ...whereOptionsBranchId, ...whereOptionsCompanyId },

                include: [
                  {
                    model: Company,
                  },
                  {
                    model: Branch,
                  },
                ],
              },
            ],
          },
        ],
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        users,
        // { userFromSession, users },
        GET_SUCCESS,
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

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findMe(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id,
        },
        include: [
          {
            model: CompanyBranchDepartmentUserRoles,
            // where: { companyId: 1 },
          },
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userRights = await this.findUserRights(Number(id));
      if (userRights.length < 1) {
        return this.responseService.createResponse(
          HttpStatus.UNAUTHORIZED,
          null,
          'AUTHENTICATION_ERROR',
        );
      }
      return this.responseService.createResponse(
        HttpStatus.OK,
        {
          userData: user,
          userRights,
          companyTypeId: userRights[0].companyTypeId,
        },
        GET_SUCCESS,
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }
  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id,
        },
        include: [
          {
            model: UserProfile,
          },
          {
            model: CompanyBranchDepartmentUserRoles,
            include: [
              {
                model: Company,
              },
              {
                model: Branch,
                include: [{ model: City }],
              },
              {
                model: Department,
              },
              { model: Role, include: [{ model: Right }] },
            ],
          },
          {
            model: CompanyBranchDepartment,
            include: [
              {
                model: Department,
              },
              {
                model: CompanyBranch,
                include: [
                  {
                    model: Company,
                  },
                  {
                    model: Branch,
                  },
                ],
              },
            ],
          },
        ],
      });
      return this.responseService.createResponse(
        HttpStatus.OK,
        user,
        GET_SUCCESS,
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        EXCEPTION,
      );
    }
  }
  async temp(id: string): Promise<User> {
    try {
      const user = await User.findByPk(id, {
        include: [
          {
            model: CompanyBranchDepartmentUserRoles,
            include: [
              // {
              //   model: CompanyBranchDepartment,
              // },
              {
                model: Company,
                // where: {
                //   isActive: {
                //     // [Op.notIn]: [0],
                //     [Op.not]: [0],
                //   },
                // },
              },

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
              ) {
                if (
                  branchDepartment.companyId === user.userRoles[0].companyId
                ) {
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
                }
              }
            });
          }
        });
      }

      // return userRightsArray;
      return this.responseService.createResponse(
        HttpStatus.OK,
        userRightsArray,
        GET_SUCCESS,
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
    currentCompanyId: number,
    currentUserId: number,
    id: number,

    updateUserDto: UpdateUserDto,
    imgFile: Express.Multer.File,
  ): Promise<any> {
    try {
      const whereOptions: any = {};

      // if (currentCompanyId) {
      //   whereOptions.id = currentUserId;
      // }else{

      // }
      whereOptions.id = id;

      if (currentCompanyId) {
        // whereOptions.companyId = currentCompanyId;
      }
      const user = await this.userRepository.findOne({
        where: whereOptions,
      });
      if (!user) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'User not found',
        );
      }

      user.email = updateUserDto.email || user.email;
      user.lastName = updateUserDto.lastName || user.lastName;
      user.firstName = updateUserDto.firstName || user.firstName;
      user.contact = updateUserDto.contact || user.contact;
      user.username = updateUserDto.username || user.username;
      if (imgFile) {
        const imagePath =
          process.env.BASE_URL +
          ':' +
          process.env.PORT +
          '/uploads/users/profiles/' +
          imgFile.filename;
        user.imgSrc = imagePath; // Store the file path in the user table
      }
      await user.save(); // Save the changes

      return this.responseService.createResponse(
        HttpStatus.OK,
        { updateUserDto: updateUserDto },
        'Updated',
      );
    } catch (error) {
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        error.message,
      );
    }
  }
  async toggleUserStatusByI(
    currentCompanyId: number,
    id: number,
    toggleIsActiveDto: ToggleIsActiveDto,
  ): Promise<any> {
    const t: Transaction = await sequelize.transaction();

    try {
      const whereOptions: any = {};
      whereOptions.id = id;

      if (currentCompanyId) {
        whereOptions.companyId = currentCompanyId;
      }
      const user = await this.userRepository.findOne({
        where: whereOptions,
      });
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
  async changeMyPassword(id: number, data: any): Promise<any> {
    const t: Transaction = await sequelize.transaction();

    try {
      const user = await this.userRepository.findByPk(id);
      if (!user) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'User not found',
        );
      }
      // const isPasswordValid = true;

      const isPasswordValid = await bcrypt.compare(
        data.currentPassword + PASSWORD_SECRET,
        user.password,
      );
      // const isPasswordValid = await bcrypt.compare(
      //   user.password,
      //   data.currentPassword + PASSWORD_SECRET,
      // );
      if (!isPasswordValid) {
        return this.responseService.createResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          null,
          'Incorrect Old Password',
        );
      }
      const isMatched = await (data.confirmNewPassword === data.newPassword);
      if (isMatched && isPasswordValid) {
        const hashedPassword = await bcrypt.hash(
          data.confirmNewPassword + PASSWORD_SECRET,
          10,
        );
        user.password = hashedPassword || 0;
      } else {
        return this.responseService.createResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          null,
          'Passwords do not match',
        );
      }
      await user.save({ transaction: t }); // Save the changes
      await t.commit();

      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Passsword Changed Successfully',
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

  async remove(id: string): Promise<void> {
    const t: Transaction = await sequelize.transaction();

    try {
      if (Number(id) === 1) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Super Admin Cannot be Deleted',
        );
      }
      const user = await this.userRepository.findByPk(id);
      if (!user) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'User not found',
        );
      }
      await UserCompanyBranchDepartment.destroy({
        where: { userId: id },
        transaction: t,
      });
      await user.destroy({ transaction: t });
      await t.commit();

      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Deleted!',
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
  async removeUserRole(id: string): Promise<void> {
    const t: Transaction = await sequelize.transaction();

    try {
      if (Number(id) === 1) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'Super Admin Rights Cannot be removed',
        );
      }
      const userRole = await CompanyBranchDepartmentUserRoles.findByPk(id);
      if (!userRole) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'User Role not found',
        );
      }

      await userRole.destroy({ transaction: t });
      await t.commit();

      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        'Role Removed!',
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
  async assignRolesToUser(
    id: string,
    assignRolesToUserDto: AssignRolesToUserDto,
  ): Promise<void> {
    const t: Transaction = await sequelize.transaction();

    try {
      const { companyId, roles, branchId, departmentId } = assignRolesToUserDto;
      let companyBranch = null;
      let companyBranchDepartment = null;
      const user = await this.findOne(id);
      if (!user) {
        return this.responseService.createResponse(
          HttpStatus.NOT_FOUND,
          null,
          'User not found',
        );
      }
      if (branchId) {
        companyBranch = await CompanyBranch.findByPk(branchId);
        companyBranch = companyBranch.branchId;
      }
      if (departmentId) {
        companyBranchDepartment = await CompanyBranchDepartment.findByPk(
          departmentId,
        );
        companyBranchDepartment = companyBranchDepartment.departmentId;
      }

      if (roles.length > 0) {
        await Promise.all(
          roles.map(async (roleData) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const role = await CompanyBranchDepartmentUserRoles.create(
              {
                userId: id,
                roleId: roleData,
                companyId: companyId || null,
                branchId: companyBranch || null,
                departmentId: companyBranchDepartment || null,
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
        'Role assigned!',
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
  async findUserRights(userId: number): Promise<any> {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: CompanyBranchDepartmentUserRoles,
            include: [
              // {
              //   model: CompanyBranchDepartment,
              // },
              {
                model: Company,
                // where: {
                //   isActive: {
                //     // [Op.notIn]: [0],
                //     [Op.not]: [0],
                //   },
                // },
              },

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
              ) {
                if (
                  branchDepartment.companyId === user.userRoles[0].companyId
                ) {
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
                }
              }
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
  // Temporary Api
  async createTemp2(data: any): Promise<User | any> {
    const t: Transaction = await sequelize.transaction();
    const password = 12345;
    const hashedPassword = await bcrypt.hash(password + PASSWORD_SECRET, 10); // Hash the password with a salt of 10 rounds
    const userArray = [];
    const userProfile = [];
    const roleArray = [];
    try {
      // data = data.slice(0, 20);
      await Promise.all(
        data.map(async (element, index) => {
          let myEmail = '';
          if (
            !element.ProfileInfo[0].Emailinfo ||
            element.ProfileInfo[0].Emailinfo === null ||
            element.ProfileInfo[0].Emailinfo === '' ||
            element.ProfileInfo[0].Emailinfo === ' ' ||
            element.ProfileInfo[0].Emailinfo === 'dummy@dummy.com'
          ) {
            myEmail = `none${index}@gmail.com`;
          } else {
            myEmail = element.ProfileInfo[0].Emailinfo;
          }

          let eUserPhone = '';
          let existUserPhone;
          if (element.ProfileInfo[0].MobilePhone) {
            existUserPhone = await this.userRepository.findOne({
              where: {
                contact: element.ProfileInfo[0].MobilePhone,
              },
            });
          } else {
            eUserPhone = `${index}-duplicate`;
          }
          if (existUserPhone) {
            eUserPhone = `${element.ProfileInfo[0].MobilePhone}-${index}-duplicate`;
          } else {
            eUserPhone = element.ProfileInfo[0].MobilePhone;
          }
          if (!element.ProfileInfo[0].MobilePhone) {
            eUserPhone = `${index}-None`;
          }
          if ((element.ProfileInfo[0].MobilePhone = '03330969127')) {
            eUserPhone = `${element.ProfileInfo[0].MobilePhone}-${index}`;
          }
          userArray.push({
            id: element.AutoId,
            username: element.UserName,
            firstName: element.UserName,
            lastName: element.UserName,
            email: myEmail,
            password: hashedPassword,
            contact: eUserPhone,
            isActive: 1,
          });

          let sqlFormattedDate;
          if (element.ProfileInfo[0].BirthDate) {
            const birthDateString = element.ProfileInfo[0].BirthDate; // Assuming it's "12-12-1992"

            // Parse the date string into a JavaScript Date object
            const parts = birthDateString.split('-');
            const year = parseInt(parts[2], 10);
            const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JavaScript
            const day = parseInt(parts[0], 10);

            const birthDate = new Date(year, month, day);

            // Format the date in SQL format (YYYY-MM-DD)
            sqlFormattedDate = birthDate.toISOString().split('T')[0];
          } else {
            sqlFormattedDate = null;
          }
          userProfile.push({
            userId: element.AutoId,
            fatherName: element.ProfileInfo[0].Fathername,
            birthPlace: element.ProfileInfo[0].BirthPlace,
            birthDate: sqlFormattedDate,
            gender: element.ProfileInfo[0].Gender,
            maritalStatus: element.ProfileInfo[0].Maritalstatus,
            nationality: element.ProfileInfo[0].Nationality,
            bloodGroup: element.ProfileInfo[0].BloodGroup,
            cnic: element.ProfileInfo[0].CNIC,
            picture: element.ProfileInfo[0].Picture,
            homeAddress: element.ProfileInfo[0].HomeAddress,
            homePhone: element.ProfileInfo[0].HomePhone,
            mobilePhone: element.ProfileInfo[0].MobilePhone,
            emailinfo: element.ProfileInfo[0].Emailinfo,
            officialNumber: element.ProfileInfo[0].OfficialNumber,
            profession: element.ProfileInfo[0].Profession,
            experience: element.ProfileInfo[0].Experience,
            education: element.ProfileInfo[0].Education,
            HiringDate: element.ProfileInfo[0].HiringDate,
            ContactName: element.ProfileInfo[0].ContactName,
            ContactAdress: element.ProfileInfo[0].ContactAdress,
            ContactPhoneNo: element.ProfileInfo[0].ContactPhoneNo,
            ContactEmail: element.ProfileInfo[0].ContactEmail,
            Relation: element.ProfileInfo[0].Relation,
            // CNICPicture: element.ProfileInfo[0].Education,
            // ProfilePicture: element.ProfileInfo[0].Education,
            OfficialNumber2: element.ProfileInfo[0].OfficialNumber2 || null,
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars

          console.log(index, ' User inserted');
          // comment start
          const department = await Department.findOne({
            where: {
              id: element.ProfileInfo[0].BranchAndStaff[0].UserCategories[0].Id,
            },
          });
          const branch = await Branch.findOne({
            where: {
              code: element.ProfileInfo[0].BranchAndStaff[0].BranchID,
            },
          });
          let company = 1;
          if (element.ProfileInfo[0].BranchAndStaff[0].BranchID === 'FM-02') {
            company = 2;
          }
          if (element.ProfileInfo[0].BranchAndStaff[0].BranchID === 'FSB-01') {
            company = 3;
          }
          roleArray.push({
            userId: element.AutoId,
            roleId: 2,
            companyId: company,
            branchId: branch.id || null,
            departmentId: department.id || null,
            isActive: 1,
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars

          // comment start

          console.log(index, ' record inserted');
        }),
      );
      console.log('EEEnd');
      console.log('SSStarted');
      // return { roleArray };
      const usernameCounts = {}; // Object to store username counts

      const duplicateUsernames = [];
      for (const user of userArray) {
        const username = user.contact;

        // Check if the username has been encountered before
        if (usernameCounts[username]) {
          // If it's a duplicate, add it to the list of duplicates
          duplicateUsernames.push(username);
        } else {
          // Otherwise, mark it as encountered
          usernameCounts[username] = 1;
        }
      }

      console.log('Duplicate Usernames:', duplicateUsernames);
      await Promise.all([
        // await this.userRepository.bulkCreate(userArray, { transaction: t }),
        // await UserProfile.bulkCreate(userProfile, { transaction: t }),
        // await CompanyBranchDepartmentUserRoles.bulkCreate(roleArray, {
        //   transaction: t,
        // }),
      ]);
      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        { userArray, userProfile, roleArray },
        SAVED_SUCCESS,
      );
    } catch (error) {
      console.log('errorrrr', error);
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        error.message,
      );
    }
  }
  async createTemp3(data: any): Promise<User> {
    const t: Transaction = await sequelize.transaction();
    try {
      await Promise.all(
        data.map(async (element, index) => {
          // comment start
          const department = await Department.findOne({
            where: {
              id: element.ProfileInfo[0].BranchAndStaff[0].UserCategories[0].Id,
            },
          });
          const branch = await Branch.findOne({
            where: {
              code: element.ProfileInfo[0].BranchAndStaff[0].BranchID,
            },
          });
          let company = 1;
          if (element.ProfileInfo[0].BranchAndStaff[0].BranchID === 'FM-02') {
            company = 2;
          }
          if (element.ProfileInfo[0].BranchAndStaff[0].BranchID === 'FSB-01') {
            company = 3;
          }
          let companyBranch = await CompanyBranch.findOne({
            where: {
              companyId: company,
              branchId: branch.id,
            },
          });
          if (!companyBranch) {
            console.log('NotcompanyBranch');
            companyBranch = await CompanyBranch.create(
              {
                companyId: company,
                branchId: branch.id,
              },
              { transaction: t },
            );
          }
          let companyBranchDepartment = await CompanyBranchDepartment.findOne({
            where: {
              companyBranchId: companyBranch.id,
              departmentId: department.id,
            },
          });
          if (!companyBranchDepartment) {
            console.log('NotcompanyBranchDepartment');

            companyBranchDepartment = await CompanyBranchDepartment.create(
              {
                companyBranchId: companyBranch.id,
                departmentId: department.id,
              },
              { transaction: t },
            );
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const userCompanyBranchDepartment =
            await UserCompanyBranchDepartment.create(
              {
                companyBranchDepartmentId: companyBranchDepartment.id,
                userId: element.AutoId,
              },
              { transaction: t },
            );

          // eslint-disable-next-line @typescript-eslint/no-unused-vars

          // comment start

          console.log(index, ' record inserted');
        }),
      );

      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        SAVED_SUCCESS,
      );
    } catch (error) {
      console.log('errorrrr', error);
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        error.message,
      );
    }
  }
  async createTempNew(): Promise<User | any> {
    const t: Transaction = await sequelize.transaction();
    try {
      const allUsers = await CompanyBranchDepartmentUserRoles.findAll({
        where: {
          userId: {
            [Op.lt]: 999, // Less than 999
          },
        },
      });
      // return { allUsers };
      await Promise.all(
        allUsers.map(async (element) => {
          const companyBranch = await CompanyBranch.findOne({
            where: {
              companyId: element.companyId,
              branchId: element.branchId,
            },
          });

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const companyBranchDepartment = await CompanyBranchDepartment.findOne(
            {
              where: {
                companyBranchId: companyBranch.id,
                departmentId: element.departmentId,
              },
            },
          );
        }),
      );

      // return { userCompanyBranchDepartmentArray };

      await Promise.all([
        // await CompanyBranchDepartment.bulkCreate(filteredArray, {
        //   transaction: t,
        // }),
        // await UserCompanyBranchDepartment.bulkCreate(
        //   userCompanyBranchDepartmentArray,
        //   { transaction: t },
        // ),
        // await CompanyBranchDepartmentUserRoles.bulkCreate(roleArray, {
        //   transaction: t,
        // }),
      ]);

      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        null,
        SAVED_SUCCESS,
      );
    } catch (error) {
      console.log('errorrrr', error);
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        error.message,
      );
    }
  }
  async createTempRecent(data): Promise<User | any> {
    const t: Transaction = await sequelize.transaction();
    try {
      const dataWithIsActive = await data.map((item) => ({
        ...item,
        isActive: 1,
      }));
      // return dataWithIsActive[119];
      // return dataWithIsActive.length;
      // dataWithIsActive = await dataWithIsActive.slice(0, 120);
      // dataWithIsActive = await dataWithIsActive.slice(110, 120);
      await Promise.all([
        // await CompanyBranchDepartment.bulkCreate(filteredArray, {
        //   transaction: t,
        // }),
        await UserCompanyBranchDepartment.bulkCreate(dataWithIsActive, {
          transaction: t,
        }),
        // await CompanyBranchDepartmentUserRoles.bulkCreate(roleArray, {
        //   transaction: t,
        // }),
      ]);

      // return { dataWithIsActive };
      await t.commit();
      return this.responseService.createResponse(
        HttpStatus.OK,
        dataWithIsActive,
        SAVED_SUCCESS,
      );
    } catch (error) {
      console.log('errorrrr', error);
      await t.rollback();
      return this.responseService.createResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        error.message,
      );
    }
  }
}
