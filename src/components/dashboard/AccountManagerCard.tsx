interface AccountManagerCardProps {
  managerName: string
  managerEmail: string
  managerPhone?: string
  joinedDate: string
}

export default function AccountManagerCard({
  managerName,
  managerEmail,
  managerPhone,
  joinedDate,
}: AccountManagerCardProps) {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Your Account Manager</h3>
          <p className="text-sm text-gray-600">Dedicated support for your Elite Plus success</p>
        </div>
        <div className="text-3xl">👤</div>
      </div>

      <div className="space-y-3 mb-6 pb-6 border-b border-yellow-200">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Name</p>
          <p className="text-gray-900 font-medium">{managerName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Email</p>
          <p className="text-orange-600 font-medium">{managerEmail}</p>
        </div>
        {managerPhone && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Phone</p>
            <p className="text-gray-900 font-medium">{managerPhone}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <a
          href={`mailto:${managerEmail}`}
          className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm text-center hover:bg-orange-700 transition-colors"
        >
          Email
        </a>
        {managerPhone && (
          <a
            href={`tel:${managerPhone}`}
            className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium text-sm text-center hover:bg-gray-300 transition-colors"
          >
            Call
          </a>
        )}
      </div>
    </div>
  )
}
