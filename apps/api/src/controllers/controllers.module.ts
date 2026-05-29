import { Module } from '@nestjs/common'

import { PaymentController } from 'payment/payment.controller'
import { PaymentModule } from 'payment/payment.module'
import { ScheduleModule } from 'schedule/schedule.module'
import { UserModule } from 'user/user.module'
import { ProductModule } from 'product/product.module'

@Module({
  imports: [PaymentModule, ScheduleModule, UserModule, ProductModule],
  controllers: [PaymentController],
  providers: [],
  exports: [],
})
export class ControllersModule {}
