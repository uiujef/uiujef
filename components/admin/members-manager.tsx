'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, UserCircle, Users, GraduationCap, Shield, Star, Briefcase, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { CloudinaryUploader } from '@/components/cloudinary-uploader'
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
  hobby?: string
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const BASE_CATEGORIES = ['Executive Panel', 'Moderator', 'General Member', 'Advisor', 'Alumni', 'Other']
const PREDEFINED_EXEC_ROLES = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'Executive of Event', 'Executive of Communication', 'Executive of PR & Marketing', 'Executive of Finance', 'Other (Custom)']

export function MembersManager() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('executive')
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageInputType, setImageInputType] = useState<'upload' | 'url'>('upload')
  const [externalImageUrl, setExternalImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bloodGroup, setBloodGroup] = useState('O+')
  
  const [baseCategory, setBaseCategory] = useState('General Member')
  const [executiveDesignation, setExecutiveDesignation] = useState('Executive of Event')
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
  const [hobby, setHobby] = useState('')

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
      
      const roleStr = member.role || 'General Member';
      const isExec = ['President', 'Vice President', 'General Secretary', 'Treasurer'].includes(roleStr) || roleStr.startsWith('Executive');
      const isPredefinedExec = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'Executive of Event', 'Executive of Communication', 'Executive of PR & Marketing', 'Executive of Finance'].includes(roleStr);
      
      if (isExec) {
        setBaseCategory('Executive Panel');
        if (isPredefinedExec) {
          setExecutiveDesignation(roleStr);
          setCustomRole('');
        } else {
          setExecutiveDesignation('Other (Custom)');
          setCustomRole(roleStr);
        }
      } else if (['Advisor', 'Moderator', 'Alumni', 'General Member'].includes(roleStr)) {
        setBaseCategory(roleStr);
        setExecutiveDesignation('Executive of Event');
        setCustomRole('');
      } else {
        setBaseCategory('Other');
        setExecutiveDesignation('Executive of Event');
        setCustomRole(roleStr);
      }
      
      setPastRole(member.past_role || '')
      setCurrentJob(member.current_job || '')
      setFacebookUrl(member.facebook_url || '')
      setHobby(member.hobby || '')
      setInstagramUrl(member.instagram_url || '')
      setLinkedinUrl(member.linkedin_url || '')
      setImageUrl(member.image_url || '')
      setImageUrl(member.image_url || '')
      setExternalImageUrl(member.image_url || '')
      setImageInputType(member.image_url ? 'url' : 'upload')
      setQuote(member.quote || '')
      setStudentId(member.student_id || '')
      setStudentAddress(member.student_address || '')
    } else {
      setEditingMember(null)
      setName('')
      setEmail('')
      setPhone('')
      setBaseCategory('General Member')
      setExecutiveDesignation('Executive of Event')
      setCustomRole('')
      setPastRole('')
      setCurrentJob('')
      setFacebookUrl('')
      setHobby('')
      setInstagramUrl('')
      setLinkedinUrl('')
      setImageUrl('')
      setExternalImageUrl('')
      setImageInputType('upload')
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
      if (imageInputType === 'url' && externalImageUrl) {
        finalImageUrl = externalImageUrl
      }

      let finalRole = baseCategory;
      if (baseCategory === 'Executive Panel') {
        finalRole = executiveDesignation === 'Other (Custom)' ? customRole : executiveDesignation;
      } else if (baseCategory === 'Other') {
        finalRole = customRole;
      }

      const payload = {
        name,
        email,
        phone,
        blood_group: bloodGroup,
        role: finalRole,
        past_role: pastRole,
        current_job: currentJob,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        linkedin_url: linkedinUrl,
        image_url: finalImageUrl,
        quote,
        student_id: studentId,
        student_address: studentAddress,
        hobby
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

  const confirmDelete = (id: string) => {
    setMemberToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!memberToDelete) return

    try {
      const { error } = await supabase.from('members').delete().eq('id', memberToDelete)
      if (error) throw error
      toast.success('Member deleted successfully.')
      setMembers(members.filter(m => m.id !== memberToDelete))
    } catch (err: any) {
      toast.error('Database Error (Delete Member): ' + err.message)
    } finally {
      setIsConfirmOpen(false)
      setMemberToDelete(null)
    }
  }

  const isExecutive = (role: string) => {
    return ['President', 'Vice President', 'General Secretary', 'Treasurer'].includes(role) || role.startsWith('Executive');
  }
  
  const groupedMembers = {
    executive: members.filter(m => isExecutive(m.role)),
    advisors: members.filter(m => m.role === 'Advisor'),
    moderators: members.filter(m => m.role === 'Moderator'),
    alumni: members.filter(m => m.role === 'Alumni'),
    general: members.filter(m => m.role === 'General Member'),
    other: members.filter(m => !isExecutive(m.role) && !['Advisor', 'Moderator', 'Alumni', 'General Member'].includes(m.role))
  }

  const renderSection = (title: string, icon: React.ReactNode, data: Member[]) => {
    if (data.length === 0) return null
    return (
      <div className="mb-12 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-2xl bg-[#F26522]/10 flex items-center justify-center text-[#F26522] shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{data.length} Members</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((member, idx) => (
            <div key={member.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group relative">
              <div className="absolute top-4 left-4 size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 z-10">
                {idx + 1}
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => openModal(member)} className="p-2 bg-white/90 backdrop-blur text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg shadow-sm transition-colors" title="Edit">
                  <Edit2 className="size-4" />
                </button>
                <button onClick={() => confirmDelete(member.id)} className="p-2 bg-white/90 backdrop-blur text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg shadow-sm transition-colors" title="Delete">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="size-20 rounded-full object-cover border-4 border-white shadow-md mb-4" />
                  ) : (
                    <div className="size-20 rounded-full bg-white/40 flex items-center justify-center text-slate-500 font-bold text-2xl border-4 border-white shadow-md mb-4">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <h4 className="font-bold text-slate-800 text-lg line-clamp-1 w-full" title={member.name}>{member.name}</h4>
                  <span className="inline-flex mt-2 items-center px-3 py-1 rounded-full bg-[#F26522]/10 text-[#F26522] text-[10px] font-bold uppercase tracking-wider">
                    {member.role}
                  </span>
                  {(member.role === 'Alumni' || member.role === 'Advisor') && (
                    <div className="mt-3 text-xs text-slate-500 line-clamp-2">
                      {member.current_job && <p className="font-medium">💼 {member.current_job}</p>}
                      {member.past_role && <p>Was: {member.past_role}</p>}
                    </div>
                  )}
                  {member.role === 'Moderator' && (
                    <div className="mt-3 text-xs text-slate-500 flex flex-col items-center gap-1.5 w-full">
                      {member.current_job && <p className="font-medium text-slate-700">🎓 {member.current_job}</p>}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        member.past_role === 'Ex-Moderator' 
                          ? 'bg-slate-50 text-slate-500 border-slate-200' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {member.past_role === 'Ex-Moderator' ? 'Ex-Moderator' : 'Current Moderator'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-5 border-t border-slate-200/50 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">ID / Dept</p>
                    <p className="text-xs font-mono font-semibold text-slate-800 truncate" title={member.student_id}>{member.student_id || 'N/A'}</p>
                  </div>
                  <div className="text-center border-l border-slate-200/50">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Blood</p>
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
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Manage Community</h2>
          <p className="text-slate-500 mt-1">Organize and update the official UIUJEF directory.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 bg-[#F26522] text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-[#F26522]/20 hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="size-5" />
          Add to Community
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-10 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-slate-800">Loading members directory...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto size-20 bg-white/40 rounded-xl flex items-center justify-center mb-6 transform -rotate-6">
            <Users className="size-10 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">No Members Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">The directory is empty. Click the button above to start adding members.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
            {[
              { id: 'executive', label: 'Executive Panel', icon: Star, data: groupedMembers.executive },
              { id: 'moderators', label: 'Moderator', icon: Award, data: groupedMembers.moderators },
              { id: 'general', label: 'General Members', icon: Users, data: groupedMembers.general },
              { id: 'advisors', label: 'Advisors', icon: Shield, data: groupedMembers.advisors },
              { id: 'alumni', label: 'Alumni', icon: GraduationCap, data: groupedMembers.alumni },
              { id: 'other', label: 'Other Roles', icon: Briefcase, data: groupedMembers.other }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#F26522] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
                <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.data.length}
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'executive' && renderSection('Executive Panel', <Star className="size-6" />, groupedMembers.executive)}
          {activeTab === 'moderators' && renderSection('Moderator', <Award className="size-6" />, groupedMembers.moderators)}
          {activeTab === 'general' && renderSection('General Members', <Users className="size-6" />, groupedMembers.general)}
          {activeTab === 'advisors' && renderSection('Advisors', <Shield className="size-6" />, groupedMembers.advisors)}
          {activeTab === 'alumni' && renderSection('Alumni', <GraduationCap className="size-6" />, groupedMembers.alumni)}
          {activeTab === 'other' && renderSection('Other Roles', <Briefcase className="size-6" />, groupedMembers.other)}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:px-8 sm:py-6 border-b border-slate-200 flex items-center justify-between bg-transparent z-10 shrink-0">
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{editingMember ? 'Edit Member Profile' : 'Add to Community'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-white/40 text-slate-500 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 sm:p-8 overflow-y-auto">
              <div className="space-y-8">
                
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className={baseCategory === 'Moderator' ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                      <label className="text-xs font-bold uppercase text-slate-500">Full Name *</label>
                      <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                    {baseCategory !== 'Moderator' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Student ID *</label>
                        <input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="011231..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none font-mono transition-all" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Contact Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {baseCategory !== 'Moderator' && (
                      <div className="space-y-2 sm:col-span-1">
                        <label className="text-xs font-bold uppercase text-slate-500">Phone Number</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                    )}
                    <div className={`space-y-2 ${baseCategory === 'Moderator' ? 'sm:col-span-3' : 'sm:col-span-2'}`}>
                      <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Role & Bio */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Role & Assignment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500">Category *</label>
                      <select value={baseCategory} onChange={e => setBaseCategory(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none bg-white transition-all">
                        {BASE_CATEGORIES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    {baseCategory === 'Executive Panel' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Executive Designation *</label>
                        <select value={executiveDesignation} onChange={e => setExecutiveDesignation(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none bg-white transition-all">
                          {PREDEFINED_EXEC_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    )}
                    
                    {((baseCategory === 'Executive Panel' && executiveDesignation === 'Other (Custom)') || baseCategory === 'Other') && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Custom Role Title *</label>
                        <input required type="text" value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="e.g. IT Lead" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                    )}
                  </div>

                  {(baseCategory === 'Alumni' || baseCategory === 'Advisor') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Past Role in Club</label>
                        <input type="text" value={pastRole} onChange={e => setPastRole(e.target.value)} placeholder="e.g. Former President" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Current Job / Company</label>
                        <input type="text" value={currentJob} onChange={e => setCurrentJob(e.target.value)} placeholder="e.g. Software Engineer at Google" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                    </div>
                  )}

                  {baseCategory === 'Moderator' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">University Designation</label>
                        <input type="text" value={currentJob} onChange={e => setCurrentJob(e.target.value)} placeholder="e.g. Assistant Professor" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Moderator Status</label>
                        <div className="flex gap-4 items-center h-[50px]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="moderatorStatus" value="Current Moderator" checked={pastRole !== 'Ex-Moderator'} onChange={e => setPastRole(e.target.value)} className="w-4 h-4 text-[#F26522] focus:ring-[#F26522] accent-[#F26522]" />
                            <span className="text-sm font-medium text-slate-700">Current Moderator</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="moderatorStatus" value="Ex-Moderator" checked={pastRole === 'Ex-Moderator'} onChange={e => setPastRole(e.target.value)} className="w-4 h-4 text-[#F26522] focus:ring-[#F26522] accent-[#F26522]" />
                            <span className="text-sm font-medium text-slate-700">Ex-Moderator</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {baseCategory !== 'Moderator' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Blood Group</label>
                        <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none bg-white transition-all">
                          {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Student Address</label>
                        <input type="text" value={studentAddress} onChange={e => setStudentAddress(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Social Links</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500">Facebook URL</label>
                      <input type="url" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500">LinkedIn URL</label>
                      <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500">Instagram URL</label>
                      <input type="url" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Media & Bio */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Media & Biography</h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500">Profile Image Source</label>
                      <div className="flex bg-white/50 p-1 rounded-2xl w-fit mb-2 border border-slate-200">
                        <button type="button" onClick={() => setImageInputType('upload')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${imageInputType === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Upload File</button>
                        <button type="button" onClick={() => setImageInputType('url')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${imageInputType === 'url' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Paste URL</button>
                      </div>
                      
                      {imageInputType === 'upload' ? (
                        <div className="w-full">
                          <CloudinaryUploader 
                            onUploadSuccess={(url) => { setImageUrl(url); setIsUploading(false); }}
                            onUploadStart={() => setIsUploading(true)}
                            onUploadError={() => setIsUploading(false)}
                            folder="/uiujef/members"
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <input type="url" value={externalImageUrl} onChange={e => setExternalImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all font-mono text-sm" />
                      )}

                      {/* Preview logic */}
                      {(imageInputType === 'url' && externalImageUrl) ? (
                        <div className="mt-4 aspect-video relative rounded-2xl overflow-hidden border border-slate-200 bg-white/50 w-full max-w-[200px] h-32">
                          <img src={externalImageUrl} alt="Preview" className="object-cover w-full h-full" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Invalid+Image+URL')} />
                        </div>
                      ) : (imageUrl && !externalImageUrl) ? (
                        <div className="mt-3 flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-slate-200 w-max">
                          <img src={imageUrl} alt="Current" className="size-10 rounded-lg object-cover" />
                          <span className="text-sm font-medium text-slate-800 pr-4">Current Image Active</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Personal Quote / Bio</label>
                        <textarea rows={3} value={quote} onChange={e => setQuote(e.target.value)} placeholder="A short meaningful quote or bio..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none resize-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Hobby / Interest</label>
                        <textarea rows={3} value={hobby} onChange={e => setHobby(e.target.value)} placeholder="e.g. Reading, Coding..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20 outline-none resize-none transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-10 pt-6 flex justify-end gap-3 border-t border-slate-200 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-white/40 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUploading} className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100">
                  {(isSaving || isUploading) && <Loader2 className="size-5 animate-spin" />}
                  {isUploading ? 'Uploading Image...' : isSaving ? 'Saving Profile...' : 'Save Member Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false)
          setMemberToDelete(null)
        }}
      />
    </div>
  )
}
