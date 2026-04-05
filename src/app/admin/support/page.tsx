import AdminSupportClient from '@/components/admin/AdminSupportClient'

export const revalidate = 0

export default async function AdminSupportPage() {
  // Data fetched client-side for real-time filtering
  return <AdminSupportClient />
}
