import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { EventBus } from '@nestjs/cqrs'
import { WaitlistEntity } from './entities/waitlist.entity'
import { User } from 'user/user'
import { UserService } from 'user/user.service'
import { Waitlist } from './waitlist'
import { WaitlistAllowedEvent } from './events/waitlist-allowed.event'

const mapper = (entity: WaitlistEntity, user: User): Waitlist => {
  return {
    id: entity._id.toString(),
    userId: entity.userId.toString(),
    allowed: entity.allowed,
    allowedOn: entity.allowedOn?.toISOString(),
    archivedAt: entity.archivedAt?.toISOString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}

@Injectable()
export class WaitlistService {
  constructor(
    @InjectModel(WaitlistEntity.name)
    private readonly model: Model<WaitlistEntity>,
    private readonly userService: UserService,
    private readonly eventBus: EventBus,
  ) {}
  async join(userId: string): Promise<Waitlist> {
    const _id = new Types.ObjectId()
    const result = await this.model.create({
      _id,
      userId: new Types.ObjectId(userId),
      allowed: false,
    })
    const entity = await this.model.findById(result._id)
    if (!entity) {
      throw new BadRequestException('Waitlist not found')
    }
    const user = await this.userService.findOne(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return mapper(entity, user)
  }

  async findAll(options: { includeArchived?: boolean } = {}): Promise<Waitlist[]> {
    const filter = options.includeArchived ? {} : { archivedAt: { $exists: false } }
    const entities = await this.model.find(filter)
    const userIds = entities.map(entity => entity.userId.toString())
    const users = await this.userService.findMany(userIds)
    return entities
      .map(entity => {
        const user = users.find(user => user.id === entity.userId.toString())
        if (!user) {
          return null
        }
        return mapper(entity, user)
      })
      .filter(e => e != null)
  }

  async findByUserId(userId: string): Promise<Waitlist> {
    const waitlist = await this.model.findOne({ userId: new Types.ObjectId(userId) })
    if (!waitlist) {
      throw new NotFoundException('Waitlist not found')
    }
    const user = await this.userService.findOne(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return mapper(waitlist, user)
  }

  async allowPurchase(userId: string): Promise<Waitlist> {
    const existing = await this.model.findOne({ userId: new Types.ObjectId(userId) })
    const wasAlreadyAllowed = existing?.allowed === true

    await this.model.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          allowed: true,
          allowedOn: new Date(),
        },
      },
    )
    const entity = await this.model.findOne({ userId: new Types.ObjectId(userId) })
    if (!entity) {
      throw new BadRequestException('User is not allowed to purchase. Not on waitlist.')
    }
    const user = await this.userService.findOne(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    if (!wasAlreadyAllowed) {
      this.eventBus.publish(new WaitlistAllowedEvent(user))
    }
    return mapper(entity, user)
  }

  async remove(id: string): Promise<void> {
    await this.model.deleteOne({ _id: new Types.ObjectId(id) })
  }

  async archive(id: string): Promise<Waitlist> {
    const _id = new Types.ObjectId(id)
    await this.model.updateOne({ _id }, { $set: { archivedAt: new Date() } })
    const entity = await this.model.findById(_id)
    if (!entity) {
      throw new NotFoundException('Waitlist entry not found')
    }
    const user = await this.userService.findOne(entity.userId.toString())
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return mapper(entity, user)
  }

  async unarchive(id: string): Promise<Waitlist> {
    const _id = new Types.ObjectId(id)
    await this.model.updateOne({ _id }, { $unset: { archivedAt: '' } })
    const entity = await this.model.findById(_id)
    if (!entity) {
      throw new NotFoundException('Waitlist entry not found')
    }
    const user = await this.userService.findOne(entity.userId.toString())
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return mapper(entity, user)
  }

  async bulkArchiveBefore(before: Date): Promise<{ archivedCount: number }> {
    const result = await this.model.updateMany(
      { createdAt: { $lt: before }, archivedAt: { $exists: false } },
      { $set: { archivedAt: new Date() } },
    )
    return { archivedCount: result.modifiedCount }
  }
}
