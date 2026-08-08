'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type GalleryImage = {
  id: string
  title: string
  image_url: string
  created_at: string
  is_pinned: boolean
  pinned_at: string | null
}

export function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [title, setTitle] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isPinned, setIsPinned] = useState(false)

  const loadImages = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
      if (error) throw error
      if (data) setImages(data as GalleryImage[])
    } catch (err: any) {
      toast.error('Database Error (Load Gallery): ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) {
      toast.error('Please select an image first.')
      return
    }

    setIsUploading(true)
    try {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('jef-images')
        .upload(`gallery/${fileName}`, imageFile)

      if (uploadError) throw new Error('Image Upload Failed: ' + uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('jef-images')
        .getPublicUrl(`gallery/${fileName}`)

      const { data, error } = await supabase.from('gallery').insert([{
        title,
        image_url: publicUrl,
        is_pinned: isPinned,
        pinned_at: isPinned ? new Date().toISOString() : null
      }]).select().single()

      if (error) throw error
      
      toast.success('Image uploaded to gallery successfully!')
      setImages([data as GalleryImage, ...images])
      setIsModalOpen(false)
      setTitle('')
      setImageFile(null)
      setIsPinned(false)
    } catch (err: any) {
      toast.error('Upload Error: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm('Are you sure you want to delete this image from the gallery?')) return

    try {
      const filePath = image.image_url.split('/jef-images/')[1]
      if (filePath) {
        await supabase.storage.from('jef-images').remove([filePath])
      }

      const { error } = await supabase.from('gallery').delete().eq('id', image.id)
      if (error) throw error
      
      toast.success('Image deleted successfully.')
      setImages(images.filter(img => img.id !== image.id))
    } catch (err: any) {
      toast.error('Database Error (Delete Image): ' + err.message)
    }
  }
  const togglePin = async (image: GalleryImage) => {
    try {
      const newPinnedState = !image.is_pinned
      const payload = {
        is_pinned: newPinnedState,
        pinned_at: newPinnedState ? new Date().toISOString() : null
      }
      
      const { error } = await supabase.from('gallery').update(payload).eq('id', image.id)
      if (error) throw error
      
      setImages(images.map(img => img.id === image.id ? { ...img, ...payload } : img))
      toast.success(newPinnedState ? 'Image pinned to top!' : 'Image unpinned.')
    } catch (err: any) {
      toast.error('Failed to update pin status: ' + err.message)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-navy tracking-tight">Gallery Manager</h2>
          <p className="text-muted-foreground mt-1">Upload and manage images for the UIUJEF gallery.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-[#F26522] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#F26522]/20 hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="size-5" />
          Upload Image
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-navy">Loading gallery...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-3xl border border-border p-12 text-center shadow-sm">
          <div className="mx-auto size-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 transform rotate-3">
            <ImageIcon className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-navy mb-3">Gallery is Empty</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Upload some images to showcase the beautiful moments of UIUJEF.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map(image => (
            <div key={image.id} className="relative group break-inside-avoid rounded-2xl overflow-hidden bg-secondary shadow-sm hover:shadow-xl transition-all">
              <img src={image.image_url} alt={image.title} className="w-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute top-2 left-2 flex gap-2">
                {image.is_pinned && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-500/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider">
                    Pinned
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <h4 className="text-white font-bold text-lg leading-tight mb-2">{image.title}</h4>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => togglePin(image)} className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${image.is_pinned ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-white/20 text-white hover:bg-white/40'}`} title={image.is_pinned ? "Unpin" : "Pin to Top"}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(image)} className="bg-red-600/90 text-white p-2 rounded-lg hover:bg-red-600 backdrop-blur-sm transition-colors" title="Delete">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-transparent">
              <h3 className="text-2xl font-bold text-navy tracking-tight">Upload New Image</h3>
              <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Image Title / Description *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Code Samurai 2024 Winners" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Select Image *</label>
                <div className="relative border-2 border-dashed border-border rounded-2xl p-8 hover:border-[#F26522] hover:bg-[#F26522]/5 transition-all text-center group cursor-pointer overflow-hidden">
                  <input required type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) setImageFile(file)
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="relative z-0">
                    <ImageIcon className="size-10 text-muted-foreground mx-auto mb-3 group-hover:text-[#F26522] transition-colors" />
                    {imageFile ? (
                      <p className="text-sm font-bold text-[#F26522] truncate px-4">{imageFile.name}</p>
                    ) : (
                      <p className="text-sm font-medium text-muted-foreground">Drag and drop or click to browse</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="peer sr-only" />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-navy group-hover:text-yellow-600 transition-colors">Pin to Top</span>
                    <p className="text-xs text-muted-foreground">Always show this image at the top of the gallery.</p>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isUploading || !imageFile} className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100">
                  {isUploading && <Loader2 className="size-5 animate-spin" />}
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
