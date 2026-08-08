'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Calendar, FileText, Users, Image as ImageIcon, Settings, Menu, X } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', href: '/blackberry/dashboard', icon: LayoutDashboard, tab: null },
  { label: 'Manage Events', href: '/blackberry/dashboard?tab=events', icon: Calendar, tab: 'events' },
  { label: 'Manage News', href: '/blackberry/dashboard?tab=news', icon: FileText, tab: 'news' },
  { label: 'Manage Members', href: '/blackberry/dashboard?tab=members', icon: Users, tab: 'members' },
  { label: 'Manage Gallery', href: '/blackberry/dashboard?tab=gallery', icon: ImageIcon, tab: 'gallery' },
  { label: 'Applications', href: '/blackberry/dashboard?tab=applications', icon: Users, tab: 'applications' },
  { label: 'Why Join Us', href: '/blackberry/dashboard?tab=why-join', icon: FileText, tab: 'why-join' },
  { label: 'Sponsors', href: '/blackberry/dashboard?tab=sponsors', icon: ImageIcon, tab: 'sponsors' },
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
      <div className="md:hidden flex items-center justify-between bg-navy-deep p-4 sticky top-0 z-30 shadow-md">
        <div className="font-serif text-lg font-bold text-white flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#F26522] flex items-center justify-center shadow-lg shadow-[#F26522]/20">
            <span className="text-white font-bold leading-none">J</span>
          </div>
          UIUJEF CMS
        </div>
        <button onClick={toggleSidebar} className="text-white p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
          {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen w-72 bg-navy-deep border-r border-border flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/10 hidden md:flex items-center justify-between">
          <div className="font-serif text-xl font-bold text-white flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-[#F26522] to-[#FF7A3D] flex items-center justify-center shadow-lg shadow-[#F26522]/30 border border-white/10">
              <span className="text-white font-black text-xl leading-none tracking-tighter">JEF</span>
            </div>
            Admin Panel
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 px-4 pt-2">Menu</div>
          {navItems.map((item) => {
            const isActive = item.tab === currentTab
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group font-medium relative overflow-hidden",
                  isActive 
                    ? "text-white bg-[#F26522] shadow-md shadow-[#F26522]/20" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}
                <item.icon className={cn(
                  "size-5 transition-colors relative z-10",
                  isActive ? "text-white" : "text-white/50 group-hover:text-white"
                )} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-5 border-t border-white/10 bg-black/10">
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
