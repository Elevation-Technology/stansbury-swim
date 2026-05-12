import { Module, forwardRef } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SiteConfigEntity, SiteConfigSchema } from './entities/site-config.entity'
import { SiteConfigService } from './site-config.service'
import { SiteConfigController } from './site-config.controller'
import { WaitlistModule } from 'waitlist/waitlist.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SiteConfigEntity.name, schema: SiteConfigSchema }]),
    forwardRef(() => WaitlistModule),
  ],
  controllers: [SiteConfigController],
  providers: [SiteConfigService],
  exports: [SiteConfigService],
})
export class SiteConfigModule {}
