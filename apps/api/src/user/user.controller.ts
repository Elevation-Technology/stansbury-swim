import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpCode,
  Query,
  ForbiddenException,
} from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator'
import { ActiveUserData } from '../iam/authentication/interfaces/active-user-data.interface'
import { CreditTypesEnum, Role, TransactionTypesEnum } from '@lesson-scheduler/shared'
import { Roles } from 'iam/authentication/decorators/roles.decorator'
import { StudentService } from 'student/student.service'
import { UserSearchRequestDto } from './dto/user-search-request.dto'
import { UserSearchResponseDto } from './dto/user-search-response.dto'
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto'
import { ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { UserResponseDto } from './dto/user-response.dto'
import { TransactionService } from 'payment/transaction.service'

@ApiTags('Users')
@Roles(Role.Admin)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly studentService: StudentService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.create(createUserDto)
    return user as UserResponseDto
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  @ApiResponse({ status: 200, type: PaginatedResponseDto<UserSearchResponseDto> })
  async findAll(
    @Query() userSearchRequestDto: UserSearchRequestDto,
  ): Promise<PaginatedResponseDto<UserSearchResponseDto>> {
    const { users, total } = await this.userService.findAll(
      userSearchRequestDto.page,
      userSearchRequestDto.limit,
      userSearchRequestDto.name,
      userSearchRequestDto.phone,
      userSearchRequestDto.sortBy,
    )

    const allStudents = await Promise.all(
      users.map(async user => {
        const students = await this.studentService.findAllByUserId(user.id)
        return {
          userId: user.id,
          students,
        }
      }),
    )

    const data: UserSearchResponseDto[] = []

    function toBirthdayString(birthday: unknown): string {
      if (typeof birthday === 'string') return birthday
      if (birthday instanceof Date) return birthday.toISOString()
      return ''
    }

    for (const user of users) {
      const creditBalances = await this.transactionService.readCreditBalances(user.id)
      const students = allStudents
        .find(students => students.userId === user.id)
        ?.students.map(student => ({
          id: student.id,
          userId: student.userId,
          name: student.name,
          birthday: toBirthdayString(student.birthday),
          notes: student.notes || '',
        }))

      data.push({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        unusedCredits: creditBalances.find(balance => balance.creditType === CreditTypesEnum.PRIVATE)?.balance ?? 0,
        totalCredits: 0,
        students:
          students?.map(student => ({
            id: student.id,
            userId: student.userId,
            name: student.name,
            birthday: toBirthdayString(student.birthday),
            notes: student.notes || '',
          })) ?? [],
        instructorId: user.instructorId ?? undefined,
      })
    }

    return {
      data,
      total,
      page: userSearchRequestDto.page || 1,
      limit: userSearchRequestDto.limit || 50,
    }
  }

  @Get(':id')
  @Roles(Role.Admin)
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const foundUser = await this.userService.findOne(id)
    return foundUser as UserResponseDto
  }

  @Patch(':id')
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<UserResponseDto> {
    if (user.role !== Role.Admin && (updateUserDto.instructorId || updateUserDto.role)) {
      throw new ForbiddenException('You are not authorized to update this user')
    }
    // This controller is admin-only via @Roles(Role.Admin) on the class, so an address set
    // here applies immediately rather than being staged. That is deliberate: it is the repair
    // path for an account whose address is already wrong and so cannot receive a confirmation.
    const updatedUser = await this.userService.update(id, updateUserDto)
    return updatedUser as UserResponseDto
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string) {
    return this.userService.remove(id)
  }
}
