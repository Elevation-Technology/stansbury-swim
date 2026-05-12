import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { SiteConfig } from './site-config'
import { SiteConfigEntity } from './entities/site-config.entity'
import { WaitlistService } from 'waitlist/waitlist.service'

const mapper = (entity: SiteConfigEntity): SiteConfig => {
  return {
    id: entity._id.toString(),
    waitlistEnabled: entity.waitlistEnabled,
  }
}

@Injectable()
export class SiteConfigService {
  constructor(
    @InjectModel(SiteConfigEntity.name)
    private readonly model: Model<SiteConfigEntity>,
    @Inject(forwardRef(() => WaitlistService))
    private readonly waitlistService: WaitlistService,
  ) {}
  async toggleWaitlist(): Promise<SiteConfig> {
    let entity = await this.model.findOne()
    const wasEnabled = entity?.waitlistEnabled === true

    if (entity == null) {
      const _id = new Types.ObjectId()
      await this.model.create({
        _id,
        waitlistEnabled: true,
      })
    } else {
      await this.model.updateOne(
        { _id: entity._id },
        {
          $set: {
            waitlistEnabled: !entity.waitlistEnabled,
          },
        },
      )
    }
    entity = await this.model.findOne()
    if (!entity) {
      throw new Error('Config not found')
    }

    // Closing a season: archive every active waitlist record so stale entries
    // can't silently block users next time the waitlist is enabled.
    if (wasEnabled && !entity.waitlistEnabled) {
      await this.waitlistService.bulkArchiveBefore(new Date())
    }

    return mapper(entity)
  }

  async findOne(): Promise<SiteConfig> {
    const entity = await this.model.findOne()
    if (!entity) {
      throw new Error('Config not found')
    }
    return mapper(entity)
  }
}
