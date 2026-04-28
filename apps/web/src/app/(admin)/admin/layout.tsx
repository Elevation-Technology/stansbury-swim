import '@/app/global.css'
import type { Metadata } from 'next'
import AdminLayout from './admin-layout'
import { ClientWrapper } from './client-wrapper'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: {
    template: '%s - Stansbury Swim',
    default: 'Stansbury Swim',
  },
  description: '',
}

export const dynamic = 'force-dynamic'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="text-zinc-950 antialiased lg:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950"
    >
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        <ClientWrapper googleClientId={process.env.GOOGLE_CLIENT_ID || ''}>
          <SpeedInsights />
          <Analytics />
          <div className="min-h-full">
            <AdminLayout>{children}</AdminLayout>
          </div>
        </ClientWrapper>
      </body>
    </html>
  )
}
