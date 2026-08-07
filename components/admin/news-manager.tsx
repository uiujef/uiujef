'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

type NewsArticle = {
  id: string
  title: string
  published_at: string
  content: string
  cover_image: string
  published: boolean
}

export function NewsManager() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [published, setPublished] = useState(false)

  const loadNews = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('news').select('*').order('published_at', { ascending: false })
      if (error) throw error
      if (data) setNews(data as NewsArticle[])
    } catch (err: any) {
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'Network error: Supabase could not be reached. Check your connection or ad-blocker.'
        : err.message
      toast.error('Database Error (Load News): ' + errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [])

  const openModal = (article?: NewsArticle) => {
    if (article) {
      setEditingNews(article)
      setTitle(article.title)
      setPublishedAt(article.published_at || '')
      setContent(article.content || '')
      setCoverImage(article.cover_image || '')
      setPublished(article.published || false)
    } else {
      setEditingNews(null)
      setTitle('')
      setPublishedAt('')
      setContent('')
      setCoverImage('')
      setPublished(false)
    }
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    let finalImageUrl = coverImage

    try {
      if (imageFile) {
        setIsUploading(true)
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('jef-images')
          .upload(fileName, imageFile)

        if (uploadError) throw new Error('Image Upload Failed: ' + uploadError.message)

        const { data: { publicUrl } } = supabase.storage
          .from('jef-images')
          .getPublicUrl(fileName)

        finalImageUrl = publicUrl
      }

      const payload = {
        title,
        published_at: publishedAt,
        content,
        cover_image: finalImageUrl,
        published,
      }

      if (editingNews) {
        const { error } = await supabase.from('news').update(payload).eq('id', editingNews.id)
        if (error) throw error
        toast.success('Article updated successfully!')
        setNews(news.map(n => n.id === editingNews.id ? { ...n, ...payload } : n))
        setIsModalOpen(false)
      } else {
        const { data, error } = await supabase.from('news').insert([payload]).select().single()
        if (error) throw error
        if (data) {
          toast.success('Article created successfully!')
          setNews([data as NewsArticle, ...news])
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      toast.error('Database Error (Save News): ' + err.message)
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const { error } = await supabase.from('news').delete().eq('id', id)
      if (error) throw error
      toast.success('Article deleted successfully.')
      setNews(news.filter(n => n.id !== id))
    } catch (err: any) {
      toast.error('Database Error (Delete News): ' + err.message)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">Manage News</h2>
          <p className="text-muted-foreground mt-1">Publish and manage news articles.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-[#F26522] text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-[#F26522]/20 hover:bg-[#F26522]/90 transition-all">
          <Plus className="size-4" />
          Write Article
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-navy">Loading news...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <div className="mx-auto size-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <FileText className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">No News Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">There are currently no news articles. Start writing to keep your members informed!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Title</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Published Date</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {news.map((article) => (
                  <tr key={article.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-navy">{article.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{article.published_at ? new Date(article.published_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">
                      {article.published ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/10 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(article)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="size-4" />
                        </button>
                        <button onClick={() => handleDelete(article.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
              <h3 className="text-xl font-bold text-navy">{editingNews ? 'Edit Article' : 'Write New Article'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Article Title</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Publish Date</label>
                  <input required type="date" value={publishedAt.split('T')[0] || ''} onChange={e => setPublishedAt(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-navy">Cover Image Upload</label>
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) setImageFile(file)
                }} className="w-full px-4 py-2 rounded-xl border border-border focus:border-[#F26522] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#F26522]/10 file:text-[#F26522] hover:file:bg-[#F26522]/20" />
                {coverImage && !imageFile && <p className="text-xs text-muted-foreground mt-1">Current: <a href={coverImage} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Image</a></p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-navy">Content (Markdown/Text)</label>
                <textarea required rows={8} value={content} onChange={e => setContent(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none" />
              </div>

              <div className="flex flex-wrap gap-6 pt-4 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="size-4 accent-[#F26522]" />
                  <span className="text-sm font-semibold text-navy">Publish immediately</span>
                </label>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUploading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 transition-colors disabled:opacity-50">
                  {(isSaving || isUploading) && <Loader2 className="size-4 animate-spin" />}
                  {isUploading ? 'Uploading Image...' : isSaving ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
