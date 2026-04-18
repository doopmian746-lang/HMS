import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Users, UserPlus, Calendar, Search, 
  Clock, ArrowRight, UserCheck, CheckCircle2,
  PhoneCall, ClipboardSignature, UserMinus
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ReceptionOverview() {
  const today = new Date().toISOString().split('T')[0]

  // Fetch registrations and appointments for today
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['reception-dashboard', today],
    queryFn: async () => {
      const [registrations, appointments] = await Promise.all([
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today),
        supabase
          .from('appointments')
          .select(`*, patients(full_name, registration_no), profiles(full_name, department)`)
          .eq('date', today)
      ])

      const scheduled = appointments.data?.filter(a => a.status === 'scheduled') || []
      const arrived = appointments.data?.filter(a => a.status === 'completed') || []
      const cancelled = appointments.data?.filter(a => a.status === 'cancelled') || []

      // Filter upcoming arrivals (next 4 hours)
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      const upcoming = scheduled
        .filter(a => a.time_slot >= nowTime)
        .sort((a,b) => a.time_slot.localeCompare(b.time_slot))
        .slice(0, 5)

      return {
        stats: [
          { label: 'New Patients', value: registrations.count || 0, icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: "Total Booked", value: appointments.data?.length || 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Cancelled Today', value: cancelled.length, icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Arrived/Done', value: arrived.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ],
        upcoming
      }
    }
  })

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />) :
          dashboardData?.stats?.map((stat, i) => (
            <Card key={i} className="border-0 shadow-lg shadow-slate-200/40 rounded-2xl ring-1 ring-slate-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</CardTitle>
                <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                  <stat.icon size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Live Appointment Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-indigo-600 rounded-full" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Upcoming Arrivals</h3>
            </div>
            <Link to="appointments">
              <Button variant="ghost" size="sm" className="text-indigo-600 font-bold gap-1">
                Full Schedule <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white ring-1 ring-slate-100">
            {dashboardData?.upcoming?.length > 0 ? dashboardData.upcoming.map((a) => (
              <div key={a.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-xl flex flex-col items-center justify-center border border-indigo-100 shadow-sm">
                    <span className="text-[9px] font-black uppercase opacity-60 leading-none mb-0.5">Time</span>
                    <span className="text-sm font-black tracking-tight">{a.time_slot}</span>
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg tracking-tight">{a.patients?.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       <code className="text-indigo-500">{a.patients?.registration_no}</code> • 
                       <span className="flex items-center gap-1"> Dr. {a.profiles?.full_name} </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-slate-100 text-slate-500 border-0 font-black text-[10px] uppercase tracking-widest px-3">
                    Scheduled
                  </Badge>
                  <Link to="appointments">
                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 font-bold text-xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all">
                      Check-In
                    </Button>
                  </Link>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center bg-slate-50/50">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-medium">No more scheduled arrivals for next 4 hours.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Reception Actions */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Front Desk Terminal</h3>
            <div className="grid gap-3">
              <Link to="register">
                <Button className="w-full justify-start gap-4 h-14 bg-white border-2 border-slate-100 text-slate-900 hover:border-indigo-600 group transition-all rounded-2xl shadow-none font-bold">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <UserPlus size={18} />
                  </div>
                  Patient Registry
                </Button>
              </Link>
              <Link to="appointments">
                <Button className="w-full justify-start gap-4 h-14 bg-white border-2 border-slate-100 text-slate-900 hover:border-emerald-600 group transition-all rounded-2xl shadow-none font-bold">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Calendar size={18} />
                  </div>
                  Visit Booking
                </Button>
              </Link>
              <Link to="schedule">
                <Button className="w-full justify-start gap-4 h-14 bg-white border-2 border-slate-100 text-slate-900 hover:border-rose-600 group transition-all rounded-2xl shadow-none font-bold">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Clock size={18} />
                  </div>
                  Daily Schedule
                </Button>
              </Link>
            </div>
          </div>

          <Card className="bg-slate-900 text-white p-8 shadow-2xl shadow-slate-900/30 rounded-[2rem] border-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
               <PhoneCall size={120} />
            </div>
            <h4 className="text-2xl font-black mb-3 tracking-tight">Facility Notice</h4>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed font-medium">
              Monitor peak hour traffic. Ensure all wait-times are communicated clearly to patients arriving after 4:00 PM.
            </p>
            <Link to="schedule">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 font-bold shadow-indigo-600/20 shadow-lg h-12 rounded-xl">
                Launch Live Schedule
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
