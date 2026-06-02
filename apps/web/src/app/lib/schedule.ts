export interface Schedule {
  id: string
  poolId: string
  instructorId: string
  classSize: number
  lessonType: 'private' | 'group'
  startDateTime: string
  endDateTime: string
  registrations: Array<{
    userId: string
    studentId: string
    createdAt: string
    transactionId?: string
    pending?: boolean
  }>

  spotsAvailable?: number
}
