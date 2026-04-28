'use client'

import { useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import { MeService } from '@/services/api/shared/meService'
import { AuthService } from '@/services/api/shared/authService'
import { deleteCookie, AUTH_COOKIE_NAME } from '@/app/utils/cookies'
import { ApiError } from '@/api'

const CONFIRM_PHRASE = 'DELETE'

export default function DeleteAccountSection() {
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)
    try {
      await MeService.remove()
      try {
        googleLogout()
      } catch {
        // Google logout is best-effort; account is already deleted server-side.
      }
      try {
        await AuthService.logout()
      } catch {
        // Logout endpoint may 401 because the account no longer exists; that's fine.
      }
      deleteCookie(AUTH_COOKIE_NAME)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
      }
      window.location.href = '/'
    } catch (err) {
      console.error('Account deletion failed', err)
      if (err instanceof ApiError) {
        setError(err.body?.message || 'Account deletion failed. Please contact support.')
      } else {
        setError('Account deletion failed. Please contact support.')
      }
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-12 border-t border-red-200 pt-8">
      <h2 className="text-base/7 font-semibold text-red-700">Delete Account</h2>
      <p className="mt-1 text-sm/6 text-gray-600">
        Permanently delete your Stansbury Swim account and the personal information associated with it. Some records
        (such as signed liability waivers and payment history) may be retained as required by law. This action cannot
        be undone.
      </p>

      {!isConfirming ? (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="mt-4 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Type <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span> below to confirm. Once you confirm,
            your account will be deleted immediately.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            disabled={isDeleting}
            placeholder={CONFIRM_PHRASE}
            className="mt-3 block w-full max-w-xs rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6"
            aria-label={`Type ${CONFIRM_PHRASE} to confirm account deletion`}
          />
          {error && (
            <div className="mt-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          <div className="mt-4 flex items-center gap-x-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_PHRASE || isDeleting}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isDeleting ? 'Deleting...' : 'Permanently delete account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsConfirming(false)
                setConfirmText('')
                setError(null)
              }}
              disabled={isDeleting}
              className="text-sm font-semibold leading-6 text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
