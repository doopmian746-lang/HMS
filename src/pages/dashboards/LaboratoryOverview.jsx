import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { 
  Activity, Beaker, CheckCircle2, AlertOctagon, 
  Clock, AlertTriangle, Search, Filter,
  ArrowRight, FileText, TrendingUp, RefreshCw,
  FlaskConical, ClipboardList
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Link } from 'react-router-dom'

export default function LaboratoryOverview() {
  // Fetch stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['lab-dashboard-stats'],
    queryFn: async () => {
      const { data: orders } = await supabase.from('lab_orders').select('status')
      const { data: results } = await supabase.from('lab_results').select('is_critical')
      const { data: samples } = await supabase.from('lab_samples').select('status')

      const pendingCount = orders?.filter(o => o.status === 'pending').length || 0
      const processingCount = orders?.filter(o => o.status === 'processing').length || 0
      const criticalCount = results?.filter(r => r.is_critical).length || 0
      const collectedToday = samples?.filter(s => s.status === 'collected').length || 0

      return [
        { label: 'Pending Orders', value: pendingCount, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Tests awaiting approval' },
        { label: 'Processing', value: processingCount, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Tests currently in lab' },
        { label: 'Critical Results', value: criticalCount, icon: AlertOctagon, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Results requiring urgent action' },
        { label: 'Samples Collected', value: collectedToday, icon: Beaker, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Successfully collected today' },
      ]
    }
  })

  // Fetch critical results
  const { data: criticalFeed } = useQuery({
    queryKey: ['lab-critical-feed'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lab_results')
        .select(`*, lab_orders(patient_id, test_name), patients:lab_orders(patients(full_name))`)
        .eq('is_critical', true)
        .order('created_at', { ascending: false })
        .limit(3)
      return data || []
    }
  })

  // Fetch recent orders
  const { data: orders } = useQuery({
    queryKey: ['lab-recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lab_orders')
        .select(`*, patients(full_name, registration_no)`)
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    }
  })

  const workloadData = [
    { name: 'Hematology', val: 45 },
    { name: 'Biochem', val: 62 },
    { name: 'Micro', val: 24 },
    { name: 'Urinalysis', val: 38 },
  ]
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Laboratory Command</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
             <FlaskConical className="w-4 h-4 text-teal-600" /> Molecular & Diagnostic Infrastructure
          </p>
        </div>
        <div className="flex gap-2">
           <Link to="orders">
              <Button className="h-11 px-6 bg-teal-600 hover:bg-teal-700 text-white shadow-2xl shadow-teal-600/20 font-black rounded-xl gap-2 border-0 text-[10px] uppercase tracking-widest">
                <Plus size={14} /> Accept New Orders
              </Button>
           </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-40 bg-white border border-slate-100 animate-pulse rounded-[2rem]" />) :
          stats?.map((stat, i) => (
            <Card key={i} className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden group">
               <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                 <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</CardTitle>
                 <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                   <stat.icon size={20} />
                 </div>
               </CardHeader>
               <CardContent className="p-6 pt-0 text-left">
                 <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{stat.value}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stat.desc}</p>
               </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 p-8 h-96">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-lg font-black text-slate-900 leading-none">Resource Workload</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daily Test Throughput</p>
              </div>
              <Activity className="text-teal-600 opacity-20" size={32} />
           </div>
           <ResponsiveContainer width="100%" height="80%">
              <BarChart data={workloadData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                 <Tooltip cursor={{fill: '#f8fafc'}} />
                 <Bar dataKey="val" fill="#0d9488" radius={[10, 10, 0, 0]}>
                    {workloadData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index === 1 ? '#0d9488' : '#e2e8f0'} />
                    ))}
                 </Bar>
              </BarChart>
           </ResponsiveContainer>
        </Card>

        {/* Critical Results Alert */}
        <Card className="border-0 shadow-2xl shadow-rose-200/50 rounded-[3rem] bg-rose-600 text-white p-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <AlertTriangle size={80} />
           </div>
           <h3 className="text-xl font-black mb-6 tracking-tight relative z-10">Critical Alerts</h3>
           <div className="space-y-4 relative z-10">
              {criticalFeed?.length > 0 ? criticalFeed.map(r => (
                <div key={r.id} className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                   <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-sm">{r.patients?.full_name || 'Patient'}</span>
                      <Badge className="bg-white text-rose-600 font-black text-[9px]">STAT</Badge>
                   </div>
                   <p className="text-[10px] font-bold text-white/70 uppercase mb-2">{r.test_name}</p>
                   <div className="text-lg font-black text-rose-200 tracking-tighter">Value: {r.result_value}</div>
                </div>
              )) : (
                <div className="p-8 text-center text-white/30 font-black uppercase tracking-widest text-xs">No pending criticals</div>
              )}
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
           <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Activity className="text-teal-600 w-6 h-6" /> Recent Orders
                 </h3>
                 <Link to="orders">
                    <Button variant="ghost" className="text-teal-600 font-black uppercase text-[10px] tracking-widest gap-2">Full Registry <ArrowRight size={14} /></Button>
                 </Link>
              </div>
           </CardHeader>
           <CardContent className="p-0 text-left">
              <table className="w-full">
                 <thead className="bg-slate-50/50">
                    <tr>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Priority</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {orders?.map(o => (
                      <tr key={o.id} className="group hover:bg-slate-50/50 transition-colors">
                         <td className="px-8 py-4">
                            <div className="font-black text-slate-900">{o.patients?.full_name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">#{o.id.split('-')[0]}</div>
                         </td>
                         <td className="px-8 py-4 font-bold text-slate-700">{o.test_name}</td>
                         <td className="px-8 py-4 text-center">
                            <Badge className={`font-black text-[9px] uppercase px-3 ${o.priority === 'STAT' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{o.priority}</Badge>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </CardContent>
        </Card>

        <div className="space-y-6">
           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Workflow Hub</h4>
           <div className="grid gap-4">
              <Link to="samples">
                 <Button className="w-full h-20 bg-teal-600 text-white rounded-[2rem] border-0 p-6 flex justify-start items-center gap-4 hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 group">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Beaker className="w-6 h-6" /></div>
                    <div className="text-left">
                       <div className="font-black text-sm mb-1 leading-none">Sample Collection</div>
                       <div className="text-[10px] font-bold text-teal-100/70 uppercase tracking-widest leading-none">Phlebotomy Terminal</div>
                    </div>
                 </Button>
              </Link>
              <Link to="results">
                 <Button className="w-full h-20 bg-slate-900 text-white rounded-[2rem] border-0 p-6 flex justify-start items-center gap-4 hover:bg-black transition-all shadow-xl shadow-slate-900/20 group">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6" /></div>
                    <div className="text-left">
                       <div className="font-black text-sm mb-1 leading-none">Result Processing</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Diagnostic Entry</div>
                    </div>
                 </Button>
              </Link>
              <Link to="catalog">
                 <Button className="w-full h-20 bg-white text-slate-900 border-2 border-slate-100 rounded-[2rem] p-6 flex justify-start items-center gap-4 hover:border-teal-600 hover:bg-teal-50/30 transition-all group">
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><ClipboardList className="w-6 h-6" /></div>
                    <div className="text-left">
                       <div className="font-black text-sm mb-1 leading-none">Test Catalog</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Registry Optimization</div>
                    </div>
                 </Button>
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}
