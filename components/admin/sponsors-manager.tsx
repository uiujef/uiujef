'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { toast } from 'sonner'

type Sponsor = {
  id: string
  name: string
  logo_url: string
  website_url: string
  tier: string
}

const TIERS = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Media Partner']

export function SponsorsManager() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [sponsorToDelete, setSponsorToDelete] = useState<string | null>(null)

  // Form state
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [tier, setTier] = useState(TIERS[0])
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const loadSponsors = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false })
      if (error) throw error
      if (data) setSponsors(data)
    } catch (err: any) {
      toast.error('Failed to load sponsors: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSponsors()
  }, [])

  const resetForm = () => {
    setEditId(null)
    setName('')
    setWebsiteUrl('')
    setTier(TIERS[0])
    setLogoUrl('')
    setLogoFile(null)
    setIsModalOpen(false)
  }

  const openEdit = (sponsor: Sponsor) => {
    setEditId(sponsor.id)
    setName(sponsor.name)
    setWebsiteUrl(sponsor.website_url || '')
    setTier(sponsor.tier || TIERS[0])
    setLogoUrl(sponsor.logo_url || '')
    setLogoFile(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let finalLogoUrl = logoUrl

      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const filename = `sponsor_${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage.from('jef-images').upload(`sponsors/${filename}`, logoFile)
        
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('jef-images').getPublicUrl(uploadData.path)
        finalLogoUrl = publicUrl
      }

      const payload = {
        name,
        website_url: websiteUrl,
        tier,
        logo_url: finalLogoUrl
      }

      if (editId) {
        const { error } = await supabase.from('sponsors').update(payload).eq('id', editId)
        if (error) throw error
        toast.success('Sponsor updated successfully!')
      } else {
        const { error } = await supabase.from('sponsors').insert([payload])
        if (error) throw error
        toast.success('Sponsor added successfully!')
      }

      loadSponsors()
      resetForm()
    } catch (err: any) {
      toast.error('Error saving sponsor: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = (id: string) => {
    setSponsorToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!sponsorToDelete) return

    try {
      const { error } = await supabase.from('sponsors').delete().eq('id', sponsorToDelete)
      if (error) throw error
      toast.success('Sponsor deleted successfully!')
      loadSponsors()
    } catch (err: any) {
      toast.error('Failed to delete sponsor: ' + err.message)
    } finally {
      setIsConfirmOpen(false)
      setSponsorToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
        <p className="text-lg font-semibold text-navy">Loading sponsors...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-navy tracking-tight">Sponsors & Partners</h2>
          <p className="text-muted-foreground mt-1">Manage the logos displayed in the global footer.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 bg-[#F26522] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#F26522]/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#F26522]/20">
          <Plus className="size-5" />
          Add Sponsor
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sponsors.map(sponsor => (
          <div key={sponsor.id} className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center text-center">
            <div className="w-full aspect-[3/2] relative bg-secondary/30 p-6 flex items-center justify-center">
              {sponsor.logo_url ? (
                <img src={sponsor.logo_url} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-muted-foreground text-sm">No Logo</span>
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col w-full border-t border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F26522] mb-1">{sponsor.tier}</span>
              <h3 className="text-sm font-bold text-navy line-clamp-1">{sponsor.name}</h3>
              {sponsor.website_url && (
                <a href={sponsor.website_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 line-clamp-1">Website</a>
              )}
              
              <div className="flex gap-2 justify-center mt-4 pt-4 border-t border-border w-full">
                <button onClick={() => openEdit(sponsor)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-1 flex justify-center">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => confirmDelete(sponsor.id)} className="p-2 bg-white/90 backdrop-blur text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg shadow-sm transition-colors" title="Delete">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {sponsors.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-border">
            <p className="text-muted-foreground">No sponsors found. Add some to display in the footer!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
              <h3 className="text-xl font-bold text-navy flex items-center gap-2">
                {editId ? <Pencil className="size-5 text-[#F26522]" /> : <Plus className="size-5 text-[#F26522]" />}
                {editId ? 'Edit Sponsor' : 'Add Sponsor'}
              </h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-navy transition-colors bg-white p-2 rounded-xl border border-border shadow-sm hover:shadow-md">
                <X className="size-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Website URL</label>
                <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Tier *</label>
                <select value={tier} onChange={e => setTier(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none bg-white transition-all">
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Logo Image *</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) setLogoFile(e.target.files[0])
                  }} 
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none file:mr-4 file:py-2 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#F26522]/10 file:text-[#F26522] hover:file:bg-[#F26522]/20 cursor-pointer transition-all" 
                />
                {logoUrl && !logoFile && (
                  <div className="mt-3 flex items-center gap-3 bg-secondary/50 p-2 rounded-xl border border-border w-max">
                    <img src={logoUrl} alt="Current" className="w-16 h-10 rounded-lg object-contain bg-white" />
                    <a href={logoUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline pr-4">View Current Logo</a>
                  </div>
                )}
              </div>
            </form>

            <div className="p-6 border-t border-border bg-secondary/30 flex justify-end gap-3 mt-auto">
              <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl font-bold text-navy hover:bg-black/5 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving || (!logoUrl && !logoFile)} className="flex items-center justify-center gap-2 bg-[#F26522] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#F26522]/90 transition-all shadow-lg shadow-[#F26522]/20 disabled:opacity-50">
                {isSaving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                {isSaving ? 'Saving...' : 'Save Sponsor'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Sponsor"
        message="Are you sure you want to delete this sponsor? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false)
          setSponsorToDelete(null)
        }}
      />
    </div>
  )
}
