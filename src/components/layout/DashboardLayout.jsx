import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'
import { Search, Bell, Menu } from 'lucide-react'
import { Input } from '../ui/Input'

export default function DashboardLayout({ children, pageTitle, pageSubtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search patients, records, or staff..." 
                className="pl-10 h-10 border-slate-200 bg-slate-50 focus:bg-white transition-all w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all group">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform" />
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800">{profile?.full_name}</div>
                <div className="text-[10px] font-bold text-teal-600 uppercase tracking-tighter">{profile?.role}</div>
              </div>
              <div className="w-9 h-9 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white">
                {profile?.full_name?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {(pageTitle || pageSubtitle) && (
            <div className="mb-8">
              {pageTitle && <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{pageTitle}</h1>}
              {pageSubtitle && <p className="text-slate-500 mt-1 font-medium">{pageSubtitle}</p>}
            </div>
          )}
          
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
