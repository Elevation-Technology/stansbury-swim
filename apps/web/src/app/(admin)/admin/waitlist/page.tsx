import { Heading } from '@components/heading'
import type { Metadata } from 'next'
import Waitlist from './waitlist'

export const metadata: Metadata = {
  title: 'Waitlist',
}

export default async function UsersPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Waitlist</Heading>
        </div>
      </div>
      <Waitlist />
    </>
  )
}
