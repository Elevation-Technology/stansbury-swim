import { Heading } from '@components/heading'
import { InstructorService } from '@/services/api/shared/instructorService'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import { Button } from '@/app/components/button'
import Link from 'next/link'
import { DescriptionList, DescriptionTerm, DescriptionDetails } from '@/app/components/description-list'
import { Table, TableHead, TableCell, TableRow, TableBody } from '@/app/components/table'
import { CreateTransactionForm } from './create-transaction-form'
import { Metadata } from 'next'
import { Divider } from '@/app/components/divider'
import { RolesSection } from './roles-section'
import { UserService } from '@/services/api/shared/userService'
import { StudentService } from '@/services/api/shared/studentService'
import { TransactionsService } from '@/services/api/shared/transactionsService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { PoolService } from '@/services/api/shared/poolService'
import { formatDateTime } from '@/app/utils/dates'
import { Fragment } from 'react'

export const metadata: Metadata = {
  title: 'User Details',
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await UserService.findOne(id)
  const students = await StudentService.findAllByUserId(id)
  const transactions = await TransactionsService.findByUserId(id)
  const currentBalance = await TransactionsService.getCreditBalance(id)
  const instructors = await InstructorService.findAll()
  const scheduleIds = transactions.map(transaction => transaction.scheduleId).filter(id => id !== undefined)
  const schedules = await ScheduleService.findAll(scheduleIds.join(','))
  const pools = await PoolService.findAll()

  // This is a server component, so an unpinned timezone would render in the
  // server's timezone (UTC) rather than the pool's.
  const formatDateTimeWithTimezone = (dateTime: string) => formatDateTime(dateTime, { timeZoneName: 'shortGeneric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <Heading>User Details</Heading>
      </div>

      <h2 className="text-2xl font-bold">User Details</h2>
      <DescriptionList>
        <DescriptionTerm>Name</DescriptionTerm>
        <DescriptionDetails>
          {user.firstName} {user.lastName}
        </DescriptionDetails>

        <DescriptionTerm>Email</DescriptionTerm>
        <DescriptionDetails>{user.email}</DescriptionDetails>

        <DescriptionTerm>Phone</DescriptionTerm>
        <DescriptionDetails>{user.phone}</DescriptionDetails>

        <DescriptionTerm>Role</DescriptionTerm>
        <DescriptionDetails>{user.role}</DescriptionDetails>

        <DescriptionTerm>Address</DescriptionTerm>
        <DescriptionDetails>
          {user.address1}
          {user.address2 && <br />}
          {user.address2}
          <br />
          {user.city}, {user.state} {user.zip}
        </DescriptionDetails>

        <DescriptionTerm>Private Registration</DescriptionTerm>
        <DescriptionDetails>{user.privateRegistration ? 'Yes' : 'No'}</DescriptionDetails>

        <DescriptionTerm>Created At</DescriptionTerm>
        <DescriptionDetails>{new Date(user.createdAt ?? '').toLocaleString()}</DescriptionDetails>

        <DescriptionTerm>Updated At</DescriptionTerm>
        <DescriptionDetails>{new Date(user.updatedAt ?? '').toLocaleString()}</DescriptionDetails>

        <DescriptionTerm>Unused Credits</DescriptionTerm>
        {/* <DescriptionDetails>{user.unusedCredits}</DescriptionDetails> */}
      </DescriptionList>
      <h2 className="text-2xl font-bold">Student Details</h2>
      <DescriptionList>
        {students.map(student => (
          <div key={student.id}>
            <DescriptionTerm>{student.name}</DescriptionTerm>
            <DescriptionDetails>{student.notes}</DescriptionDetails>
          </div>
        ))}
      </DescriptionList>
      <h2 className="text-2xl font-bold">Transactions</h2>
      <div className="flex items-center gap-4 text-sm">
        Current Balance: {currentBalance.balances.find(balance => balance.creditType === 'private')?.balance}
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Transaction Type</TableCell>
            <TableCell>Credit Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Credits</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map(transaction => {
            const schedule = schedules.find(schedule => schedule.id === transaction.scheduleId)
            const formatSchedule = () => {
              const pool = pools.find(pool => pool.id === schedule?.poolId)
              const instructor = instructors.find(instructor => instructor.id === schedule?.instructorId)
              const start = schedule?.startDateTime ? formatDateTimeWithTimezone(schedule.startDateTime) : ''
              const end = schedule?.endDateTime ? formatDateTimeWithTimezone(schedule.endDateTime) : ''
              return `${start} - ${end} at ${pool?.name} with ${instructor?.name}`
            }
            const typeLabel =
              transaction.transactionType === 'PURCHASE_CREDITS'
                ? 'Purchase Credits'
                : transaction.transactionType === 'REGISTER'
                  ? 'Register'
                  : 'Cancel Registration'
            return (
              <Fragment key={transaction.id}>
                <TableRow>
                  <TableCell>{typeLabel}</TableCell>
                  <TableCell>{transaction.creditType}</TableCell>
                  <TableCell>${transaction.amount}</TableCell>
                  <TableCell>{transaction.credits}</TableCell>
                  <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                </TableRow>
                {schedule && (
                  <TableRow className="text-sm text-zinc-500 dark:text-zinc-400 !border-none">
                    <TableCell colSpan={5}>{formatSchedule()}</TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>

      <h2 className="text-2xl font-bold">Create Transaction</h2>
      <CreateTransactionForm userId={id} />
      <Divider />
      <h2 className="text-2xl font-bold">Roles</h2>
      <RolesSection user={user} instructors={instructors} />
    </div>
  )
}
