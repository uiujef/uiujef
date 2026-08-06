'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

type Event = {
  id: string
  title: string
  date: string
  description: string
  image: string
  category: string
  requires_payment: boolean
  is_registration_open: boolean
  requires_registration: boolean
}

export function EventsManager() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Competition')
  const [image, setImage] = useState('')
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [requiresRegistration, setRequiresRegistration] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)

  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false })
      if (error) throw error
      if (data) setEvents(data as Event[])
    } catch (err: any) {
      toast.error('Database Error (Fetch Events): ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event)
      setTitle(event.title)
      setDate(event.date)
      setDescription(event.description || '')
      setCategory(event.category)
      setImage(event.image || '')
      setRequiresPayment(event.requires_payment || false)
      setRequiresRegistration(event.requires_registration || false)
      setIsRegistrationOpen(event.is_registration_open || false)
    } else {
      setEditingEvent(null)
      setTitle('')
      setDate('')
      setDescription('')
      setCategory('Competition')
      setImage('')
      setRequiresPayment(false)
      setRequiresRegistration(false)
      setIsRegistrationOpen(false)
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      title,
      date,
      description,
      category,
      image,
      requires_payment: requiresPayment,
      requires_registration: requiresRegistration,
      is_registration_open: isRegistrationOpen,
    }

    try {
      if (editingEvent) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingEvent.id)
        if (error) throw error
        toast.success('Event updated successfully!')
        setEvents(events.map(ev => ev.id === editingEvent.id ? { ...ev, ...payload } : ev))
        setIsModalOpen(false)
      } else {
        const { data, error } = await supabase.from('events').insert([payload]).select().single()
        if (error) throw error
        if (data) {
          toast.success('Event created successfully!')
          setEvents([data as Event, ...events])
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      toast.error('Database Error (Save Event): ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return

    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      toast.success('Event deleted successfully.')
      setEvents(events.filter(ev => ev.id !== id))
    } catch (err: any) {
      toast.error('Database Error (Delete Event): ' + err.message)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">Manage Events</h2>
          <p className="text-muted-foreground mt-1">Create, edit, or delete UIUJEF events.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-[#F26522] text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-[#F26522]/20 hover:bg-[#F26522]/90 transition-all">
          <Plus className="size-4" />
          Add Event
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-navy">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <div className="mx-auto size-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Calendar className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">No Events Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">It looks like there are no events in the system yet. Click "Add Event" to create your first one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Title</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-navy">{event.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(event.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-navy/5 text-navy text-[10px] font-bold uppercase tracking-wider">
                        {event.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {event.is_registration_open ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/10 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                          Registration Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(event)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="size-4" />
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-deep/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-navy">{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Event Title</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Date</label>
                  <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-navy">Image URL</label>
                <input type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-navy">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none">
                  <option value="Competition">Competition</option>
                  <option value="Summit">Summit</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Social">Social</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-navy">Description</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none" />
              </div>

              <div className="flex flex-wrap gap-6 pt-4 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={requiresRegistration} onChange={e => setRequiresRegistration(e.target.checked)} className="size-4 accent-[#F26522]" />
                  <span className="text-sm font-semibold text-navy">Requires Registration</span>
                </label>
                
                {requiresRegistration && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isRegistrationOpen} onChange={e => setIsRegistrationOpen(e.target.checked)} className="size-4 accent-[#F26522]" />
                      <span className="text-sm font-semibold text-navy">Registration Open</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={requiresPayment} onChange={e => setRequiresPayment(e.target.checked)} className="size-4 accent-[#F26522]" />
                      <span className="text-sm font-semibold text-navy">Requires Payment</span>
                    </label>
                  </>
                )}
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 transition-colors disabled:opacity-50">
                  {isSaving && <Loader2 className="size-4 animate-spin" />}
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
