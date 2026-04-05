import { useState } from 'react'

interface OverageConfirmModalProps {
  isOpen: boolean
  amount: number
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function OverageConfirmModal({
  isOpen,
  amount,
  onConfirm,
  onCancel,
  loading,
}: OverageConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No Credits Available
        </h2>
        <p className="text-gray-600 mb-6">
          You've used all your monthly credits. Claiming this lead will charge <span className="font-bold text-orange-600">${amount}</span> to your card.
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-800">
            This charge covers overage pricing for this single lead. Your monthly credit allowance resets on the 1st of next month.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 text-white bg-orange-600 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Charge $${amount}`}
          </button>
        </div>
      </div>
    </div>
  )
}
