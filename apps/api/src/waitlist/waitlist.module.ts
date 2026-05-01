import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CqrsModule } from '@nestjs/cqrs'
import { WaitlistEntity, WaitlistSchema } from './entities/waitlist.entity'
import { WaitlistService } from './waitlist.service'
import { WaitlistController } from './waitlist.controller'
import { RemoveUserFromWaitlistHandler } from './commands/remove-user-from-waitlist/remove-user-from-waitlist.handler'
import { PaymentSaga } from './payment.saga'
import { SiteConfigModule } from 'site-config/site-config.module'
import { forwardRef } from '@nestjs/common'
import { UserModule } from 'user/user.module'

@Module({
  imports: [
    CqrsModule,
    SiteConfigModule,
    forwardRef(() => UserModule),
    MongooseModule.forFeature([{ name: WaitlistEntity.name, schema: WaitlistSchema }]),
  ],
  controllers: [WaitlistController],
  providers: [WaitlistService, RemoveUserFromWaitlistHandler, PaymentSaga],
  exports: [WaitlistService],
})
export class WaitlistModule {}
