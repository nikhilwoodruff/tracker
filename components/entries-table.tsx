'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Entry = {
  id: string
  content: string
  category: string | null
  tags: string[] | null
  metadata: any
  created_at: string
  updated_at: string
}

export default function EntriesTable() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchEntries()

    const channel = supabase
      .channel('entries-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        () => fetchEntries()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching entries:', error)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }

  if (loading) return <div className="p-4">Loading entries...</div>

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Content
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tags
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {format(new Date(entry.created_at), 'MMM d, h:mm a')}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {entry.content}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {entry.category || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {entry.tags?.join(', ') || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No entries yet. Start logging your activities above.
        </div>
      )}
    </div>
  )
}