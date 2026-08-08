'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, UserCircle, Users, GraduationCap, Shield, Star, Briefcase, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type Member = {
  id: string
  name: string
  email: string
  phone: string
  blood_group: string
  role: string
  custom_role?: string | null
  past_role?: string | null
  current_job?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  linkedin_url?: string | null
  image_url: string
  quote: string
  student_id: string
  student_address: string
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const ROLES = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'Advisor', 'Moderator', 'Executive Member', 'General Member', 'Alumni', 'Other (Custom Role)']

export function MembersManager() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [role, setRole] = useState('General Member')
  const [customRole, setCustomRole] = useState('')
  const [pastRole, setPastRole] = useState('')
  const [currentJob, setCurrentJob] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [quote, setQuote] = useState('')
  const [studentId, setStudentId] = useState('')
  const [studentAddress, setStudentAddress] = useState('')

  const loadMembers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('members').select('*').order('name', { ascending: true })
      if (error) throw error
      if (data) setMembers(data as Member[])
    } catch (err: any) {
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'Network error: Supabase could not be reached. Check your connection or ad-blocker.'
        : err.message
      toast.error('Database Error (Load Members): ' + errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const openModal = (member?: Member) => {
    if (member) {
      setEditingMember(member)
      setName(member.name || '')
      setEmail(member.email || '')
      setPhone(member.phone || '')
      setBloodGroup(member.blood_group || 'O+')
      
      const isCustomRole = !ROLES.includes(member.role) && member.role !== 'Other (Custom Role)'
      setRole(isCustomRole ? 'Other (Custom Role)' : member.role)
      setCustomRole(isCustomRole ? member.role : (member.custom_role || ''))
      
      setPastRole(member.past_role || '')
      setCurrentJob(member.current_job || '')
      setFacebookUrl(member.facebook_url || '')
      setInstagramUrl(member.instagram_url || '')
      setLinkedinUrl(member.linkedin_url || '')
      setImageUrl(member.image_url || '')
      setQuote(member.quote || '')
      setStudentId(member.student_id || '')
      setStudentAddress(member.student_address || '')
    } else {
      setEditingMember(null)
      setName('')
      setEmail('')
      setPhone('')
      setBloodGroup('O+')
      setRole('General Member')
      setCustomRole('')
      setPastRole('')
      setCurrentJob('')
      setFacebookUrl('')
      setInstagramUrl('')
      setLinkedinUrl('')
      setImageUrl('')
      setQuote('')
      setStudentId('')
      setStudentAddress('')
    }
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    let finalImageUrl = imageUrl

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
        name,
        email,
        phone,
        blood_group: bloodGroup,
        role: role === 'Other (Custom Role)' ? customRole : role,
        custom_role: role === 'Other (Custom Role)' ? customRole : null,
        past_role: pastRole,
        current_job: currentJob,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        linkedin_url: linkedinUrl,
        image_url: finalImageUrl,
        quote,
        student_id: studentId,
        student_address: studentAddress,
      }

      if (editingMember) {
        const { error } = await supabase.from('members').update(payload).eq('id', editingMember.id)
        if (error) throw error
        toast.success('Member updated successfully!')
        setMembers(members.map(m => m.id === editingMember.id ? { ...m, ...payload } : m))
        setIsModalOpen(false)
      } else {
        const { data, error } = await supabase.from('members').insert([payload]).select().single()
        if (error) throw error
        if (data) {
          toast.success('Member added successfully!')
          setMembers([data as Member, ...members].sort((a, b) => a.name.localeCompare(b.name)))
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      toast.error('Database Error (Save Member): ' + err.message)
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) return

    try {
      const { error } = await supabase.from('members').delete().eq('id', id)
      if (error) throw error
      toast.success('Member deleted successfully.')
      setMembers(members.filter(m => m.id !== id))
    } catch (err: any) {
      toast.error('Database Error (Delete Member): ' + err.message)
    }
  }

  const executiveRoles = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'Executive Member']
  
  const groupedMembers = {
    executive: members.filter(m => executiveRoles.includes(m.role)),
    advisors: members.filter(m => m.role === 'Advisor'),
    moderators: members.filter(m => m.role === 'Moderator'),
    alumni: members.filter(m => m.role === 'Alumni'),
    general: members.filter(m => m.role === 'General Member'),
    other: members.filter(m => !executiveRoles.includes(m.role) && !['Advisor', 'Moderator', 'Alumni', 'General Member'].includes(m.role))
  }

  const renderSection = (title: string, icon: React.ReactNode, data: Member[]) => {
    if (data.length === 0) return null
    return (
      <div className="mb-12 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-xl bg-[#F26522]/10 flex items-center justify-center text-[#F26522] shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy">{title}</h3>
            <p className="text-sm text-muted-foreground">{data.length} Members</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map(member => (
            <div key={member.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-all group relative">
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => openModal(member)} className="p-2 bg-white/90 backdrop-blur text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg shadow-sm transition-colors" title="Edit">
                  <Edit2 className="size-4" />
                </button>
                <button onClick={() => handleDelete(member.id)} className="p-2 bg-white/90 backdrop-blur text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg shadow-sm transition-colors" title="Delete">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="size-20 rounded-full object-cover border-4 border-white shadow-md mb-4" />
                  ) : (
                    <div className="size-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold text-2xl border-4 border-white shadow-md mb-4">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <h4 className="font-bold text-navy text-lg line-clamp-1 w-full" title={member.name}>{member.name}</h4>
                  <span className="inline-flex mt-2 items-center px-3 py-1 rounded-full bg-[#F26522]/10 text-[#F26522] text-[10px] font-bold uppercase tracking-wider">
                    {member.role === 'Other (Custom Role)' ? member.custom_role : member.role}
                  </span>
                  {(member.role === 'Alumni' || member.role === 'Advisor') && (
                    <div className="mt-3 text-xs text-muted-foreground line-clamp-2">
                      {member.current_job && <p className="font-medium">💼 {member.current_job}</p>}
                      {member.past_role && <p>Was: {member.past_role}</p>}
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-5 border-t border-border/50 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">ID / Dept</p>
                    <p className="text-xs font-mono font-semibold text-navy truncate" title={member.student_id}>{member.student_id || 'N/A'}</p>
                  </div>
                  <div className="text-center border-l border-border/50">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Blood</p>
                    <p className="text-xs font-bold text-red-600">{member.blood_group}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-navy tracking-tight">Manage Members</h2>
          <p className="text-muted-foreground mt-1">Organize and update the official UIUJEF directory.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 bg-[#F26522] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#F26522]/20 hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="size-5" />
          Add New Member
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-navy">Loading members directory...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-3xl border border-border p-12 text-center shadow-sm">
          <div className="mx-auto size-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 transform -rotate-6">
            <Users className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-navy mb-3">No Members Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">The directory is empty. Click the button above to start adding members.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {renderSection('Executive Panel', <Star className="size-6" />, groupedMembers.executive)}
          {renderSection('Advisors', <Shield className="size-6" />, groupedMembers.advisors)}
          {renderSection('Moderators', <Award className="size-6" />, groupedMembers.moderators)}
          {renderSection('General Members', <Users className="size-6" />, groupedMembers.general)}
          {renderSection('Alumni', <GraduationCap className="size-6" />, groupedMembers.alumni)}
          {renderSection('Other Roles', <Briefcase className="size-6" />, groupedMembers.other)}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:px-8 sm:py-6 border-b border-border flex items-center justify-between bg-transparent z-10 shrink-0">
              <h3 className="text-2xl font-bold text-navy tracking-tight">{editingMember ? 'Edit Member Profile' : 'Add New Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 sm:p-8 overflow-y-auto">
              <div className="space-y-8">
                
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Full Name *</label>
                      <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Student ID *</label>
                      <input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="011231..." className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none font-mono transition-all" />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Contact Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2 sm:col-span-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Phone Number</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Email Address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Role & Bio */}
                <div>
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Role & Assignment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Designation *</label>
                      <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none bg-white transition-all">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {role === 'Other (Custom Role)' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Custom Role Title *</label>
                        <input required type="text" value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="e.g. IT Lead" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                    )}
                  </div>

                  {(role === 'Alumni' || role === 'Advisor') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Past Role in Club</label>
                        <input type="text" value={pastRole} onChange={e => setPastRole(e.target.value)} placeholder="e.g. Former President" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Current Job / Company</label>
                        <input type="text" value={currentJob} onChange={e => setCurrentJob(e.target.value)} placeholder="e.g. Software Engineer at Google" className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Blood Group</label>
                      <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none bg-white transition-all">
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Student Address</label>
                      <input type="text" value={studentAddress} onChange={e => setStudentAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Social Links</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Facebook URL</label>
                      <input type="url" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">LinkedIn URL</label>
                      <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Instagram URL</label>
                      <input type="url" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Media & Bio */}
                <div>
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b border-border pb-2">Media & Biography</h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Profile Image</label>
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) setImageFile(file)
                      }} className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none file:mr-4 file:py-2 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#F26522]/10 file:text-[#F26522] hover:file:bg-[#F26522]/20 cursor-pointer transition-all" />
                      {imageUrl && !imageFile && (
                        <div className="mt-3 flex items-center gap-3 bg-secondary/50 p-2 rounded-xl border border-border w-max">
                          <img src={imageUrl} alt="Current" className="size-10 rounded-lg object-cover" />
                          <span className="text-sm font-medium text-navy pr-4">Current Image Active</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Personal Quote / Bio</label>
                      <textarea rows={3} value={quote} onChange={e => setQuote(e.target.value)} placeholder="A short meaningful quote or bio..." className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none resize-none transition-all" />
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-10 pt-6 flex justify-end gap-3 border-t border-border sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUploading} className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100">
                  {(isSaving || isUploading) && <Loader2 className="size-5 animate-spin" />}
                  {isUploading ? 'Uploading Image...' : isSaving ? 'Saving Profile...' : 'Save Member Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
