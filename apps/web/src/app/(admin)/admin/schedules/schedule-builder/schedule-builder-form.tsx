'use client'

import { useState, useEffect } from 'react'
import { Select } from '@components/select'
import { useInstructors } from '@contexts/instructor-context'
import { usePools } from '@contexts/pools-context'
import { format, subWeeks, subDays, parse } from 'date-fns'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { ORG_TIMEZONE } from '@/app/utils/dates'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { Button } from '@components/button'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { SearchScheduleResponseDto } from '@/api/models/SearchScheduleResponseDto'
import { LessonTypesEnum } from '@lesson-scheduler/shared'

interface LessonFormData {
  id?: string
  startTime: string
  endTime: string
  lessonType: SearchScheduleResponseDto.lessonType
  classSize: number
  isEditing: boolean
  error?: string
}
export default function ScheduleBuilderForm() {
  const { instructors } = useInstructors()
  const { pools } = usePools()
  const [selectedPool, setSelectedPool] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedDate, setSelectedDate] = useState(formatInTimeZone(new Date(), ORG_TIMEZONE, 'yyyy-MM-dd'))
  const [currentDayLessons, setCurrentDayLessons] = useState<SearchScheduleResponseDto[]>([])
  const [previousWeekLessons, setPreviousWeekLessons] = useState<SearchScheduleResponseDto[]>([])
  const [previousDayLessons, setPreviousDayLessons] = useState<SearchScheduleResponseDto[]>([])
  const [lessonForms, setLessonForms] = useState<LessonFormData[]>([
    {
      startTime: '09:00',
      endTime: '09:30',
      lessonType: SearchScheduleResponseDto.lessonType.PRIVATE,
      classSize: 1,
      isEditing: true,
    },
  ])
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [currentSavingIndex, setCurrentSavingIndex] = useState<number | null>(null)

  const instructorOptions = instructors.map(instructor => ({
    value: instructor.id,
    label: instructor.name,
  }))

  const poolOptions = pools.map(pool => ({
    value: pool.id,
    label: pool.name,
  }))

  const searchLessons = async (poolId: string, instructorId: string, date: Date, daysOfWeek?: string) => {
    const apiLessons = await ScheduleService.search({
      pools: [poolId],
      instructors: [instructorId],
      // `date` is a calendar date held at local midnight, so read its local fields.
      // toISOString would convert to UTC and shift the date for browsers east of UTC.
      date: format(date, 'yyyy-MM-dd'),
      timezone: ORG_TIMEZONE,
      daysOfWeek: daysOfWeek ? [daysOfWeek] : undefined,
      includeReserved: true,
    })
    // Filter for exact pool and instructor match and sort by start time
    return apiLessons
      .filter(lesson => lesson.poolId === poolId && lesson.instructorId === instructorId)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
  }

  useEffect(() => {
    const fetchLessons = async () => {
      if (!selectedPool || !selectedInstructor || !selectedDate) {
        setLessonForms([
          {
            startTime: '09:00',
            endTime: '09:30',
            lessonType: SearchScheduleResponseDto.lessonType.PRIVATE,
            classSize: 1,
            isEditing: true,
          },
        ])
        return
      }

      const selectedDateObj = new Date(`${selectedDate}T00:00:00.000`)
      const previousWeekDate = subWeeks(selectedDateObj, 1)
      const previousDayDate = subDays(selectedDateObj, 1)
      const dayOfWeek = format(selectedDateObj, 'EEEE').toLowerCase()

      try {
        // Fetch current day's lessons
        const currentLessons = await searchLessons(selectedPool, selectedInstructor, selectedDateObj)
        setCurrentDayLessons(currentLessons)

        // Convert current day's lessons to form data
        const currentLessonForms: LessonFormData[] = currentLessons
          .map(lesson => ({
            id: lesson.id,
            startTime: format(new Date(lesson.startDateTime), 'HH:mm'),
            endTime: format(new Date(lesson.endDateTime), 'HH:mm'),
            lessonType: lesson.lessonType,
            classSize: lesson.classSize,
            isEditing: false,
          }))
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        // Add a new empty lesson form if there are no existing lessons
        if (currentLessonForms.length === 0) {
          currentLessonForms.push({
            startTime: '09:00',
            endTime: '09:30',
            lessonType: SearchScheduleResponseDto.lessonType.PRIVATE,
            classSize: 1,
            isEditing: true,
          })
        }

        setLessonForms(currentLessonForms)

        // Fetch previous week's lessons
        const weekLessons = await searchLessons(selectedPool, selectedInstructor, previousWeekDate, dayOfWeek)
        setPreviousWeekLessons(weekLessons)

        // Fetch previous day's lessons
        const dayLessons = await searchLessons(selectedPool, selectedInstructor, previousDayDate)
        setPreviousDayLessons(dayLessons)
      } catch (error) {
        console.error('Error fetching lessons:', error)
        setCurrentDayLessons([])
        setPreviousWeekLessons([])
        setPreviousDayLessons([])
        setLessonForms([
          {
            startTime: '09:00',
            endTime: '09:30',
            lessonType: SearchScheduleResponseDto.lessonType.PRIVATE,
            classSize: 1,
            isEditing: true,
            error: 'Failed to load lessons. Please try again.',
          },
        ])
      }
    }

    fetchLessons()
  }, [selectedPool, selectedInstructor, selectedDate])

  const handleAddLesson = () => {
    const lastLesson = lessonForms[lessonForms.length - 1]
    const newLesson = {
      startTime: lastLesson?.endTime || '09:00',
      endTime: format(new Date(`2000-01-01T${lastLesson?.endTime || '09:00'}`).getTime() + 20 * 60000, 'HH:mm'),
      lessonType: SearchScheduleResponseDto.lessonType.PRIVATE,
      classSize: 1,
      isEditing: true,
    }
    setLessonForms([...lessonForms, newLesson].sort((a, b) => a.startTime.localeCompare(b.startTime)))
  }

  const handleLessonChange = (index: number, field: keyof LessonFormData, value: string | number) => {
    const newForms = [...lessonForms]
    if (field === 'startTime') {
      // Ensure time is in 20-minute increments
      const [hours, minutes] = (value as string).split(':')
      const roundedMinutes = Math.round(parseInt(minutes) / 20) * 20
      const roundedTime = `${hours}:${roundedMinutes.toString().padStart(2, '0')}`

      // Validate time is between 7am and 8pm
      const time = new Date(`2000-01-01T${roundedTime}`)
      const minTime = new Date(`2000-01-01T07:00`)
      const maxTime = new Date(`2000-01-01T21:00`)

      if (time < minTime || time > maxTime) {
        // If time is invalid, keep the previous value
        return
      }

      // Calculate end time 20 minutes after start time
      const startDate = new Date(`2000-01-01T${roundedTime}`)
      const endDate = new Date(startDate.getTime() + 20 * 60000)
      const endTime = format(endDate, 'HH:mm')

      // Validate end time is also within bounds
      if (endDate > maxTime) {
        return
      }

      newForms[index] = {
        ...newForms[index],
        [field]: roundedTime,
        endTime,
      }
    } else if (field === 'endTime') {
      // Validate end time is between 7am and 8pm
      const [hours, minutes] = (value as string).split(':')
      const roundedMinutes = Math.round(parseInt(minutes) / 20) * 20
      const roundedTime = `${hours}:${roundedMinutes.toString().padStart(2, '0')}`

      const time = new Date(`2000-01-01T${roundedTime}`)
      const minTime = new Date(`2000-01-01T07:00`)
      const maxTime = new Date(`2000-01-01T19:59`)

      if (time < minTime || time > maxTime) {
        return
      }

      newForms[index] = { ...newForms[index], [field]: roundedTime }
    } else if (field === 'lessonType') {
      // When changing to private, set class size to 1
      const lessonType = value as SearchScheduleResponseDto.lessonType
      newForms[index] = {
        ...newForms[index],
        [field]: lessonType,
        classSize: lessonType === 'private' ? 1 : newForms[index].classSize,
      }
    } else {
      newForms[index] = { ...newForms[index], [field]: value }
    }
    setLessonForms(newForms.sort((a, b) => a.startTime.localeCompare(b.startTime)))
  }

  const handleSave = async (index?: number) => {
    if (!selectedPool || !selectedInstructor || !selectedDate) return

    // Determine which lessons to save
    const lessonsToSave =
      index !== undefined ? [lessonForms[index]] : lessonForms.filter(form => !form.id && form.isEditing)

    if (lessonsToSave.length === 0) return

    setIsSavingAll(true)
    let hasError = false
    let currentForms = [...lessonForms]

    try {
      for (let i = 0; i < lessonsToSave.length; i++) {
        if (hasError) break
        const form = lessonsToSave[i]
        const formIndex = currentForms.findIndex(f => f === form)
        if (index !== undefined) {
          setCurrentSavingIndex(formIndex)
        }

        // The entered time is wall-clock time at the pool, so anchor it to the
        // organization's timezone instead of whatever the admin's browser is set to.
        const startDateTime = fromZonedTime(`${selectedDate}T${form.startTime}:00`, ORG_TIMEZONE)
        const endDateTime = fromZonedTime(`${selectedDate}T${form.endTime}:00`, ORG_TIMEZONE)

        // Format dates with timezone offset
        const startDateTimeString = startDateTime.toISOString()
        const endDateTimeString = endDateTime.toISOString()

        try {
          const apiSavedLesson = await ScheduleService.create({
            poolId: selectedPool,
            instructorId: selectedInstructor,
            lessonType: form.lessonType,
            classSize: form.classSize,
            startDateTime: startDateTimeString,
            endDateTime: endDateTimeString,
          })

          // Update the form with the saved lesson's ID
          currentForms[formIndex] = {
            ...currentForms[formIndex],
            id: apiSavedLesson.id,
            isEditing: false,
            error: undefined,
          }
          setLessonForms(currentForms)
        } catch (error) {
          console.error('Error saving lesson:', error)
          currentForms[formIndex] = {
            ...currentForms[formIndex],
            error: 'Failed to save lesson. Please try again.',
          }
          setLessonForms(currentForms)
          hasError = true
        }
      }

      // Refresh the current day's lessons
      const selectedDateObj = new Date(`${selectedDate}T00:00:00.000`)
      const currentLessons = await searchLessons(selectedPool, selectedInstructor, selectedDateObj)
      setCurrentDayLessons(currentLessons)
    } catch (error) {
      console.error('Error refreshing lessons:', error)
    } finally {
      setIsSavingAll(false)
      setCurrentSavingIndex(null)
    }
  }

  const handleRemoveLesson = async (index: number) => {
    const form = lessonForms[index]
    if (form.id) {
      try {
        await ScheduleService.remove(form.id)
        // Refresh current day's lessons after deletion
        const selectedDateObj = new Date(`${selectedDate}T00:00:00.000`)
        const currentLessons = await searchLessons(selectedPool, selectedInstructor, selectedDateObj)
        setCurrentDayLessons(currentLessons)
      } catch (error) {
        console.error('Error deleting lesson:', error)
        const newForms = [...lessonForms]
        newForms[index] = { ...newForms[index], error: 'Failed to delete lesson. Please try again.' }
        setLessonForms(newForms)
        return
      }
    }
    setLessonForms(lessonForms.filter((_, i) => i !== index))
  }

  const handleCopyPreviousWeek = () => {
    if (previousWeekLessons.length === 0) return

    // Get existing start times to check for conflicts
    const existingStartTimes = new Set(lessonForms.map(form => form.startTime))

    // Filter out lessons that would conflict with existing times
    const newForms = previousWeekLessons
      .filter(lesson => {
        const startTime = format(new Date(lesson.startDateTime), 'HH:mm')
        return !existingStartTimes.has(startTime)
      })
      .map(lesson => ({
        startTime: format(new Date(lesson.startDateTime), 'HH:mm'),
        endTime: format(new Date(lesson.endDateTime), 'HH:mm'),
        lessonType: lesson.lessonType,
        classSize: lesson.classSize,
        isEditing: true,
      }))

    // Only update if we have non-conflicting lessons to add
    if (newForms.length > 0) {
      setLessonForms([...lessonForms, ...newForms].sort((a, b) => a.startTime.localeCompare(b.startTime)))
    }
  }

  const handleCopyPreviousDay = () => {
    if (previousDayLessons.length === 0) return

    // Get existing start times to check for conflicts
    const existingStartTimes = new Set(lessonForms.map(form => form.startTime))

    // Filter out lessons that would conflict with existing times
    const newForms = previousDayLessons
      .filter(lesson => {
        const startTime = format(new Date(lesson.startDateTime), 'HH:mm')
        return !existingStartTimes.has(startTime)
      })
      .map(lesson => ({
        startTime: format(new Date(lesson.startDateTime), 'HH:mm'),
        endTime: format(new Date(lesson.endDateTime), 'HH:mm'),
        lessonType: lesson.lessonType,
        classSize: lesson.classSize,
        isEditing: true,
      }))

    // Only update if we have non-conflicting lessons to add
    if (newForms.length > 0) {
      setLessonForms([...lessonForms, ...newForms].sort((a, b) => a.startTime.localeCompare(b.startTime)))
    }
  }

  const isFormEnabled = selectedPool && selectedInstructor && selectedDate

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="pool" className="block text-sm font-medium text-gray-700">
            Pool
          </label>
          <Select id="pool" value={selectedPool} onChange={e => setSelectedPool(e.target.value)}>
            <option value="">Select a pool</option>
            {poolOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">
            Instructor
          </label>
          <Select id="instructor" value={selectedInstructor} onChange={e => setSelectedInstructor(e.target.value)}>
            <option value="">Select an instructor</option>
            {instructorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Schedule Lessons</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyPreviousWeek}
              className="flex items-center gap-2"
              disabled={!isFormEnabled || previousWeekLessons.length === 0}
            >
              Copy Lessons from Last {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'EEEE')} (
              {previousWeekLessons.length})
            </Button>
            <Button
              onClick={handleCopyPreviousDay}
              className="flex items-center gap-2"
              disabled={!isFormEnabled || previousDayLessons.length === 0}
            >
              Copy Yesterday's Schedule ({previousDayLessons.length})
            </Button>
            <Button onClick={handleAddLesson} className="flex items-center gap-2" disabled={!isFormEnabled}>
              <PlusIcon className="h-4 w-4" />
              Add Lesson
            </Button>
            <Button
              onClick={() => handleSave()}
              className="flex items-center gap-2"
              disabled={!isFormEnabled || !lessonForms.some(form => !form.id && form.isEditing) || isSavingAll}
            >
              {isSavingAll ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>

        {!isFormEnabled && (
          <div className="mt-2 text-sm text-gray-500">Please select a pool, instructor, and date to add lessons</div>
        )}
        {isFormEnabled && (
          <div className="flex items-center mb-4">
            <div className="mt-2 text-sm text-gray-500">
              Creating schedules for {instructors.find(i => i.id === selectedInstructor)?.name} at{' '}
              {pools.find(p => p.id === selectedPool)?.name} on{' '}
              {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
            </div>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Start Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  End Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Class Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lessonForms.map((form, index) => (
                <tr key={index} className={form.isEditing ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {form.isEditing ? (
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={e => handleLessonChange(index, 'startTime', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!isFormEnabled}
                        step="900"
                        min="07:00"
                        max="21:00"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {format(parse(form.startTime, 'HH:mm', new Date()), 'hh:mm a')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {form.isEditing ? (
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={e => handleLessonChange(index, 'endTime', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!isFormEnabled}
                        step="900"
                        min="07:00"
                        max="21:00"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {format(parse(form.endTime, 'HH:mm', new Date()), 'hh:mm a')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {form.isEditing ? (
                      <Select
                        value={form.lessonType}
                        onChange={e => handleLessonChange(index, 'lessonType', e.target.value as 'private' | 'group')}
                        disabled={!isFormEnabled}
                        className="disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="private">Private</option>
                        <option value="group">Group</option>
                      </Select>
                    ) : (
                      <span className="text-sm text-gray-900">
                        {form.lessonType === 'private' ? 'Private' : 'Group'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {form.isEditing ? (
                      <input
                        type="number"
                        min="1"
                        value={form.classSize}
                        onChange={e => handleLessonChange(index, 'classSize', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!isFormEnabled || form.lessonType === 'private'}
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{form.classSize}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {form.isEditing ? (
                        <>
                          <Button
                            onClick={() => handleSave(index)}
                            disabled={!isFormEnabled || (isSavingAll && currentSavingIndex === index)}
                          >
                            {isSavingAll && currentSavingIndex === index ? (
                              <span className="flex items-center gap-2">
                                <svg
                                  className="animate-spin h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Saving...
                              </span>
                            ) : (
                              'Save'
                            )}
                          </Button>
                          {!currentDayLessons.find(lesson => lesson.id === form.id)?.registrations?.length && (
                            <Button
                              onClick={() => handleRemoveLesson(index)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 disabled:bg-gray-400 disabled:hover:bg-gray-400"
                              disabled={!isFormEnabled || (isSavingAll && currentSavingIndex === index)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        !currentDayLessons.find(lesson => lesson.id === form.id)?.registrations?.length && (
                          <Button
                            onClick={() => handleRemoveLesson(index)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 disabled:bg-gray-400 disabled:hover:bg-gray-400"
                            disabled={!isFormEnabled || (isSavingAll && currentSavingIndex === index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lessonForms.some(form => form.error) && (
          <div className="mt-4 text-sm text-red-600">{lessonForms.find(form => form.error)?.error}</div>
        )}
      </div>
    </div>
  )
}
