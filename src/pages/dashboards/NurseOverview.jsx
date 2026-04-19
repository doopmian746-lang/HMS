import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Users, BedDouble, Activity, ClipboardList, 
  Heart, Thermometer, Droplets, ArrowRight,
  Clock, AlertTriangle, Pill, CheckCircle2, Siren
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function NurseOverview() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  // Fetch statistics
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const [wardPatients, vitalsToday, triage, pendingMeds] = await Promise.all([
        supabase.from('ward_assignments').select('*', { count: 'exact', head: true }).is('discharged_at', null),
        supabase.from('vital_signs').select('*', { count: 'exact', head: true }).gte('recorded_at', today),
        supabase.from('triage').select('*').eq('status', 'waiting').order('priority_score', { ascending: false }),
        supabase.from('medication_log').select('*').eq('status', 'pending').gte('scheduled_time', today)
      ])

      const criticalTriage = triage.data?.filter(t => t.priority === 'critical').length || 0

      return {
        cards: [
          { label: 'Active Ward Beds', value: wardPatients.count || 24, icon: BedDouble, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Vitals Recorded', value: vitalsToday.count || 0, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Pending Meds', value: pendingMeds.data?.length || 0, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' }, 
          { label: 'Critical Triage', value: criticalTriage, icon: Siren, color: 'text-red-600', bg: 'bg-red-50' },
        ],
        triage: triage.data || [],
        meds: pendingMeds.data || []
      }
    },
    enabled: !!profile?.id
  })

  const markMedGiven = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('medication_log')
        .update({ status: 'given', given_at: new Date().toISOString(), nurse_id: profile.id })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['nurse-stats'])
    }
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
          stats?.cards?.map((stat, i) => (
            <Card key={i} className="border-0 shadow-lg shadow-slate-200/40 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</CardTitle>
                <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                  <stat.icon size={16} className={stat.label === 'Critical Triage' ? 'animate-pulse' : ''} />
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
          
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white ring-1 ring-slate-100 mb-8">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Medication Queue (Upcoming)</CardTitle>
            </CardHeader>
            {stats?.meds?.length > 0 ? stats.meds.slice(0, 5).map((med) => (
              <div key={med.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{med.scheduled_time.split('T')[1].substring(0, 5)}</div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{med.medication_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{med.route} • {med.dosage}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50 font-black uppercase text-[10px] tracking-widest h-9"
                  onClick={() => markMedGiven.mutate(med.id)}
                >
                  Confirm Dose
                </Button>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic text-sm">No pending medications for your ward.</div>
            )}
          </Card>

          <div className="flex items-center gap-2 px-1 mb-4">
             <div className="w-2 h-6 bg-amber-500 rounded-full" />
             <h3 className="text-xl font-black text-slate-800 tracking-tight">Triage Priority Queue</h3>
          </div>
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden ring-1 ring-slate-100 bg-white">
             {stats?.triage?.length > 0 ? stats.triage.map((t) => (
               <div key={t.id} className="p-5 flex items-center justify-between border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full ${t.priority === 'critical' ? 'bg-rose-500 animate-ping' : t.priority === 'urgent' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                     <div>
                        <p className="font-black text-slate-800">{t.patient_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score: {t.priority_score}</p>
                     </div>
                  </div>
                  <Badge variant={t.priority === 'critical' ? 'destructive' : t.priority === 'urgent' ? 'warning' : 'success'} className="border-0 uppercase text-[9px] font-black">
                     {t.priority}
                  </Badge>
                  <Link to="/dashboard/nurse/vitals">
                    <Button variant="ghost" className="text-teal-600 font-black uppercase text-[10px] tracking-widest">Start Vitals</Button>
                  </Link>
               </div>
             )) : (
               <div className="p-12 text-center text-slate-400 italic text-sm">Waiting for incoming triage cases...</div>
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
