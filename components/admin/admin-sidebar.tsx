'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Calendar, FileText, Users, Image as ImageIcon, Settings, Menu, X, ShieldCheck, Archive, Star } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', href: '/blackberry/dashboard', icon: LayoutDashboard, tab: null },
  { label: 'Manage Events', href: '/blackberry/dashboard?tab=events', icon: Calendar, tab: 'events' },
  { label: 'Manage News', href: '/blackberry/dashboard?tab=news', icon: FileText, tab: 'news' },
  { label: 'Manage Community', href: '/blackberry/dashboard?tab=members', icon: Users, tab: 'members' },
  { label: 'Manage Gallery', href: '/blackberry/dashboard?tab=gallery', icon: ImageIcon, tab: 'gallery' },
  { label: 'Applications', href: '/blackberry/dashboard?tab=applications', icon: ShieldCheck, tab: 'applications' },
  { label: 'Priority List', href: '/blackberry/dashboard?tab=priority', icon: Star, tab: 'priority' },
  { label: 'Why Join Us', href: '/blackberry/dashboard?tab=why-join', icon: FileText, tab: 'why-join' },
  { label: 'Sponsors', href: '/blackberry/dashboard?tab=sponsors', icon: ImageIcon, tab: 'sponsors' },
  { label: 'Archive', href: '/blackberry/dashboard?tab=archive', icon: Archive, tab: 'archive' },
  { label: 'Site Settings', href: '/blackberry/dashboard?tab=settings', icon: Settings, tab: 'settings' },
]

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 p-4 sticky top-0 z-30 shadow-sm">
        <div className="font-serif text-lg font-bold text-slate-900 flex items-center gap-3">
          <div className="size-8 rounded-lg bg-[#F26522] flex items-center justify-center">
            <span className="text-white font-bold leading-none">J</span>
          </div>
          UIUJEF Admin
        </div>
        <button onClick={toggleSidebar} className="text-slate-600 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200">
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 shadow-2xl md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-200 hidden md:flex items-center gap-3">
          <div className="size-10 rounded-lg bg-[#F26522] flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-xl leading-none tracking-tighter">JEF</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 tracking-tight leading-tight">Admin Portal</h2>
            <p className="text-xs font-medium text-slate-500">Secure Management</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4 px-3">Main Navigation</div>
          {navItems.map((item) => {
            const isActive = item.tab === currentTab
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-lg transition-all group font-medium",
                  isActive 
                    ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                )}
              >
                <item.icon className={cn(
                  "size-5 transition-colors",
                  isActive ? "text-[#F26522]" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
