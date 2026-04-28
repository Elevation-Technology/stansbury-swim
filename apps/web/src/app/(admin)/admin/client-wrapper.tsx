'use client'

import { UserProvider } from '@/app/contexts/user-context'
import AdminProtectedPage from './components/admin-protected-page'
import { AppProvider } from '@/app/app-provider'
import { CreditsProvider, InstructorsProvider, PoolsProvider } from '@contexts/index'
import { GoogleOAuthProvider } from '@react-oauth/google'

interface ClientWrapperProps {
  children: React.ReactNode
  googleClientId: string
}

export function ClientWrapper({ children, googleClientId }: ClientWrapperProps) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <UserProvider>
        <AdminProtectedPage>
          <AppProvider>
            <InstructorsProvider>
              <PoolsProvider>
                <CreditsProvider>{children}</CreditsProvider>
              </PoolsProvider>
            </InstructorsProvider>
          </AppProvider>
        </AdminProtectedPage>
      </UserProvider>
    </GoogleOAuthProvider>
  )
}
