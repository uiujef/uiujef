'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Loader2, Image as ImageIcon, Folder, FolderOpen, ChevronRight, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/confirm-modal'

type GalleryCategory = {
  id: string
  name: string
  created_at: string
}

type GalleryAlbum = {
  id: string
  category_id: string
  title: string
  event_date: string | null
  description: string | null
  cover_image: string
  created_at: string
}

type GalleryImage = {
  id: string
  album_id: string
  caption: string | null
  image_url: string
  created_at: string
}

export function GalleryManager() {
  const [categories, setCategories] = useState<GalleryCategory[]>([])
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [images, setImages] = useState<GalleryImage[]>([])

  const [currentCategory, setCurrentCategory] = useState<GalleryCategory | null>(null)
  const [currentAlbum, setCurrentAlbum] = useState<GalleryAlbum | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [modalType, setModalType] = useState<'category' | 'album' | 'image' | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{type: 'category'|'album'|'image', id: string} | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [albumDate, setAlbumDate] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageInputType, setImageInputType] = useState<'upload' | 'url'>('upload')
  const [externalImageUrl, setExternalImageUrl] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    loadData()
  }, [currentCategory, currentAlbum])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (!currentCategory) {
        // Load Categories
        const { data, error } = await supabase.from('gallery_categories').select('*').order('created_at', { ascending: false })
        if (error) throw error
        setCategories(data as GalleryCategory[])
      } else if (!currentAlbum) {
        // Load Albums for Category
        const { data, error } = await supabase.from('gallery_albums').select('*').eq('category_id', currentCategory.id).order('created_at', { ascending: false })
        if (error) throw error
        setAlbums(data as GalleryAlbum[])
      } else {
        // Load Images for Album
        const { data, error } = await supabase.from('gallery_images').select('*').eq('album_id', currentAlbum.id).order('created_at', { ascending: false })
        if (error) throw error
        setImages(data as GalleryImage[])
      }
    } catch (err: any) {
      toast.error('Database Error: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (type: 'category' | 'album' | 'image', item?: any) => {
    setModalType(type)
    setEditingItem(item || null)
    setImageInputType('upload')
    setExternalImageUrl('')
    setSelectedFiles([])
    
    if (item) {
      setTitle(item.title || item.name || item.caption || '')
      if (type === 'album') {
        setAlbumDate(item.event_date || '')
        setDescription(item.description || '')
        setCoverImage(item.cover_image || '')
      }
      if (type === 'image') {
        setImageUrls(item.image_url ? [item.image_url] : [])
      }
    } else {
      setTitle('')
      setAlbumDate('')
      setDescription('')
      setCoverImage('')
      setImageUrls([])
    }
  }

  const uploadToCloudinary = async (file: File, folder: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'uiujef_preset')
    formData.append('folder', folder)

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'k6fxncwo'
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    })
    
    if (!res.ok) throw new Error('Failed to upload image')
    const data = await res.json()
    return data.secure_url
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSaving(true)
    setIsUploading(true)
    
    try {
      if (modalType === 'category') {
        const payload = { name: title }
        if (editingItem) {
          const { error } = await supabase.from('gallery_categories').update(payload).eq('id', editingItem.id)
          if (error) throw error
          setCategories(categories.map(c => c.id === editingItem.id ? { ...c, ...payload } : c))
          toast.success('Category updated')
        } else {
          const { data, error } = await supabase.from('gallery_categories').insert([payload]).select().single()
          if (error) throw error
          setCategories([data as GalleryCategory, ...categories])
          toast.success('Category created')
        }
      } 
      else if (modalType === 'album') {
        if (!currentCategory) throw new Error('No category selected')
        
        let finalImage = coverImage
        if (imageInputType === 'url' && externalImageUrl) {
          finalImage = externalImageUrl
        } else if (imageInputType === 'upload' && selectedFiles.length > 0) {
          finalImage = await uploadToCloudinary(selectedFiles[0], '/uiujef/gallery/covers')
        }
        
        if (!finalImage) throw new Error('Cover image is required')

        const payload = { category_id: currentCategory.id, title, event_date: albumDate || null, description: description || null, cover_image: finalImage }
        if (editingItem) {
          const { error } = await supabase.from('gallery_albums').update(payload).eq('id', editingItem.id)
          if (error) throw error
          setAlbums(albums.map(a => a.id === editingItem.id ? { ...a, ...payload } : a))
          toast.success('Album updated')
        } else {
          const { data, error } = await supabase.from('gallery_albums').insert([payload]).select().single()
          if (error) throw error
          setAlbums([data as GalleryAlbum, ...albums])
          toast.success('Album created')
        }
      }
      else if (modalType === 'image') {
        if (!currentAlbum) throw new Error('No album selected')
        
        let urlsToSave = imageUrls
        if (imageInputType === 'url' && externalImageUrl) {
          urlsToSave = [externalImageUrl]
        } else if (imageInputType === 'upload' && selectedFiles.length > 0) {
          const folder = `/uiujef/gallery/albums/${currentAlbum.id}`
          const uploadPromises = selectedFiles.map(file => uploadToCloudinary(file, folder))
          const newUrls = await Promise.all(uploadPromises)
          urlsToSave = editingItem ? [newUrls[0]] : newUrls
        }
        
        if (urlsToSave.length === 0) throw new Error('Image is required')

        if (editingItem) {
          const payload = { album_id: currentAlbum.id, caption: title || null, image_url: urlsToSave[0] }
          const { error } = await supabase.from('gallery_images').update(payload).eq('id', editingItem.id)
          if (error) throw error
          setImages(images.map(i => i.id === editingItem.id ? { ...i, ...payload } : i))
          toast.success('Image updated')
        } else {
          const payloads = urlsToSave.map(url => ({ album_id: currentAlbum.id, caption: title || null, image_url: url }))
          const { data, error } = await supabase.from('gallery_images').insert(payloads).select()
          if (error) throw error
          setImages([...(data as GalleryImage[]), ...images])
          toast.success('Images added')
        }
      }

      setModalType(null)
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsSaving(true)
    try {
      const table = itemToDelete.type === 'category' ? 'gallery_categories' : itemToDelete.type === 'album' ? 'gallery_albums' : 'gallery_images'
      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id)
      if (error) throw error

      if (itemToDelete.type === 'category') setCategories(categories.filter(c => c.id !== itemToDelete.id))
      else if (itemToDelete.type === 'album') setAlbums(albums.filter(a => a.id !== itemToDelete.id))
      else if (itemToDelete.type === 'image') setImages(images.filter(i => i.id !== itemToDelete.id))

      toast.success('Deleted successfully.')
    } catch (err: any) {
      toast.error('Delete Error: ' + err.message)
    } finally {
      setIsSaving(false)
      setIsConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-navy tracking-tight">Gallery Manager</h2>
          <div className="flex items-center text-sm font-semibold text-muted-foreground mt-2 overflow-x-auto pb-2 sm:pb-0">
            <button onClick={() => { setCurrentCategory(null); setCurrentAlbum(null) }} className={`hover:text-[#F26522] transition-colors whitespace-nowrap ${!currentCategory ? 'text-navy' : ''}`}>
              Categories
            </button>
            {currentCategory && (
              <>
                <ChevronRight className="size-4 mx-2 text-border shrink-0" />
                <button onClick={() => setCurrentAlbum(null)} className={`hover:text-[#F26522] transition-colors whitespace-nowrap ${!currentAlbum ? 'text-navy' : ''}`}>
                  {currentCategory.name}
                </button>
              </>
            )}
            {currentAlbum && (
              <>
                <ChevronRight className="size-4 mx-2 text-border shrink-0" />
                <span className="text-navy truncate max-w-[200px] whitespace-nowrap">{currentAlbum.title}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {(currentCategory || currentAlbum) && (
            <button onClick={() => { if (currentAlbum) setCurrentAlbum(null); else setCurrentCategory(null) }} className="flex items-center gap-2 bg-secondary text-navy px-4 py-2 rounded-xl font-bold hover:bg-secondary/80 transition-all">
              <ArrowLeft className="size-4" />
              Back
            </button>
          )}
          <button onClick={() => openModal(!currentCategory ? 'category' : !currentAlbum ? 'album' : 'image')} className="flex items-center gap-2 bg-[#F26522] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#F26522]/20 hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="size-5" />
            {!currentCategory ? 'New Category' : !currentAlbum ? 'New Album' : 'Add Image'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-navy">Loading gallery...</p>
        </div>
      ) : !currentCategory ? (
        /* LEVEL 1: CATEGORIES */
        categories.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border p-12 text-center shadow-sm">
            <Folder className="size-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-navy mb-2">No Categories</h3>
            <p className="text-muted-foreground">Create a main category to organize your albums.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all group flex flex-col cursor-pointer" onClick={() => setCurrentCategory(cat)}>
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                  <div className="size-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FolderOpen className="size-8 text-[#F26522]" />
                  </div>
                  <h3 className="text-lg font-bold text-navy">{cat.name}</h3>
                </div>
                <div className="p-4 border-t border-border flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openModal('category', cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                    <Edit2 className="size-4" />
                  </button>
                  <button onClick={() => { setItemToDelete({type: 'category', id: cat.id}); setIsConfirmOpen(true) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : !currentAlbum ? (
        /* LEVEL 2: ALBUMS */
        albums.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border p-12 text-center shadow-sm">
            <ImageIcon className="size-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-navy mb-2">No Albums</h3>
            <p className="text-muted-foreground">Create an album inside this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map(album => (
              <div key={album.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all group overflow-hidden cursor-pointer flex flex-col" onClick={() => setCurrentAlbum(album)}>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                  <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold px-4 py-2 bg-white/20 backdrop-blur rounded-xl">View Album</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-navy leading-tight line-clamp-2">{album.title}</h3>
                  {album.event_date && <p className="text-sm font-semibold text-muted-foreground mt-1">{new Date(album.event_date).toLocaleDateString()}</p>}
                </div>
                <div className="px-4 py-3 border-t border-border flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openModal('album', album)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                    <Edit2 className="size-4" />
                  </button>
                  <button onClick={() => { setItemToDelete({type: 'album', id: album.id}); setIsConfirmOpen(true) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* LEVEL 3: IMAGES */
        images.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border p-12 text-center shadow-sm">
            <ImageIcon className="size-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-navy mb-2">No Images</h3>
            <p className="text-muted-foreground">Upload images to this album.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {images.map(image => (
              <div key={image.id} className="relative group break-inside-avoid rounded-2xl overflow-hidden bg-secondary shadow-sm hover:shadow-xl transition-all">
                <img src={image.image_url} alt={image.caption || 'Gallery image'} className="w-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  {image.caption && <h4 className="text-white font-bold text-sm leading-tight mb-2">{image.caption}</h4>}
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => openModal('image', image)} className="p-2 bg-white/90 backdrop-blur text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg shadow-sm transition-colors" title="Edit">
                      <Edit2 className="size-4" />
                    </button>
                    <button onClick={() => { setItemToDelete({type: 'image', id: image.id}); setIsConfirmOpen(true) }} className="p-2 bg-white/90 backdrop-blur text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg shadow-sm transition-colors" title="Delete">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Dynamic Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-md" onClick={() => !isUploading && setModalType(null)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-transparent shrink-0">
              <h3 className="text-2xl font-bold text-navy tracking-tight">
                {editingItem ? 'Edit' : 'Create'} {modalType === 'category' ? 'Category' : modalType === 'album' ? 'Album' : 'Image'}
              </h3>
              <button disabled={isUploading} onClick={() => setModalType(null)} className="size-10 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-colors disabled:opacity-50">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[65vh]">
              
              {/* Common Title Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">{modalType === 'image' ? 'Image Caption (Optional)' : 'Title *'}</label>
                <input required={modalType !== 'image'} type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
              </div>

              {/* Album Specific Fields */}
              {modalType === 'album' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Description (Optional)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter a short description..." rows={3} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Date (Optional)</label>
                    <input type="date" value={albumDate} onChange={e => setAlbumDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                  </div>
                </>
              )}

              {/* ImageKit Uploader for Album Cover OR Image */}
              {(modalType === 'album' || modalType === 'image') && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">{modalType === 'album' ? 'Cover Image *' : 'Image File *'}</label>
                  <div className="flex bg-secondary/50 p-1 rounded-xl w-fit mb-4 border border-border">
                    <button type="button" onClick={() => setImageInputType('upload')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${imageInputType === 'upload' ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>Upload File</button>
                    <button type="button" onClick={() => setImageInputType('url')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${imageInputType === 'url' ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>Paste URL</button>
                  </div>

                  {imageInputType === 'upload' ? (
                    <div className="w-full space-y-4">
                      <div className="relative border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-secondary/50 transition-colors">
                        <input
                          type="file"
                          multiple={modalType === 'image'}
                          accept={modalType === 'image' ? "image/*,video/*" : "image/*"}
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files)
                              if (modalType === 'album') {
                                setSelectedFiles(files.slice(0, 1))
                              } else {
                                setSelectedFiles((prev) => [...prev, ...files])
                              }
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                          <Plus className="size-8 text-muted-foreground" />
                          <p className="text-sm font-semibold text-navy">Click or drag {modalType === 'image' ? 'files' : 'a file'} here to upload</p>
                        </div>
                      </div>

                      {/* Local Preview Grid */}
                      {selectedFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          {selectedFiles.map((file, i) => (
                            <div key={i} className="group aspect-video relative rounded-xl overflow-hidden border border-border bg-secondary/50">
                              {file.type.startsWith('video/') ? (
                                <video src={URL.createObjectURL(file)} className="object-cover w-full h-full" />
                              ) : (
                                <img src={URL.createObjectURL(file)} alt="Preview" className="object-cover w-full h-full" />
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedFiles(files => files.filter((_, index) => index !== i))}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Existing Edited Preview */}
                      {selectedFiles.length === 0 && editingItem && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          {modalType === 'album' && coverImage && (
                            <div className="aspect-video relative rounded-xl overflow-hidden border border-border bg-secondary/50">
                              <img src={coverImage} alt="Preview" className="object-cover w-full h-full" />
                            </div>
                          )}
                          {modalType === 'image' && imageUrls.map((url, i) => (
                            <div key={i} className="aspect-video relative rounded-xl overflow-hidden border border-border bg-secondary/50">
                              {url.includes('video') ? (
                                <video src={url} className="object-cover w-full h-full" />
                              ) : (
                                <img src={url} alt="Preview" className="object-cover w-full h-full" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input required type="url" value={externalImageUrl} onChange={e => setExternalImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all font-mono text-sm" />
                  )}
                </div>
              )}
              </div>

              <div className="p-4 sm:px-8 sm:py-5 bg-white/95 flex justify-end gap-3 border-t border-border shrink-0 sticky bottom-0 z-10">
                <button type="button" disabled={isUploading || isSaving} onClick={() => setModalType(null)} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isUploading || isSaving} className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100">
                  {(isUploading || isSaving) && <Loader2 className="size-5 animate-spin" />}
                  {(isUploading || isSaving) ? 'Uploading & Saving...' : 'Upload & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={`Delete ${itemToDelete?.type}`}
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false)
          setItemToDelete(null)
        }}
      />
    </div>
  )
}
