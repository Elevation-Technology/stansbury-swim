import { ApiProperty } from '@nestjs/swagger'
import { LessonTypesEnum } from 'shared/lesson-types.enum'

export class ProductResponseDto {
  @ApiProperty({ example: 'productId123', description: 'Product ID' })
  id: string

  @ApiProperty({ example: 1, description: 'Order of the product' })
  order: number

  @ApiProperty({ example: 'Product Name', description: 'Name of the product' })
  name: string

  @ApiProperty({ enum: LessonTypesEnum, description: 'Type of lesson' })
  lessonType: LessonTypesEnum

  @ApiProperty({ example: 10, description: 'Number of credits' })
  credits: number

  @ApiProperty({ example: true, description: 'Is the product active?' })
  active: boolean

  @ApiProperty({ example: 100, description: 'Amount for the product' })
  amount: number

  @ApiProperty({ example: 'Description of the product', description: 'Product description' })
  description: string

  @ApiProperty({
    example: 'scheduleId123',
    required: false,
    description: 'Group schedule (session) this product sells, if linked',
  })
  scheduleId?: string

  @ApiProperty({ type: [String], description: 'List of product features' })
  features: string[]
}
