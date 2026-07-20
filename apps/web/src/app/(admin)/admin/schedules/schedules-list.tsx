'use client'

import { useInstructors } from '@contexts/instructor-context'
import { usePools } from '@contexts/pools-context'
import { Fragment, useState } from 'react'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { TrashIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ScheduleResponseDto } from '@/api'
import Time from '@/app/components/time'

interface SchedulesListProps {
  schedules: ScheduleResponseDto[]
  onDelete?: () => void
}

export default function SchedulesList({ schedules, onDelete }: SchedulesListProps) {
  const { instructors } = useInstructors()
  const { pools } = usePools()
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleResponseDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (scheduleId: string) => {
    try {
      await ScheduleService.remove(scheduleId)
      onDelete?.()
      setScheduleToDelete(null)
      setError(null)
    } catch (error) {
      console.error('Error deleting schedule:', error)
      setError(`Error deleting schedule. ${error instanceof Error ? error.message : 'Unknown error'}`)
      setScheduleToDelete(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  onClick={() => setError('')}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Instructor
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Pool
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Start Time
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Registrations
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {schedules.map(schedule => {
                    const instructor = instructors.find(i => i.id === schedule.instructorId)
                    const pool = pools.find(p => p.id === schedule.poolId)

                    return (
                      <tr key={schedule.id} className={schedule.registrations.length > 0 ? 'bg-blue-50' : ''}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {instructor?.name ?? 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{pool?.name ?? 'Unknown'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {schedule.lessonType === 'private' ? 'Private' : 'Group'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Time dateTime={schedule.startDateTime} alwaysShowTimeZone />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {schedule.registrations.length > 0 && (
                            <>
                              {schedule.lessonType === 'group' && (
                                <div className="text-gray-500">
                                  {schedule.registrations.length}/{schedule.classSize}
                                </div>
                              )}
                              <span className="text-green-600 underline">
                                {schedule.registrations.map((r, index) => (
                                  <Fragment key={r.student.id}>
                                    {index > 0 && ', '}
                                    <Link
                                      key={r.student.id}
                                      href={`/admin/users/${r.user.id}`}
                                      className="hover:underline"
                                    >
                                      {r.student.name}
                                    </Link>
                                    {r.pending && (
                                      <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 no-underline">
                                        pending payment
                                      </span>
                                    )}
                                  </Fragment>
                                ))}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            type="button"
                            onClick={() => setScheduleToDelete(schedule)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {scheduleToDelete && (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                      Delete Schedule
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this schedule? This action cannot be undone. If there are
                        registrations, the schedule will be canceled and the credits will be restored to the account and
                        the user notified.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={() => handleDelete(scheduleToDelete.id)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => {
                      setScheduleToDelete(null)
                      setError(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
