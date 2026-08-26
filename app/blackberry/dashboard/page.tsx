'use client'

import { useSearchParams } from 'next/navigation'
import { LayoutDashboard, Calendar, FileText, Users, Image as ImageIcon, Settings, ShieldCheck } from 'lucide-react'
import { EventsManager } from '@/components/admin/events-manager'
import { NewsManager } from '@/components/admin/news-manager'
import { ApplicationsManager } from '@/components/admin/applications-manager'
import { MembersManager } from '@/components/admin/members-manager'
import { GalleryManager } from '@/components/admin/gallery-manager'
import { SettingsManager } from '@/components/admin/settings-manager'
import { WhyJoinManager } from '@/components/admin/why-join-manager'
import { SponsorsManager } from '@/components/admin/sponsors-manager'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'overview'

  const [stats, setStats] = useState({
    events: 0,
    news: 0,
    members: 0,
    applications: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  useEffect(() => {
    if (tab === 'overview') {
      const fetchStats = async () => {
        setIsLoadingStats(true)
        try {
          const [eventsRes, newsRes, membersRes, appsRes] = await Promise.all([
            supabase.from('events').select('*', { count: 'exact', head: true }),
            supabase.from('news').select('*', { count: 'exact', head: true }),
            supabase.from('members').select('*', { count: 'exact', head: true }),
            supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
          ])

          setStats({
            events: eventsRes.count || 0,
            news: newsRes.count || 0,
            members: membersRes.count || 0,
            applications: appsRes.count || 0
          })
        } catch (error) {
          console.error("Error fetching dashboard stats", error)
        } finally {
          setIsLoadingStats(false)
        }
      }
      fetchStats()
    }
  }, [tab])

  const renderTabContent = () => {
    switch (tab) {
      case 'events':
        return <EventsManager />
      case 'news':
        return <NewsManager />
      case 'members':
        return <MembersManager />
      case 'gallery':
        return <GalleryManager />
      case 'applications':
        return <ApplicationsManager />
      case 'settings':
        return <SettingsManager />
      case 'why-join':
        return <WhyJoinManager />
      case 'sponsors':
        return <SponsorsManager />
      case 'overview':
      default:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
              <p className="text-slate-500">Welcome back to the UIUJEF Administrative Terminal.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Stat Cards */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 transition-shadow hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:shadow-[#F26522]/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Total Events</p>
                  <div className="size-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Calendar className="size-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{isLoadingStats ? '-' : stats.events}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 transition-shadow hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:shadow-[#F26522]/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">News Published</p>
                  <div className="size-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <FileText className="size-5 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{isLoadingStats ? '-' : stats.news}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 transition-shadow hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:shadow-[#F26522]/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Total Members</p>
                  <div className="size-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <Users className="size-5 text-orange-600" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{isLoadingStats ? '-' : stats.members}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 transition-shadow hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:shadow-[#F26522]/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Pending Apps</p>
                  <div className="size-10 rounded-full bg-[#F26522]/10 border border-[#F26522]/20 flex items-center justify-center">
                    <ShieldCheck className="size-5 text-[#F26522]" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{isLoadingStats ? '-' : stats.applications}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="mx-auto size-14 bg-[#F26522]/10 rounded-xl flex items-center justify-center mb-5 rotate-3">
                <LayoutDashboard className="size-7 text-[#F26522]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Systems Operational</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                Database integrations are fully active. Use the navigation sidebar to securely manage your members, events, and applications.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="p-8 lg:p-12">
      {renderTabContent()}
    </div>
  )
}
