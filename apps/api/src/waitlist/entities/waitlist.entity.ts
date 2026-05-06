import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, Document } from 'mongoose'

@Schema({
  collection: 'waitlist',
  timestamps: true,
})
export class WaitlistEntity extends Document {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date

  @Prop({ required: true })
  userId: Types.ObjectId

  @Prop({ required: true })
  allowed: boolean

  @Prop({ required: false })
  allowedOn?: Date

  @Prop({ required: false })
  archivedAt?: Date
}

export const WaitlistSchema = SchemaFactory.createForClass(WaitlistEntity)
