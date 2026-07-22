'use client'

import { Button } from '@/app/components/button'
import { useState } from 'react'
import { UserService } from '@/services/api/shared/userService'
import { UserResponseDto } from '@/api'

interface EmailSectionProps {
  user: UserResponseDto
}

export function EmailSection({ user }: EmailSectionProps) {
  const [email, setEmail] = useState(user.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changed = email.trim().toLowerCase() !== (user.email || '').toLowerCase()

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await UserService.update(user.id, { email: email.trim() })
      window.location.reload()
    } catch (err: any) {
      setError(err?.body?.message || err?.message || 'Failed to update email address')
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Email Address</h3>
            <p className="mt-1 text-sm text-gray-500">
              Correct a mistyped address here. An admin change applies straight away, because someone whose address is
              wrong cannot receive a confirmation at it.
            </p>
            {user.pendingEmail && (
              <p className="mt-2 text-sm text-amber-700">
                Waiting on this user to confirm {user.pendingEmail}. Saving here replaces both.
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="email"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button className="whitespace-nowrap" onClick={save} disabled={!changed || !email.trim() || saving}>
              {saving ? 'Saving...' : 'Save Email'}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
