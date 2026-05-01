import React from 'react'
import Link from 'next/link'
import { StatsService } from '@/services/api/shared/statsService'

export const dynamic = 'force-dynamic'

const YEARS_BACK = 3

export default async function Admin({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year: yearParam } = await searchParams
  const currentYear = new Date().getFullYear()
  const selectedYear = yearParam ? parseInt(yearParam, 10) : currentYear
  const yearOptions = Array.from({ length: YEARS_BACK + 1 }, (_, i) => currentYear - i)

  const stats = await StatsService.findAll(selectedYear)

  return (
    <>
      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
          </div>
        </header>
        <main className="px-6">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 py-10">
            <div>
              <div className="sm:flex sm:items-center">
                <div className="py-5 w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Stats</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Season:</span>
                      {yearOptions.map(year => (
                        <Link
                          key={year}
                          href={`/admin?year=${year}`}
                          className={
                            year === selectedYear
                              ? 'rounded-md bg-indigo-600 px-2.5 py-1 text-sm font-semibold text-white shadow-sm'
                              : 'rounded-md px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }
                        >
                          {year}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 dark:text-white">
                    {[
                      { name: 'Private lesson credits purchased', stat: stats.privateLessons },
                      { name: 'Group lesson credits purchased', stat: stats.groupLessons },
                      { name: 'Purchased and unscheduled', stat: stats.unscheduledPrivateLessons },
                      { name: 'Total available lessons', stat: stats.availableLessons },
                      { name: 'Active users', stat: stats.activeUsers },
                    ].map(item => (
                      <div
                        key={item.name}
                        className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 dark:bg-black"
                      >
                        <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                          {item.stat}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div className="mt-8 flow-root"></div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
