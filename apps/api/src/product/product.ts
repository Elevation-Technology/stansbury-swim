import { LessonTypesEnum } from 'shared/lesson-types.enum'

export class Product {
  id: string
  order: number
  name: string
  lessonType: LessonTypesEnum
  credits: number
  active: boolean
  amount: number
  description: string
  scheduleId?: string
  features: string[]
}
