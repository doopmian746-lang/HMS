import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Users, BedDouble, Activity, ClipboardList, 
  Heart, Thermometer, Droplets, ArrowRight,
  Clock, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function NurseOverview() {
  const { profile } = useAuth()

  // Fetch statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['nurse-stats', profile?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const [wardPatients, vitalsToday] = await Promise.all([
        supabase
          .from('ward_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_nurse_id', profile.id)
          .is('discharged_at', null),
        supabase
          .from('vital_signs')
          .select('*', { count: 'exact', head: true })
          .eq('nurse_id', profile.id)
          .gte('recorded_at', today)
      ])

      return [
        { label: 'My Ward Patients', value: wardPatients.count || 0, icon: BedDouble, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Vitals Recorded (Today)', value: vitalsToday.count || 0, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'Pending Meds', value: 8, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' }, 
        { label: 'Active Alerts', value: 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
      ]
    },
    enabled: !!profile?.id
  })

  // Fetch recent vitals recorded by this nurse
  const { data: recentVitals } = useQuery({
    queryKey: ['recent-vitals-nurse', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('vital_signs')
        .select(`*, patients(full_name)`)
        .eq('nurse_id', profile.id)
        .order('recorded_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!profile?.id
  })

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />) :
          stats?.map((stat, i) => (
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
        {/* Recent Vitals Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-rose-600 rounded-full" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h3>
            </div>
            <Link to="patients">
              <Button variant="ghost" size="sm" className="text-rose-600 font-bold gap-1">
                Ward Directory <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white ring-1 ring-slate-100">
            {recentVitals?.length > 0 ? recentVitals.map((v) => (
              <div key={v.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-rose-50 rounded-xl">
                    <Heart className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg tracking-tight">{v.patients?.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       <Clock size={12} className="text-slate-300" /> {new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temp</div>
                     <div className="text-sm font-black text-slate-700">{v.temperature}°C</div>
                  </div>
                  <div className="text-center">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BP</div>
                     <div className="text-sm font-black text-slate-700">{v.blood_pressure}</div>
                  </div>
                   <div className="text-center">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SPO2</div>
                     <div className="text-sm font-black text-teal-600">{v.oxygen_saturation}%</div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center bg-slate-50/50">
                <Activity className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-medium">No vitals recorded in your shift yet.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Nurse Actions */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 px-1 tracking-tight uppercase tracking-widest text-[11px] text-slate-400">Nurse Station</h3>
            <div className="grid gap-3">
              <Link to="patients">
                <Button className="w-full justify-start gap-4 h-14 bg-white border-2 border-slate-100 text-slate-900 hover:border-rose-600 group transition-all rounded-2xl shadow-none font-bold">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Thermometer size={18} />
                  </div>
                  Record Vitals
                </Button>
              </Link>
              <Link to="medications">
                <Button className="w-full justify-start gap-4 h-14 bg-white border-2 border-slate-100 text-slate-900 hover:border-teal-600 group transition-all rounded-2xl shadow-none font-bold">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Droplets size={18} />
                  </div>
                  Medication Chart
                </Button>
              </Link>
              <Link to="ward">
                <Button className="w-full justify-start gap-4 h-14 bg-white border-2 border-slate-100 text-slate-900 hover:border-amber-600 group transition-all rounded-2xl shadow-none font-bold">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <BedDouble size={18} />
                  </div>
                  Ward Transfer
                </Button>
              </Link>
            </div>
          </div>

          <Card className="bg-slate-900 text-white p-8 shadow-2xl shadow-slate-900/30 rounded-[2rem] border-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
               <Activity size={120} />
            </div>
            <h4 className="text-2xl font-black mb-3 tracking-tight">Active Shift</h4>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed font-medium">
              Monitor and update care plan for your assigned ward patients.
            </p>
            <Button className="w-full bg-rose-600 hover:bg-rose-500 text-white border-0 font-bold shadow-rose-600/20 shadow-lg h-12 rounded-xl">
              Download Handover
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
