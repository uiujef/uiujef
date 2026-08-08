'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, Save, X, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/confirm-modal'

type WhyJoinItem = {
  id: string
  title: string
  description: string
  icon: string
  image_url: string
}

export function WhyJoinManager() {
  const [items, setItems] = useState<WhyJoinItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  // Form state
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const loadItems = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('why_join_content').select('*').order('created_at', { ascending: true })
      if (error) throw error
      if (data) setItems(data)
    } catch (err: any) {
      toast.error('Failed to load Why Join content: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const resetForm = () => {
    setEditId(null)
    setTitle('')
    setDescription('')
    setIcon('')
    setImageUrl('')
    setImageFile(null)
    setIsModalOpen(false)
  }

  const openEdit = (item: WhyJoinItem) => {
    setEditId(item.id)
    setTitle(item.title)
    setDescription(item.description || '')
    setIcon(item.icon || '')
    setImageUrl(item.image_url || '')
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let finalImageUrl = imageUrl

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const filename = `whyjoin_${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage.from('jef-images').upload(`whyjoin/${filename}`, imageFile)
        
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('jef-images').getPublicUrl(uploadData.path)
        finalImageUrl = publicUrl
      }

      const payload = {
        title,
        description,
        icon,
        image_url: finalImageUrl
      }

      if (editId) {
        const { error } = await supabase.from('why_join_content').update(payload).eq('id', editId)
        if (error) throw error
        toast.success('Content updated successfully!')
      } else {
        const { error } = await supabase.from('why_join_content').insert([payload])
        if (error) throw error
        toast.success('Content added successfully!')
      }

      loadItems()
      resetForm()
    } catch (err: any) {
      toast.error('Error saving content: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = (id: string) => {
    setItemToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      const { error } = await supabase.from('why_join_content').delete().eq('id', itemToDelete)
      if (error) throw error
      toast.success('Item deleted successfully!')
      loadItems()
    } catch (err: any) {
      toast.error('Failed to delete item: ' + err.message)
    } finally {
      setIsConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
        <p className="text-lg font-semibold text-navy">Loading content...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-navy tracking-tight">"Why Join" Content</h2>
          <p className="text-muted-foreground mt-1">Manage the sections explaining the benefits of joining UIUJEF.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 bg-[#F26522] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#F26522]/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#F26522]/20">
          <Plus className="size-5" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            {item.image_url && (
              <div className="aspect-video w-full relative bg-secondary overflow-hidden">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-navy mb-2">{item.icon} {item.title}</h3>
              <p className="text-sm text-muted-foreground flex-1 line-clamp-3 mb-4">{item.description}</p>
              
              <div className="flex gap-2 justify-end mt-auto pt-4 border-t border-border">
                <button onClick={() => openEdit(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => confirmDelete(item.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-border">
            <p className="text-muted-foreground">No content items found. Add some to display on the "Why Join" section!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
              <h3 className="text-xl font-bold text-navy flex items-center gap-2">
                {editId ? <Pencil className="size-5 text-[#F26522]" /> : <Plus className="size-5 text-[#F26522]" />}
                {editId ? 'Edit Content' : 'Add Content'}
              </h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-navy transition-colors bg-white p-2 rounded-xl border border-border shadow-sm hover:shadow-md">
                <X className="size-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Title *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Description *</label>
                <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all resize-none" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Icon (Emoji or short text)</label>
                <input type="text" value={icon} onChange={e => setIcon(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) setImageFile(e.target.files[0])
                  }} 
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none file:mr-4 file:py-2 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#F26522]/10 file:text-[#F26522] hover:file:bg-[#F26522]/20 cursor-pointer transition-all" 
                />
                {imageUrl && !imageFile && (
                  <div className="mt-3 flex items-center gap-3 bg-secondary/50 p-2 rounded-xl border border-border w-max">
                    <img src={imageUrl} alt="Current" className="w-16 h-10 rounded-lg object-cover" />
                    <a href={imageUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline pr-4">View Current Image</a>
                  </div>
                )}
              </div>
            </form>

            <div className="p-6 border-t border-border bg-secondary/30 flex justify-end gap-3 mt-auto">
              <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl font-bold text-navy hover:bg-black/5 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 bg-[#F26522] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#F26522]/90 transition-all shadow-lg shadow-[#F26522]/20 disabled:opacity-50">
                {isSaving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                {isSaving ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Content"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false)
          setItemToDelete(null)
        }}
      />
    </div>
  )
}
