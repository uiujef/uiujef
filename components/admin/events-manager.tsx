'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, Calendar, MapPin, Tag, Users, CheckCircle, Download } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { CloudinaryUploader } from '@/components/cloudinary-uploader'
import { exportToCsv } from '@/lib/export-csv'

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
  max_team_size: number
  registration_fee: number
  is_featured: boolean
  is_pinned: boolean
  pinned_at: string | null
  participation_type: string
  event_level: string
  registration_deadline: string | null
}

const CATEGORIES = ['Competition', 'Summit', 'Workshop', 'Seminar', 'Social', 'Other']

export function EventsManager() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [imageInputType, setImageInputType] = useState<'upload' | 'url'>('upload')
  const [externalImageUrl, setExternalImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Competition')
  const [image, setImage] = useState('')
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [requiresRegistration, setRequiresRegistration] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [maxTeamSize, setMaxTeamSize] = useState<number>(1)
  const [registrationFee, setRegistrationFee] = useState<number>(0)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [participationType, setParticipationType] = useState('Individual')
  const [eventLevel, setEventLevel] = useState('On Campus')
  const [registrationDeadline, setRegistrationDeadline] = useState('')
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false })
      if (error) throw error
      if (data) setEvents(data as Event[])
    } catch (err: any) {
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'Network error: Supabase could not be reached. Check your connection or ad-blocker.'
        : err.message
      toast.error('Database Error (Load Events): ' + errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event)
      setTitle(event.title)
      
      // Format date for datetime-local input
      let formattedDate = ''
      try {
        if (event.date) {
          const d = new Date(event.date)
          const pad = (n: number) => n.toString().padStart(2, '0')
          formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
      } catch (e) {
        console.error('Error parsing date', e)
      }
      setDate(formattedDate)
      setDescription(event.description || '')
      setCategory(event.category || 'Seminar')
      setImage(event.image || '')
      setRequiresPayment(event.requires_payment || false)
      setRequiresRegistration(event.requires_registration || false)
      setIsRegistrationOpen(event.is_registration_open || false)
      setMaxTeamSize(event.max_team_size || 1)
      setRegistrationFee(event.registration_fee || 0)
      setIsFeatured(event.is_featured || false)
      setIsPinned(event.is_pinned || false)
      setParticipationType(event.participation_type || 'Individual')
      setEventLevel(event.event_level || 'On Campus')

      let formattedDeadline = ''
      try {
        if (event.registration_deadline) {
          const d = new Date(event.registration_deadline)
          const pad = (n: number) => n.toString().padStart(2, '0')
          formattedDeadline = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
      } catch (e) {
        console.error('Error parsing deadline', e)
        formattedDeadline = event.registration_deadline || ''
      }
      setRegistrationDeadline(formattedDeadline)
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
      setMaxTeamSize(1)
      setRegistrationFee(0)
      setIsFeatured(false)
      setIsPinned(false)
      setParticipationType('Individual')
      setEventLevel('On Campus')
      setRegistrationDeadline('')
    }
    setImageFile(null)
    setExternalImageUrl('')
    setImageInputType('upload')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    let finalImageUrl = image

    try {
      if (imageInputType === 'url' && externalImageUrl) {
        finalImageUrl = externalImageUrl
      }

      const payload = {
        title,
        date: new Date(date).toISOString(), // Ensure proper ISO format for DB
        description,
        category,
        image: finalImageUrl,
        requires_payment: requiresPayment,
        requires_registration: requiresRegistration,
        is_registration_open: isRegistrationOpen,
        max_team_size: maxTeamSize,
        registration_fee: registrationFee,
        is_featured: isFeatured,
        is_pinned: isPinned,
        pinned_at: isPinned ? (editingEvent?.pinned_at || new Date().toISOString()) : null,
        participation_type: participationType,
        event_level: eventLevel,
        registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null
      }

      if (isFeatured) {
        // If this event is featured, un-feature all others first
        await supabase.from('events').update({ is_featured: false }).neq('id', editingEvent?.id || '00000000-0000-0000-0000-000000000000')
      }

      if (editingEvent) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingEvent.id)
        if (error) throw error
        toast.success('Event updated successfully!')
        setEvents(events.map(ev => {
          if (ev.id === editingEvent.id) return { ...ev, ...payload }
          return isFeatured ? { ...ev, is_featured: false } : ev
        }))
        setIsModalOpen(false)
      } else {
        const { data, error } = await supabase.from('events').insert([payload]).select().single()
        if (error) throw error
        if (data) {
          toast.success('Event created successfully!')
          setEvents([data as Event, ...events.map(ev => isFeatured ? { ...ev, is_featured: false } : ev)])
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      toast.error('Database Error (Save Event): ' + err.message)
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  const confirmDelete = (id: string) => {
    setEventToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventToDelete)
      if (error) throw error
      toast.success('Event deleted successfully.')
      setEvents(events.filter(ev => ev.id !== eventToDelete))
    } catch (err: any) {
      toast.error('Database Error (Delete Event): ' + err.message)
    } finally {
      setIsConfirmOpen(false)
      setEventToDelete(null)
    }
  }

  const exportEventApps = async (event: Event, approvedOnly: boolean) => {
    try {
      const toastId = toast.loading(`Exporting ${approvedOnly ? 'approved ' : ''}applications for ${event.title}...`)
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('event_id', event.id)
        .eq('type', 'Event')

      if (error) throw error

      let appsToExport = data || []
      if (approvedOnly) {
        appsToExport = appsToExport.filter(a => a.status === 'Approved')
      }

      if (appsToExport.length === 0) {
        toast.dismiss(toastId)
        toast.error('No applications found to export.')
        return
      }

      const columns = [
        { header: 'App ID', key: (r: any) => r.application_id },
        { header: 'Status', key: (r: any) => r.status },
        { header: 'Name', key: (r: any) => {
            if (!r.team_members || !r.team_members.length) return r.name || ''
            return r.team_members[0].name || r.name || ''
          }
        },
        { header: 'Email', key: (r: any) => {
            if (!r.team_members || !r.team_members.length) return r.email || ''
            return r.team_members[0].email || r.email || ''
          }
        },
        { header: 'Phone', key: (r: any) => {
            if (!r.team_members || !r.team_members.length) return r.phone || ''
            return r.team_members[0].phone || ''
          }
        },
        { header: 'University', key: (r: any) => {
            if (!r.team_members || !r.team_members.length) return r.university || ''
            return r.team_members[0].university || ''
          }
        },
        { header: 'Student ID', key: (r: any) => {
            if (!r.team_members || !r.team_members.length) return r.student_id || ''
            return r.team_members[0].student_id || ''
          }
        },
        { header: 'Address', key: (r: any) => {
            if (!r.team_members || !r.team_members.length) return r.address || ''
            return r.team_members[0].address || ''
          }
        },
        { header: 'TrxID', key: (r: any) => r.transaction_id || '' },
      ]

      exportToCsv(`${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Applications_${approvedOnly ? 'Approved' : 'All'}`, appsToExport, columns)
      toast.dismiss(toastId)
      toast.success('Export successful!')
    } catch (err: any) {
      toast.error('Export failed: ' + err.message)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-navy tracking-tight">Manage Events</h2>
          <p className="text-muted-foreground mt-1">Plan, create, and oversee UIUJEF events.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 bg-[#F26522] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#F26522]/20 hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="size-5" />
          Create New Event
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-navy">Loading events timeline...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl border border-border p-12 text-center shadow-sm">
          <div className="mx-auto size-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 transform -rotate-3">
            <Calendar className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-navy mb-3">No Events Scheduled</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">It looks like the events calendar is empty. Click the button above to schedule a new event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventDate = new Date(event.date)
            const isPast = eventDate < new Date()
            
            return (
              <div key={event.id} className={`bg-white rounded-2xl border ${isPast ? 'border-border/50 opacity-80' : 'border-border'} shadow-sm overflow-hidden hover:shadow-lg transition-all group relative flex flex-col`}>
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => openModal(event)} className="p-2 bg-white/90 backdrop-blur text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg shadow-sm transition-colors" title="Edit">
                    <Edit2 className="size-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); confirmDelete(event.id); }} className="p-2 bg-white/90 backdrop-blur text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg shadow-sm transition-colors" title="Delete">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                
                <div className="h-48 relative overflow-hidden bg-secondary">
                  {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 bg-secondary">
                      <Calendar className="size-12 mb-2 opacity-50" />
                      <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider">
                      {event.category}
                    </span>
                    {event.is_pinned && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider">
                        Pinned
                      </span>
                    )}
                    {event.requires_payment && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F26522]/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider">
                        Paid
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-sm text-[#F26522] font-bold mb-3">
                    <Calendar className="size-4" />
                    <span>{eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-navy">{eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-navy mb-2 line-clamp-2">{event.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">{event.description || 'No description provided.'}</p>
                  
                  <div className="pt-4 border-t border-border flex flex-col gap-3 mt-auto">
                    <div className="flex items-center justify-between">
                      {event.requires_registration ? (
                        event.is_registration_open ? (
                          <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-green-500/10 px-3 py-1.5 rounded-full">
                            <CheckCircle className="size-3.5" />
                            Registration Open
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs bg-secondary px-3 py-1.5 rounded-full">
                            <Users className="size-3.5" />
                            Registration Closed
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs bg-blue-500/10 px-3 py-1.5 rounded-full">
                          <Users className="size-3.5" />
                          Open to All
                        </div>
                      )}
                      
                      {isPast && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Past Event</span>
                      )}
                    </div>
                    {event.requires_registration && (
                      <div className="flex items-center gap-2 border-t border-border/50 pt-3 mt-1">
                        <button onClick={(e) => { e.stopPropagation(); exportEventApps(event, false); }} className="flex-1 text-center py-1.5 text-[10px] font-bold uppercase tracking-wider bg-secondary text-navy rounded-lg hover:bg-secondary/80 transition-colors">
                          Export All
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); exportEventApps(event, true); }} className="flex-1 text-center py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#F26522]/10 text-[#F26522] rounded-lg hover:bg-[#F26522]/20 transition-colors">
                          Export Approved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:px-8 sm:py-6 border-b border-border flex items-center justify-between bg-transparent z-10 shrink-0">
              <h3 className="text-2xl font-bold text-navy tracking-tight">{editingEvent ? 'Edit Event Details' : 'Create New Event'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Event Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Event Title *</label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Code Samurai 2024" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Event Date & Time *</label>
                    <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                  </div>

                </div>
              </div>

              {/* Classification & Display */}
              <div>
                <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Classification & Display</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Event Category *</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none bg-white transition-all">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  
                  <div className="flex flex-col gap-4 mt-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="peer sr-only" />
                        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-navy group-hover:text-[#F26522] transition-colors">Feature on Home Page</span>
                        <p className="text-xs text-muted-foreground">Only one event can be featured.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="peer sr-only" />
                        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-navy group-hover:text-yellow-600 transition-colors">Pin to Top</span>
                        <p className="text-xs text-muted-foreground">Always show this event at the top of the archive.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Content</h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Description / Details</label>
                    <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this event about?" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none resize-none transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Cover Image *</label>
                    <div className="flex bg-secondary/50 p-1 rounded-xl w-fit mb-4 border border-border">
                      <button type="button" onClick={() => setImageInputType('upload')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${imageInputType === 'upload' ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>Upload File</button>
                      <button type="button" onClick={() => setImageInputType('url')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${imageInputType === 'url' ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>Paste URL</button>
                    </div>
                    {imageInputType === 'upload' ? (
                      <div className="w-full">
                        <CloudinaryUploader 
                          onUploadSuccess={(url) => { setImage(url); setIsUploading(false); }}
                          onUploadStart={() => setIsUploading(true)}
                          onUploadError={() => setIsUploading(false)}
                          folder="/uiujef/events"
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <input type="url" value={externalImageUrl} onChange={e => setExternalImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all font-mono text-sm" />
                    )}

                    {/* Preview logic */}
                    {(imageInputType === 'upload' && image) ? (
                      <div className="mt-4 aspect-video relative rounded-xl overflow-hidden border border-border bg-secondary/50">
                        <img src={image} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    ) : (imageInputType === 'url' && externalImageUrl) ? (
                      <div className="mt-4 aspect-video relative rounded-xl overflow-hidden border border-border bg-secondary/50">
                        <img src={externalImageUrl} alt="Preview" className="object-cover w-full h-full" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL')} />
                      </div>
                    ) : (image && !imageFile && !externalImageUrl) ? (
                      <div className="mt-3 flex items-center gap-3 bg-secondary/50 p-2 rounded-xl border border-border w-max">
                        <img src={image} alt="Current" className="w-16 h-10 rounded-lg object-cover" />
                        <a href={image} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline pr-4">View Current Cover</a>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Registration Settings</h4>
                <div className="bg-secondary/50 rounded-2xl p-6 border border-border space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={requiresRegistration} onChange={e => setRequiresRegistration(e.target.checked)} className="peer sr-only" />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-navy group-hover:text-[#F26522] transition-colors">Requires Registration</span>
                      <p className="text-xs text-muted-foreground">Attendees must sign up to join.</p>
                    </div>
                  </label>
                  
                  {requiresRegistration && (
                    <div className="pl-14 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2 max-w-[300px]">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Registration Deadline *</label>
                        <input required type="datetime-local" value={registrationDeadline} onChange={e => setRegistrationDeadline(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" checked={isRegistrationOpen} onChange={e => setIsRegistrationOpen(e.target.checked)} className="peer sr-only" />
                          <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-navy group-hover:text-green-600 transition-colors">Registration Open</span>
                          <p className="text-xs text-muted-foreground">Allow people to register now.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" checked={requiresPayment} onChange={e => setRequiresPayment(e.target.checked)} className="peer sr-only" />
                          <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-navy group-hover:text-[#F26522] transition-colors">Requires Payment</span>
                          <p className="text-xs text-muted-foreground">This is a paid event.</p>
                        </div>
                      </label>
                      
                      {requiresPayment && (
                        <div className="pl-14">
                          <div className="space-y-2 max-w-[200px]">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Registration Fee (BDT)</label>
                            <input type="number" min="0" value={registrationFee} onChange={e => setRegistrationFee(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                          </div>
                        </div>
                      )}

                      <div className="pt-2 space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Participation Type</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="participation_type" value="Individual" checked={participationType === 'Individual'} onChange={e => setParticipationType(e.target.value)} className="w-4 h-4 text-[#F26522] focus:ring-[#F26522]" />
                              <span className="text-sm font-medium text-navy">Individual</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="participation_type" value="Team" checked={participationType === 'Team'} onChange={e => setParticipationType(e.target.value)} className="w-4 h-4 text-[#F26522] focus:ring-[#F26522]" />
                              <span className="text-sm font-medium text-navy">Team</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2 max-w-[200px]">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Max Team Members</label>
                          <input type="number" min="1" max="10" value={maxTeamSize} onChange={e => setMaxTeamSize(Number(e.target.value))} disabled={participationType === 'Individual'} className="w-full px-4 py-2 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all disabled:opacity-50 disabled:bg-secondary" />
                          <p className="text-xs text-muted-foreground">Applies if Team.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Event Level</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="event_level" value="On Campus" checked={eventLevel === 'On Campus'} onChange={e => setEventLevel(e.target.value)} className="w-4 h-4 text-[#F26522] focus:ring-[#F26522]" />
                              <span className="text-sm font-medium text-navy">On Campus</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="event_level" value="National" checked={eventLevel === 'National'} onChange={e => setEventLevel(e.target.value)} className="w-4 h-4 text-[#F26522] focus:ring-[#F26522]" />
                              <span className="text-sm font-medium text-navy">National</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-6 flex justify-end gap-3 border-t border-border sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUploading} className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100">
                  {(isSaving || isUploading) && <Loader2 className="size-5 animate-spin" />}
                  {isUploading ? 'Uploading Image...' : isSaving ? 'Saving Event...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false)
          setEventToDelete(null)
        }}
      />
    </div>
  )
}
