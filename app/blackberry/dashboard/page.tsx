'use client'

import { useSearchParams } from 'next/navigation'
import { LayoutDashboard, Calendar, FileText, Users, Image as ImageIcon, Settings } from 'lucide-react'
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-bold text-navy">Dashboard Overview</h2>
              <p className="text-muted-foreground mt-1">Welcome to the UIUJEF Administrative Terminal.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stat Cards */}
              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="size-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Events</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl text-navy font-black">{isLoadingStats ? '-' : stats.events}</p>
                    <p className="text-xs text-muted-foreground font-medium">events tracking</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className="size-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <FileText className="size-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">News Published</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl text-navy font-black">{isLoadingStats ? '-' : stats.news}</p>
                    <p className="text-xs text-muted-foreground font-medium">news pipeline</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Users className="size-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Community Size</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl text-navy font-black">{isLoadingStats ? '-' : stats.members}</p>
                    <p className="text-xs text-[#F26522] font-bold bg-[#F26522]/10 px-2 py-0.5 rounded-md">{isLoadingStats ? '-' : stats.applications} Pending</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <div className="mx-auto size-16 bg-[#F26522]/10 rounded-full flex items-center justify-center mb-4">
                <LayoutDashboard className="size-8 text-[#F26522]" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Systems Online</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                All CRUD operations and real-time Supabase integrations are successfully deployed. Use the sidebar to manage your database securely.
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
