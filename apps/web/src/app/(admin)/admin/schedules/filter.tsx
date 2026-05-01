'use client'

import { Fragment, useState } from 'react'
import { Listbox, ListboxOption, ListboxOptions, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { useInstructors } from '@contexts/instructor-context'
import { usePools } from '@contexts/pools-context'

interface FilterProps {
  onInstructorChange: (instructorId: string) => void
  onPoolChange: (poolId: string) => void
  onDateChange: (date: string) => void
  onLessonTypeChange: (lessonType: string) => void
  selectedInstructor: string
  selectedPool: string
  selectedDate: string
  selectedLessonType: string
}

export default function Filter({
  onInstructorChange,
  onPoolChange,
  onDateChange,
  onLessonTypeChange,
  selectedInstructor,
  selectedPool,
  selectedDate,
  selectedLessonType,
}: FilterProps) {
  const { instructors } = useInstructors()
  const { pools } = usePools()
  const [date, setDate] = useState(selectedDate)

  const lessonTypes = [
    { id: '', name: 'All Types' },
    { id: 'private', name: 'Private' },
    { id: 'group', name: 'Group' },
  ]

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDate(newDate)
    onDateChange(newDate)
  }

  const handleClearDate = () => {
    setDate('')
    onDateChange('')
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-64">
        <Listbox value={selectedInstructor} onChange={onInstructorChange}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm dark:bg-zinc-800 dark:text-white">
              <span className="block truncate">
                {selectedInstructor ? instructors.find(i => i.id === selectedInstructor)?.name : 'All Instructors'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-zinc-800 dark:ring-white/10">
                <ListboxOption
                  key="all"
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900 dark:text-white'
                    }`
                  }
                  value=""
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        All Instructors
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
                {instructors.map(instructor => (
                  <ListboxOption
                    key={instructor.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-amber-100 text-amber-900' : 'text-gray-900 dark:text-white'
                      }`
                    }
                    value={instructor.id}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {instructor.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>

      <div className="w-64">
        <Listbox value={selectedPool} onChange={onPoolChange}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm dark:bg-zinc-800 dark:text-white">
              <span className="block truncate">
                {selectedPool ? pools.find(p => p.id === selectedPool)?.name : 'All Pools'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-zinc-800 dark:ring-white/10">
                <ListboxOption
                  key="all"
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900 dark:text-white'
                    }`
                  }
                  value=""
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>All Pools</span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
                {pools.map(pool => (
                  <ListboxOption
                    key={pool.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-amber-100 text-amber-900' : 'text-gray-900 dark:text-white'
                      }`
                    }
                    value={pool.id}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {pool.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>

      <div className="w-64">
        <Listbox value={selectedLessonType} onChange={onLessonTypeChange}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm dark:bg-zinc-800 dark:text-white">
              <span className="block truncate">
                {selectedLessonType ? lessonTypes.find(t => t.id === selectedLessonType)?.name : 'All Types'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-zinc-800 dark:ring-white/10">
                {lessonTypes.map(type => (
                  <ListboxOption
                    key={type.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-amber-100 text-amber-900' : 'text-gray-900 dark:text-white'
                      }`
                    }
                    value={type.id}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {type.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>

      <div className="w-64 flex gap-2">
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:[color-scheme:dark]"
        />
        <button
          onClick={handleClearDate}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-700"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
