import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Users, Calendar, Clock, ClipboardList, 
  Stethoscope, Pill, FlaskConical, ArrowRight,
  TrendingUp, CheckCircle2, Banknote, AlertTriangle, ExternalLink
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { Link } from 'react-router-dom'

export default function DoctorOverview() {
  const { profile } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's summary stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['doctor-stats', profile?.id],
    queryFn: async () => {
      const [appointments, patientRecords, earnings, referrals, allergies] = await Promise.all([
        supabase.from('appointments').select('*').eq('date', today).eq('doctor_id', profile.id),
        supabase.from('medical_records').select('*', { count: 'exact', head: true }).eq('doctor_id', profile.id),
        supabase.from('doctor_earnings').select('*').eq('doctor_id', profile.id),
        supabase.from('referrals').select('*, patients(full_name)').eq('from_doctor_id', profile.id),
        supabase.from('patient_allergies').select('*, patients(full_name)')
      ])

      // Fallback for patient count if RPC is missing
      let patientsSeenCount = 0
      try {
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        const { count } = await supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', profile.id)
          .gte('visit_date', lastWeek.toISOString().split('T')[0])
        patientsSeenCount = count || 0
      } catch (e) { console.error(e) }

      const scheduled = appointments.data?.filter(a => a.status === 'scheduled').length || 0
      const completed = appointments.data?.filter(a => a.status === 'completed').length || 0
      
      const totalEarnings = earnings.data?.reduce((sum, e) => sum + Number(e.consultation_fee), 0) || 0
      
      const chartData = [
        { name: 'Nov', amount: 45000 },
        { name: 'Dec', amount: 52000 },
        { name: 'Jan', amount: 48000 },
        { name: 'Feb', amount: 61000 },
        { name: 'Mar', amount: 55000 },
        { name: 'Apr', amount: totalEarnings }
      ]

      return {
        cards: [
          { label: "Today's Appts", value: appointments.data?.length || 0, icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Waitlist', value: scheduled, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'My Earnings', value: `₨${totalEarnings.toLocaleString()}`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Seen (7d)', value: patientsSeenCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        ],
        referrals: referrals.data || [],
        allergies: allergies.data || [],
        chartData
      }
    },
    enabled: !!profile?.id
  })

  // Fetch today's schedule
  const { data: schedule } = useQuery({
    queryKey: ['doctor-schedule', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select(`*, patients(full_name, gender, date_of_birth, registration_no)`)
        .eq('date', today)
        .eq('doctor_id', profile.id)
        .order('time_slot', { ascending: true })
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
                  <stat.icon size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                {stat.label === 'My Earnings' && (
                  <button className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-2 flex items-center gap-1 opacity-70 hover:opacity-100">
                    View Details <ArrowRight size={10} />
                  </button>
                )}
              </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Appointments Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-teal-600 rounded-full" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Today's Queue</h3>
            </div>
            <Link to="appointments">
              <Button variant="ghost" size="sm" className="text-teal-600 font-bold gap-1">
                Full Schedule <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl divide-y divide-slate-100 overflow-hidden ring-1 ring-slate-100">
            {schedule?.length > 0 ? schedule.map((apt) => (
              <div key={apt.id} className="p-5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Slot</span>
                    <span className="text-xs font-black text-slate-900 uppercase">{apt.time_slot}</span>
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg tracking-tight">{apt.patients?.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       {apt.patients?.registration_no} 
                       <span className="h-1 w-1 rounded-full bg-slate-300" />
                       {apt.patients?.gender}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={apt.status === 'completed' ? 'success' : 'secondary'}
                    className="text-[10px] font-bold px-3 py-1 border-0"
                  >
                    {apt.status}
                  </Badge>
                  {apt.status === 'scheduled' && (
                    <Link to={`consultation/${apt.id}`}>
                      <Button size="sm" className="bg-slate-900 text-white hover:bg-teal-600 border-0 shadow-lg shadow-slate-900/10 h-10 px-5 font-bold rounded-xl">
                        Start Visit
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-20 text-center bg-slate-50/50">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-medium">Your schedule is clear for today.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions & Practice Trends */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 px-1 tracking-tight uppercase tracking-widest text-[11px] text-slate-400">Clinical Tools</h3>
            <div className="grid gap-3">
              <Link to="patients" className="w-full">
                <Button className="w-full justify-start gap-4 h-14 bg-white border-2 border-slate-100 text-slate-900 hover:border-teal-600 group transition-all rounded-2xl">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Users size={18} />
                  </div>
                  <span className="font-bold">Patient Directory</span>
                </Button>
              </Link>
              <Link to="lab-results" className="w-full">
                <Button className="w-full justify-start gap-4 h-14 bg-white border-2 border-slate-100 text-slate-900 hover:border-teal-600 group transition-all rounded-2xl">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FlaskConical size={18} />
                  </div>
                  <span className="font-bold">Diagnostic Inbox</span>
                </Button>
              </Link>
            </div>
          </div>

          <Card className="bg-slate-900 text-white p-8 shadow-2xl shadow-slate-900/30 rounded-[2rem] border-0 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
              <TrendingUp size={120} />
            </div>
            <h4 className="text-2xl font-black mb-3 tracking-tight">Active Duty</h4>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed font-medium">
              You have completed **80%** of your daily visits. Keep going!
            </p>
            <Button className="w-full bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-xl shadow-teal-600/20 h-12 font-bold rounded-xl">
              Sync Clinical Data
            </Button>
          </Card>

          {/* Active Referrals */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Referrals</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-50">
              {stats?.referrals?.length > 0 ? stats.referrals.map(ref => (
                <div key={ref.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-800">{ref.patients?.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{ref.to_department}</p>
                  </div>
                  <Badge variant={ref.urgency === 'urgent' ? 'destructive' : 'secondary'} className="text-[8px] font-black uppercase border-0">
                    {ref.urgency}
                  </Badge>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium italic">No active referrals</div>
              )}
            </CardContent>
          </Card>

          {/* Allergy Alerts */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="bg-rose-50 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <CardTitle className="text-xs font-black text-rose-600 uppercase tracking-widest">Patient Allergies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-50">
              {stats?.allergies?.length > 0 ? stats.allergies.map(ale => (
                <div key={ale.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-800">{ale.patients?.full_name}</p>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight">{ale.allergen}</p>
                  </div>
                  <Badge className={`text-[8px] font-black uppercase border-0 ${
                    ale.severity === 'severe' ? 'bg-rose-100 text-rose-700' : 
                    ale.severity === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ale.severity}
                  </Badge>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium italic">No recorded allergies</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Earnings Summary Chart */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2rem] ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Consultation Revenue Summary</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Earnings breakdown over the last 6 months</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white border-slate-200 text-slate-600 font-black text-[10px] uppercase h-8 px-4 rounded-xl shadow-sm">
              <TrendingUp className="w-3 h-3 mr-2 text-teal-600" /> +12.5% Growth
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                fontSize={10} 
                fontWeight="black" 
                tick={{ fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                fontSize={10} 
                fontWeight="black" 
                tick={{ fill: '#94a3b8' }}
                tickFormatter={(val) => `₨${val/1000}k`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                itemStyle={{ fontWeight: 'black', color: '#0d9488' }}
                labelStyle={{ fontWeight: 'black', color: '#64748b', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
              />
              <Bar dataKey="amount" fill="#0d9488" radius={[8, 8, 0, 0]} barSize={40}>
                {stats?.chartData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 5 ? '#0d9488' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
