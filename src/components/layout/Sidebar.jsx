import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard, Users, Calendar, FileText, Pill, FlaskConical,
  Receipt, BedDouble, Activity, BarChart3, Settings, LogOut,
  Stethoscope, ClipboardList, Package, TestTube, DollarSign,
  UserCog, ShieldAlert, Heart, Menu, X, UserPlus, Clock,
  Beaker, ClipboardEdit, FileBarChart, Layers
} from 'lucide-react'

const NAV_CONFIG = {
  admin: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/admin', section: 'Admin Registry' },
    { label: 'Staff Management', icon: UserCog, path: '/dashboard/admin/staff', section: 'Admin Registry' },
    { label: 'Patient Registry', icon: UserPlus, path: '/dashboard/receptionist/register', section: 'Clinical Operations' },
    { label: 'Appointments', icon: Calendar, path: '/dashboard/receptionist/appointments', section: 'Clinical Operations' },
    { label: 'Pharmacy Feed', icon: Pill, path: '/dashboard/pharmacy/dispense', section: 'Clinical Operations' },
    { label: 'Lab Terminal', icon: TestTube, path: '/dashboard/laboratory/orders', section: 'Diagnostics' },
    { label: 'Hospital Finance', icon: DollarSign, path: '/dashboard/accounts/invoices', section: 'Accounts' },
    { label: 'Audit & System', icon: ShieldAlert, path: '/dashboard/admin/audit', section: 'System' },
    { label: 'Hospital Settings', icon: Settings, path: '/dashboard/admin/settings', section: 'System' },
    { label: 'Reports', icon: BarChart3, path: '/dashboard/admin/reports', section: 'Analytics' },
  ],
  doctor: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/doctor', section: 'Main' },
    { label: 'Appointments', icon: Calendar, path: '/dashboard/doctor/appointments', section: 'Clinical' },
    { label: 'My Patients', icon: Users, path: '/dashboard/doctor/patients', section: 'Clinical' },
  ],
  nurse: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/nurse', section: 'Main' },
    { label: 'Ward Directory', icon: Users, path: '/dashboard/nurse/patients', section: 'Clinical' },
    { label: 'Medication Chart', icon: Pill, path: '/dashboard/nurse/medications', section: 'Clinical' },
    { label: 'Ward Control', icon: BedDouble, path: '/dashboard/nurse/ward', section: 'Administrative' },
  ],
  receptionist: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/receptionist', section: 'Main' },
    { label: 'Patient Registry', icon: UserPlus, path: '/dashboard/receptionist/register', section: 'Front Desk' },
    { label: 'Appointments', icon: Calendar, path: '/dashboard/receptionist/appointments', section: 'Front Desk' },
    { label: "Today's Schedule", icon: Clock, path: '/dashboard/receptionist/schedule', section: 'Daily' },
  ],
  pharmacy: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/pharmacy', section: 'Main' },
    { label: 'Dispense Rx', icon: Pill, path: '/dashboard/pharmacy/dispense', section: 'Pharmacy' },
    { label: 'Inventory', icon: Package, path: '/dashboard/pharmacy/inventory', section: 'Stock' },
  ],
  laboratory: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/laboratory', section: 'Main' },
    { label: 'Test Orders', icon: TestTube, path: '/dashboard/laboratory/orders', section: 'Laboratory' },
    { label: 'Sample Collection', icon: Beaker, path: '/dashboard/laboratory/samples', section: 'Laboratory' },
    { label: 'Result Entry', icon: ClipboardEdit, path: '/dashboard/laboratory/results', section: 'Laboratory' },
    { label: 'Reports', icon: FileBarChart, path: '/dashboard/laboratory/reports', section: 'Analytics' },
    { label: 'Test Catalog', icon: Layers, path: '/dashboard/laboratory/catalog', section: 'Management' },
    { label: 'Lab Revenue', icon: DollarSign, path: '/dashboard/laboratory/revenue', section: 'Analytics' },
  ],
  accounts: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/accounts', section: 'Main' },
    { label: 'Invoicing', icon: Receipt, path: '/dashboard/accounts/invoices', section: 'Finance' },
    { label: 'Billing Reports', icon: BarChart3, path: '/dashboard/accounts/reports', section: 'Finance' },
  ],
  staff: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/receptionist', section: 'Main' },
    { label: 'Patient Registry', icon: UserPlus, path: '/dashboard/receptionist/register', section: 'Front Desk' },
    { label: 'Appointments', icon: Calendar, path: '/dashboard/receptionist/appointments', section: 'Front Desk' },
  ],
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role || 'admin'
  const navItems = NAV_CONFIG[role] || NAV_CONFIG.admin

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const sections = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-600/20">
            <Activity className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-800 leading-none">MedCare Pro</div>
            <div className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-1">Hospital System</div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden ml-auto p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-6">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-teal-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {profile?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800 truncate">{profile?.full_name || 'Staff User'}</div>
              <div className="text-[10px] font-bold text-teal-600 uppercase tracking-tighter">{role}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-6 pb-6 scrollbar-hide">
          {Object.entries(sections).map(([name, items]) => (
            <div key={name} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{name}</div>
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-teal-50 text-teal-700 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    "group-hover:text-teal-600"
                  )} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
