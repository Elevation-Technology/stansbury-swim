'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogPanel } from '@headlessui/react'
import { Button } from '@components/button'
import { Input } from '@components/input'
import { Select } from '@components/select'
import { ProductService } from '@/services/api/shared/productService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { CreateProductDto, ParentTotScheduleResponseDto } from '@/api'
import { formatDateTime } from '@/app/utils/dates'

// Picker only offers valid (future) group sessions — the same set shoppers can
// book. Old/expired sessions are filtered out server-side. Full sessions are still
// shown (admin may want to link one) but flagged.
const sessionLabel = (s: ParentTotScheduleResponseDto) => {
  return `${formatDateTime(s.startDateTime)} — ${s.spotsAvailable} open${s.spotsAvailable <= 0 ? ' (full)' : ''}`
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ProductModal({ isOpen, onClose, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: 0,
    credits: 0,
    order: 0,
    lessonType: CreateProductDto.lessonType.PRIVATE,
    scheduleId: '',
  })
  const [schedules, setSchedules] = useState<ParentTotScheduleResponseDto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isGroup = formData.lessonType === CreateProductDto.lessonType.GROUP

  // Load every group session so the admin can link this product to one. Without a
  // link, a group product renders an unselectable session dropdown for shoppers —
  // the exact failure this picker prevents.
  useEffect(() => {
    if (!isOpen) return
    ScheduleService.findParentTot()
      .then(setSchedules)
      .catch(() => setSchedules([]))
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isGroup && !formData.scheduleId) {
      setError(
        'Group products must be linked to a session. Create the session in the Schedule Builder first, then select it here.',
      )
      return
    }

    setIsSubmitting(true)
    try {
      await ProductService.create({
        name: formData.name,
        description: formData.description,
        amount: formData.amount,
        credits: formData.credits,
        order: formData.order,
        lessonType: formData.lessonType,
        scheduleId: isGroup ? formData.scheduleId : undefined,
        active: true,
        features: ['Personal Instructor', 'Warm Waters', 'Flexible Scheduling'],
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError('Failed to create product. Please try again.')
      console.error('Error creating product:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-8 dark:bg-zinc-900">
            <DialogTitle className="text-lg font-medium">Add New Product</DialogTitle>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Product Name"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Product Description"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Amount
                </label>
                <Input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Product Amount"
                />
              </div>
              <div>
                <label htmlFor="credits" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Credits
                </label>
                <Input
                  type="number"
                  id="credits"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Product Credits"
                />
              </div>
              <div>
                <label htmlFor="lessonType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Lesson Type
                </label>
                <Select
                  id="lessonType"
                  name="lessonType"
                  value={formData.lessonType}
                  onChange={handleChange}
                  required
                  className="mt-1"
                >
                  <option value={CreateProductDto.lessonType.PRIVATE}>Private</option>
                  <option value={CreateProductDto.lessonType.GROUP}>Group (Parent &amp; Tot)</option>
                </Select>
              </div>
              {isGroup && (
                <div>
                  <label htmlFor="scheduleId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Session
                  </label>
                  <Select
                    id="scheduleId"
                    name="scheduleId"
                    value={formData.scheduleId}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  >
                    <option value="">Select a session…</option>
                    {schedules.map(schedule => (
                      <option key={schedule.id} value={schedule.id}>
                        {sessionLabel(schedule)}
                      </option>
                    ))}
                  </Select>
                  {schedules.length === 0 && (
                    <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                      No upcoming group sessions found. Create one in the Schedule Builder first.
                    </p>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Order
                </label>
                <Input
                  type="number"
                  id="order"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Product Order"
                />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="mt-6 flex justify-end gap-x-3">
                <Button onClick={onClose} plain>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
