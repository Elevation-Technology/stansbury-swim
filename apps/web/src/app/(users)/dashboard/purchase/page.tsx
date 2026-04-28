export const dynamic = 'force-dynamic'

import PurchaseClient from '../components/PurchaseClient'
import { ProductService } from '@/services/api/shared/productService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { StudentService } from '@/services/api/shared/studentService'
import { ConfigService } from '@/services/api/shared/configService'
import { WaitlistService } from '@/services/api/shared/waitlistService'
import { PoolService } from '@/services/api/shared/poolService'

export default async function PurchasePage() {
  // Fetch all required data on the server
  const [products, schedules, students, config, waitlist, pools] = await Promise.all([
    ProductService.findAll(),
    ScheduleService.findParentTot(),
    StudentService.findMyStudents(),
    ConfigService.findOne(),
    WaitlistService.me().catch(() => null),
    PoolService.findAll(),
  ])

  let purchaseEnabled = !config.waitlistEnabled

  if (waitlist && !waitlist.allowed) {
    purchaseEnabled = false
  }
  if (config.waitlistEnabled && waitlist && waitlist.allowed) {
    purchaseEnabled = true
  }

  return (
    <PurchaseClient
      products={products}
      schedules={schedules}
      students={students}
      waitlistEnabled={config.waitlistEnabled}
      onWaitlist={!!waitlist}
      purchaseEnabled={purchaseEnabled}
      pools={pools}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || ''}
    />
  )
}
