'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, UserCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type Member = {
  id: string
  name: string
  email: string
  phone: string
  blood_group: string
  role: string
  image_url: string
  quote: string
  student_id: string
  student_address: string
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const ROLES = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'Advisor', 'Executive Member', 'General Member', 'Alumni']

export function MembersManager() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [role, setRole] = useState('General Member')
  const [imageUrl, setImageUrl] = useState('')
  const [quote, setQuote] = useState('')
  const [studentId, setStudentId] = useState('')
  const [studentAddress, setStudentAddress] = useState('')

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('members').select('*').order('name', { ascending: true })
      if (error) throw error
      if (data) setMembers(data as Member[])
    } catch (err: any) {
      toast.error('Database Error (Fetch Members): ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const openModal = (member?: Member) => {
    if (member) {
      setEditingMember(member)
      setName(member.name || '')
      setEmail(member.email || '')
      setPhone(member.phone || '')
      setBloodGroup(member.blood_group || 'O+')
      setRole(member.role || 'General Member')
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
      setImageUrl('')
      setQuote('')
      setStudentId('')
      setStudentAddress('')
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      name,
      email,
      phone,
      blood_group: bloodGroup,
      role,
      image_url: imageUrl,
      quote,
      student_id: studentId,
      student_address: studentAddress,
    }

    try {
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">Manage Members</h2>
          <p className="text-muted-foreground mt-1">Add or update official club members.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-[#F26522] text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-[#F26522]/20 hover:bg-[#F26522]/90 transition-all">
          <Plus className="size-4" />
          Add Member
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-navy">Loading members...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <div className="mx-auto size-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <UserCircle className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">No Members Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">It looks like the members table is empty. Click "Add Member" to populate your directory.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Name</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Student ID</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Role</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Contact</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Blood Group</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} className="size-10 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="size-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-navy">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-navy font-semibold">
                      {member.student_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F26522]/10 text-[#F26522] text-[10px] font-bold uppercase tracking-wider">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-navy">{member.email || 'N/A'}</div>
                      <div className="text-muted-foreground text-xs">{member.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 font-bold text-xs">
                        {member.blood_group}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(member)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="size-4" />
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
              <h3 className="text-xl font-bold text-navy">{editingMember ? 'Edit Member' : 'Add New Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Full Name</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Student ID</label>
                  <input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="011231..." className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase text-navy">Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-navy">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Blood Group</label>
                  <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none bg-white">
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Student Address</label>
                  <input type="text" value={studentAddress} onChange={e => setStudentAddress(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Role / Designation</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none bg-white">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-navy">Image URL</label>
                  <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-navy">Personal Quote / Bio</label>
                <textarea rows={3} value={quote} onChange={e => setQuote(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-[#F26522] outline-none" />
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#F26522] text-white hover:bg-[#F26522]/90 transition-colors disabled:opacity-50">
                  {isSaving && <Loader2 className="size-4 animate-spin" />}
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
