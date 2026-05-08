import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, Document } from 'mongoose'

@Schema({
  collection: 'pools',
  timestamps: true,
})
export class PoolEntity extends Document {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  address: string

  @Prop({ required: true })
  details: string

  @Prop({ required: true })
  imageUrl: string

  @Prop({ required: false, default: '' })
  instructions: string
}

export const PoolSchema = SchemaFactory.createForClass(PoolEntity)
