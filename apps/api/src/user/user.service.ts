import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { InjectModel } from '@nestjs/mongoose'
import { UserEntity } from './entities/user.entity'
import { Model, Types } from 'mongoose'
import { User } from './user'
import { SignUpDto } from '../iam/authentication/dto/sign-up.dto'
import { UserForAuth } from './user-for-auth'
import { EventBus } from '@nestjs/cqrs'
import { UserRegisterEvent } from './events/user-register.event'
import { Role } from '@lesson-scheduler/shared'
import { TransactionService } from 'payment/transaction.service'
const mapper = (entity: UserEntity): User => {
  return {
    id: entity._id.toString(),
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    address1: entity.address1 || '',
    address2: entity.address2 || '',
    city: entity.city || '',
    state: entity.state || '',
    zip: entity.zip || '',
    phone: entity.phone || '',
    privateRegistration: entity.privateRegistration || false,
    role: entity.role,
    failedLoginAttempts: entity.failedLoginAttempts || 0,
    lastFailedLogin: entity.lastFailedLogin || null,
    signedWaiver: entity.signedWaiver || false,
    waiverSignature: entity.waiverSignature || null,
    waiverSignatureDate: entity.waiverSignatureDate || null,
    instructorId: entity.instructorId || null,
  }
}
@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly model: Model<UserEntity>,
    private readonly eventBus: EventBus,
    private readonly transactionService: TransactionService,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const _id = new Types.ObjectId()
    await this.model.create({
      _id,
      email: createUserDto.email,
      password: createUserDto.password,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      address1: createUserDto.address1,
      address2: createUserDto.address2,
      city: createUserDto.city,
      state: createUserDto.state,
      zip: createUserDto.zip,
      phone: createUserDto.phone.replace(/\D/g, ''),
      privateRegistration: createUserDto.privateRegistration,
    })
    const entity = await this.model.findById(_id)
    if (!entity) {
      throw new Error('User not found')
    }
    return mapper(entity)
  }
  async signUp(signUpDto: SignUpDto, hashedPassword: string, salt: string): Promise<User> {
    const _id = new Types.ObjectId()

    const existingUser = await this.model.findOne({ email: signUpDto.email.toLowerCase() })
    if (existingUser) {
      throw new ConflictException('User already exists')
    }

    await this.model.create({
      _id,
      email: signUpDto.email.toLowerCase(),
      password: hashedPassword,
      firstName: signUpDto.firstName.trim(),
      lastName: signUpDto.lastName.trim(),
      phone: signUpDto.phoneNumber.trim(),
      salt,
      failedLoginAttempts: 0,
      lastFailedLogin: null,
    })
    const entity = await this.model.findById(_id)
    if (!entity) {
      throw new Error('User not found')
    }
    const user = mapper(entity)
    await this.eventBus.publish(new UserRegisterEvent(user))
    return user
  }

  async findAll(
    page = 1,
    limit = 1000,
    search?: string,
    phone?: string,
    sortBy?: string,
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit
    const match: any = {}
    if (search) {
      match.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }]
    }
    if (phone) {
      match.phone = { $regex: phone, $options: 'i' }
    }

    // Build the aggregation pipeline
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'transactions',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$creditType', 'private'] }] } } },
            { $group: { _id: null, balance: { $sum: '$credits' } } },
          ],
          as: 'unusedCreditsAgg',
        },
      },
      {
        $addFields: {
          unusedCredits: { $ifNull: [{ $arrayElemAt: ['$unusedCreditsAgg.balance', 0] }, 0] },
        },
      },
      { $project: { unusedCreditsAgg: 0 } },
    ]

    // Sorting
    if (sortBy === 'name') {
      pipeline.push({ $addFields: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } })
      pipeline.push({ $sort: { fullName: 1 } })
    } else if (sortBy === 'email') {
      pipeline.push({ $sort: { email: 1 } })
    } else if (sortBy === 'unusedCredits') {
      pipeline.push({ $sort: { unusedCredits: -1 } })
    }

    // Pagination
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limit })

    // Get total count (without pagination)
    const countPipeline = [...pipeline]
    countPipeline.splice(
      countPipeline.findIndex(stage => Object.keys(stage)[0] === '$skip'),
      2,
    ) // remove $skip and $limit
    countPipeline.push({ $count: 'total' })

    // Run both pipelines
    const [users, totalResult] = await Promise.all([
      this.model.aggregate(pipeline),
      this.model.aggregate(countPipeline),
    ])
    const total = totalResult[0]?.total ?? 0

    // Map to User type
    const mappedUsers = users.map(user => ({
      ...mapper(user),
      unusedCredits: user.unusedCredits || 0,
    }))

    return {
      users: mappedUsers,
      total,
    }
  }

  async findOne(id: string): Promise<User> {
    const entity = await this.model.findById(new Types.ObjectId(id))
    if (!entity) {
      throw new NotFoundException()
    }
    return mapper(entity)
  }

  async findOneForAuth(email: string): Promise<UserForAuth | null> {
    const entity = await this.model.findOne(
      { email: email.toLowerCase() },
      {
        _id: 1,
        email: 1,
        password: 1,
        salt: 1,
        firstName: 1,
        lastName: 1,
        role: 1,
        failedLoginAttempts: 1,
        lastFailedLogin: 1,
        resetToken: 1,
      },
    )
    if (!entity) {
      return null
    }
    const user = mapper(entity)

    return {
      ...user,
      password: entity.password || null,
      resetToken: entity.resetToken || null,
      salt: entity.salt,
    }
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const update: Partial<UserEntity> = {}
    if (updateUserDto.email) {
      // Sign-in looks the address up lowercased, so storing a different casing here
      // locks the account out.
      const email = updateUserDto.email.trim().toLowerCase()
      const existingUser = await this.model.findOne({ email, _id: { $ne: new Types.ObjectId(userId) } })
      if (existingUser) {
        throw new ConflictException('Email already in use')
      }
      update.email = email
    }
    if (updateUserDto.firstName) {
      update.firstName = updateUserDto.firstName.trim()
    }
    if (updateUserDto.lastName) {
      update.lastName = updateUserDto.lastName.trim()
    }
    if (updateUserDto.address1) {
      update.address1 = updateUserDto.address1.trim()
    }
    if (updateUserDto.address2) {
      update.address2 = updateUserDto.address2.trim()
    }
    if (updateUserDto.city) {
      update.city = updateUserDto.city.trim()
    }
    if (updateUserDto.state) {
      update.state = updateUserDto.state.trim()
    }
    if (updateUserDto.zip) {
      update.zip = updateUserDto.zip.trim()
    }
    if (updateUserDto.phone) {
      update.phone = updateUserDto.phone.trim()
    }
    if (updateUserDto.privateRegistration) {
      update.privateRegistration = updateUserDto.privateRegistration
    }
    if (updateUserDto.instructorId) {
      update.instructorId = updateUserDto.instructorId
    }
    if (updateUserDto.role) {
      update.role = updateUserDto.role

      if (updateUserDto.role === Role.User) {
        await this.model.updateOne(
          { _id: new Types.ObjectId(userId) },
          {
            $unset: { instructorId: '' },
          },
        )
      }
    }
    await this.model.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: update,
      },
    )
    const entity = await this.model.findById(new Types.ObjectId(userId))
    if (!entity) {
      throw new Error('User not found')
    }
    return mapper(entity)
  }

  async remove(id: string): Promise<void> {
    this.model.deleteOne({ _id: new Types.ObjectId(id) })
  }

  async findOneByGoogleId({ googleId }: { googleId: string }) {
    const entity = await this.model.findOne({ googleId })
    return entity && mapper(entity)
  }

  async addGoogleId(
    email: string,
    googleId: string,
    given_name: string | undefined,
    family_name: string | undefined,
  ): Promise<User> {
    await this.model.updateOne(
      { email },
      {
        $set: {
          googleId,
        },
      },
    )
    const entity = await this.model.findOne({ email })
    if (!entity) {
      throw new Error('User not found')
    }
    const user = mapper(entity)
    await this.eventBus.publish(new UserRegisterEvent(user))
    return user
  }
  async saveGoogleId(
    email: string,
    googleId: string,
    given_name: string | undefined,
    family_name: string | undefined,
  ): Promise<User> {
    const _id = new Types.ObjectId()
    await this.model.create({
      _id,
      email,
      googleId,
      firstName: given_name,
      lastName: family_name,
    })
    const entity = await this.model.findById(_id)
    if (!entity) {
      throw new Error('User not found')
    }
    const user = mapper(entity)
    await this.eventBus.publish(new UserRegisterEvent(user))
    return user
  }

  async updateWaiver(
    userId: string,
    signedWaiver: boolean,
    waiverSignature: string,
    waiverSignatureDate: Date,
  ): Promise<User> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          signedWaiver,
          waiverSignature,
          waiverSignatureDate,
        },
      },
    )
    return this.findOne(userId)
  }

  public async updateResetToken(user: UserForAuth, token: string) {
    return await this.model.updateOne(
      { _id: new Types.ObjectId(user.id) },
      {
        $set: {
          resetToken: token,
        },
      },
    )
  }

  public async updatePassword(user: UserForAuth, password: string, salt: string) {
    await this.model.updateOne(
      { _id: new Types.ObjectId(user.id) },
      {
        $set: {
          password,
          salt,
          resetToken: null,
          failedLoginAttempts: 0,
          lastFailedLogin: null,
        },
      },
    )
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $inc: { failedLoginAttempts: 1 },
        $set: { lastFailedLogin: new Date() },
      },
    )
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          failedLoginAttempts: 0,
          lastFailedLogin: null,
        },
      },
    )
  }

  async findMany(ids: string[]): Promise<User[]> {
    const entities = await this.model.find({ _id: { $in: ids.map(id => new Types.ObjectId(id)) } })
    return entities.map(mapper)
  }

  async countActiveUsers(range?: { from?: Date; to?: Date }): Promise<number> {
    const filter: any = { role: Role.User }
    if (range?.from || range?.to) {
      filter.createdAt = {}
      if (range.from) filter.createdAt.$gte = range.from
      if (range.to) filter.createdAt.$lt = range.to
    }
    return await this.model.countDocuments(filter)
  }
}
