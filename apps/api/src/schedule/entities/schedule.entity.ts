import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, Document } from 'mongoose'
import { LessonTypesEnum } from 'shared/lesson-types.enum'
import { RegistrationStatusEnum } from 'shared/registration-status-types.enum'

export enum ScheduleStatusEnum {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
}

@Schema({
  timestamps: true,
})
export class RegistrationEntity extends Document {
  createdAt: Date
  updatedAt: Date
  @Prop({ required: true })
  userId: Types.ObjectId
  @Prop({ required: true })
  studentId: Types.ObjectId
  // Optional: a HELD seat has no transaction until the purchase is confirmed.
  @Prop({ required: false })
  transactionId?: Types.ObjectId
  // CONFIRMED by default so every pre-existing row and direct registration stays valid
  // with no migration. HELD seats are reserved during checkout and confirmed on payment.
  @Prop({ type: String, required: true, enum: RegistrationStatusEnum, default: RegistrationStatusEnum.CONFIRMED })
  status: RegistrationStatusEnum
  // Only set while HELD; once past this instant the hold no longer occupies a seat.
  @Prop({ required: false })
  heldUntil?: Date
  @Prop({ required: false })
  reminderSentAt?: Date
}

export const RegistrationSchema = SchemaFactory.createForClass(RegistrationEntity)

@Schema({
  collection: 'schedules',
  timestamps: true,
})
export class ScheduleEntity extends Document {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
  @Prop({ required: true })
  poolId: Types.ObjectId
  @Prop({ required: true })
  instructorId: Types.ObjectId
  @Prop({ required: true })
  classSize: number
  @Prop({ type: String, required: true, enum: LessonTypesEnum })
  lessonType: LessonTypesEnum
  @Prop({ type: [RegistrationSchema], required: false })
  registrations: RegistrationEntity[]
  @Prop({ required: true })
  startDateTime: Date
  @Prop({ required: true })
  endDateTime: Date
  @Prop({ type: String, required: true, enum: ScheduleStatusEnum, default: ScheduleStatusEnum.ACTIVE })
  status: ScheduleStatusEnum
}

export const ScheduleSchema = SchemaFactory.createForClass(ScheduleEntity)
