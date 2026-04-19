import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'
import { Search, Bell, Menu, X, User, UserPlus, Fingerprint, Activity, Clock, LogOut } from 'lucide-react'
import { Input } from '../ui/Input'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export default function DashboardLayout({ children, pageTitle, pageSubtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchBox, setShowSearchBox] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return { patients: [], staff: [] }
      const patients = await supabase.from('patients').select('*').or(`full_name.ilike.%${searchQuery}%,registration_no.ilike.%${searchQuery}%`).limit(5)
      const staff = await supabase.from('profiles').select('*').ilike('full_name', `%${searchQuery}%`).limit(3)
      return { patients: patients.data || [], staff: staff.data || [] }
    },
    enabled: searchQuery.length > 2
  })

  // Mock Notifications
  const notifications = [
    { id: 1, type: 'emergency', msg: 'Critical Triage: Room 4', time: '2m ago' },
    { id: 2, type: 'lab', msg: 'Hemoglobin results verified for P-882', time: '15m ago' },
    { id: 3, type: 'stock', msg: 'Paracetamol low on inventory', time: '1h ago' }
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchBox(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#fcfdff] flex font-sans selection:bg-teal-600/10 selection:text-teal-700">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between gap-6">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-3 text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
          >
            <Menu size={20} />
          </button>

          {/* Global Terminal Search */}
          <div className="flex-1 max-w-2xl hidden md:block relative" ref={searchRef}>
            <div className="relative group">
              <div className="absolute inset-x-0 -bottom-1 h-3 bg-teal-600/5 blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
              <Input 
                placeholder="Universal Search: ID, Name, or Specialist..." 
                className="pl-12 h-12 bg-slate-50 border-0 rounded-2xl font-bold text-sm tracking-tight focus:bg-white focus:ring-4 focus:ring-teal-600/5 transition-all w-full ring-1 ring-slate-100"
                value={searchQuery}
                onFocus={() => setShowSearchBox(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchBox && searchQuery.length > 2 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 shadow-3xl rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 ring-4 ring-slate-900/5">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Global Index Search</h5>
                   <Badge className="bg-teal-600 text-white border-0 text-[8px] font-black uppercase tracking-widest">LIVE</Badge>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-2 space-y-4">
                   {/* Patients Section */}
                   <div className="space-y-1">
                      <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Patients Registry</p>
                      {searchResults?.patients.length > 0 ? searchResults.patients.map(p => (
                        <Link 
                           key={p.id} 
                           to={`/dashboard/receptionist/patients/${p.id}`} 
                           className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl group transition-all"
                           onClick={() => setShowSearchBox(false)}
                        >
                           <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                             {p.full_name?.[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-sm font-black text-slate-900 truncate">{p.full_name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.registration_no}</div>
                           </div>
                        </Link>
                      )) : <p className="px-4 py-3 text-xs text-slate-300 italic">No patients matched</p>}
                   </div>

                   {/* Staff Section */}
                   <div className="space-y-1">
                      <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Hospital Staff</p>
                      {searchResults?.staff.length > 0 ? searchResults.staff.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl group transition-all">
                           <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black group-hover:bg-teal-600 group-hover:text-white transition-colors">
                             {s.full_name?.[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-sm font-black text-slate-900 truncate">{s.full_name}</div>
                              <div className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{s.role} • {s.department}</div>
                           </div>
                        </div>
                      )) : <p className="px-4 py-3 text-xs text-slate-300 italic">No personnel matched</p>}
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            {/* Notification Hub */}
            <div className="relative">
               <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-3 rounded-2xl transition-all group ${showNotifications ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
               >
                  <Bell size={20} className={showNotifications ? 'animate-none' : 'group-hover:rotate-12 transition-transform'} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
               </button>

               {showNotifications && (
                 <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-100 shadow-3xl rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 ring-4 ring-slate-900/5">
                    <div className="p-6 bg-slate-900 text-white">
                       <h5 className="text-xs font-black uppercase tracking-widest mb-1 flex items-center justify-between">
                          Dispatch Comms
                          <Badge className="bg-rose-500 text-white border-0 text-[8px] px-1.5 py-0.5">3 ACTIVE</Badge>
                       </h5>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Real-time Clinical Alerts</p>
                    </div>
                    <div className="p-2 divide-y divide-slate-50">
                       {notifications.map(n => (
                         <div key={n.id} className="p-4 hover:bg-slate-50 cursor-pointer group transition-colors flex gap-4 items-start">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${n.type === 'emergency' ? 'bg-rose-500 shadow-lg shadow-rose-500/50' : 'bg-teal-500 shadow-lg shadow-teal-500/50'}`} />
                            <div className="flex-1">
                               <p className="text-sm font-black text-slate-800 leading-snug group-hover:text-teal-600 transition-colors">{n.msg}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                  <Clock size={10} /> {n.time}
                               </p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
            
            <div className="h-10 w-px bg-slate-100 mx-2 hidden sm:block" />
            
            <div className="flex items-center gap-4 group cursor-pointer" onClick={handleLogout}>
              <div className="hidden md:block text-right">
                <div className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1 group-hover:text-rose-600 transition-colors">{profile?.full_name}</div>
                <div className="text-[9px] font-black text-teal-600 uppercase tracking-widest flex items-center justify-end gap-1 group-hover:text-rose-600/70 transition-colors">
                   <Fingerprint size={10} /> {profile?.role}
                </div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl shadow-slate-900/20 group-hover:scale-110 group-hover:shadow-rose-600/20 transition-all border-2 border-white ring-1 ring-slate-100">
                  {profile?.full_name?.[0]}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Context Header */}
        <div className="bg-white/50 border-b border-slate-50 px-6 md:px-10 py-6">
           <div className="max-w-7xl mx-auto flex items-end justify-between">
              <div>
                 <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1 h-4 bg-teal-600 rounded-full" />
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">{profile?.role} TERMINAL</span>
                 </div>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{pageTitle}</h1>
                 {pageSubtitle && <p className="text-sm text-slate-400 font-bold mt-2 max-w-xl">{pageSubtitle}</p>}
              </div>
              <div className="hidden xl:flex gap-6 items-center">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Load</p>
                    <div className="flex gap-1">
                       {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-3 rounded-full ${i <= 3 ? 'bg-teal-500' : 'bg-slate-100'}`} />)}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Content Shell */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
            {children}
          </div>
        </main>

        {/* System Footer Bar */}
        <footer className="h-10 px-10 border-t border-slate-50 bg-white/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">© 2026 MedCare Pro HMS</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Build 4.2.0-STABLE</span>
           </div>
           <div className="flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">All Modules Synchronized</span>
           </div>
        </footer>
      </div>

      {/* Logout / Session Timeout Overlay (Optional UI) */}
    </div>
  )
}

function Badge({ children, className }) {
   return (
     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${className}`}>
       {children}
     </span>
   )
}
