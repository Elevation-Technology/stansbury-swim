import { Module } from '@nestjs/common'
import { EmailService } from './email.service'
import { UserModule } from '../user/user.module'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConfigEnum } from '../shared/config.enum'
import { LoggerModule } from '../logger/logger.module'
import { CqrsModule } from '@nestjs/cqrs'
import { SendCancellationEmailHandler } from './commands/send-cancellation-email/send-cancellation-email.handler'
import { SendWelcomeEmailHandler } from './commands/send-welcome-email/send-welcome-email.handler'
import { ScheduleSaga } from './schedule.saga'
import { UserSaga } from './user.saga'
import { StudentModule } from 'student/student.module'
import { ScheduleModule } from 'schedule/schedule.module'
import { SendReservationEmailHandler } from './commands/send-reservation-email/send-reservation-email.handler'
import { SendReservationFailedEmailHandler } from './commands/send-reservation-failed-email/send-reservation-failed-email.handler'
import { PoolModule } from 'pool/pool.module'
import { InstructorModule } from 'instructor/instructor.module'
import { SendScheduleReminderEmailHandler } from './commands/send-schedule-reminder-email/send-schedule-reminder-email.handler'
import { SendWaitlistAllowedEmailHandler } from './commands/send-waitlist-allowed-email/send-waitlist-allowed-email.handler'
import { WaitlistSaga } from './waitlist.saga'
import { SendEmailVerificationHandler } from './commands/send-email-verification/send-email-verification.handler'
const COMMAND_HANDLERS = [
  SendCancellationEmailHandler,
  SendWelcomeEmailHandler,
  SendEmailVerificationHandler,
  SendReservationEmailHandler,
  SendReservationFailedEmailHandler,
  SendScheduleReminderEmailHandler,
  SendWaitlistAllowedEmailHandler,
]
const SAGAS = [UserSaga, ScheduleSaga, WaitlistSaga]

@Module({
  imports: [
    CqrsModule,
    LoggerModule,
    UserModule,
    ConfigModule,
    StudentModule,
    ScheduleModule,
    PoolModule,
    InstructorModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get(ConfigEnum.JwtAccessTokenSecret),
        signOptions: {
          expiresIn: configService.get(ConfigEnum.JwtAccessTokenExpirationTime),
        },
      }),
    }),
  ],
  controllers: [],
  providers: [EmailService, ...COMMAND_HANDLERS, ...SAGAS],
  exports: [EmailService],
})
export class EmailModule {}
