import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { 
  DollarSign, TrendingUp, CreditCard, 
  Wallet, PieChart, ArrowUpRight,
  TrendingDown, Calendar as CalendarIcon,
  FlaskConical, ClipboardList, Activity
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

export default function LaboratoryRevenue() {
  // Fetch Revenue Data
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['lab-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_revenue')
        .select('*, patients(full_name)')
        .order('collected_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Calculate Stats
  const totalRevenue = revenue?.reduce((acc, curr) => acc + (curr.payment_status === 'paid' ? curr.amount : 0), 0) || 0
  const pendingRevenue = revenue?.reduce((acc, curr) => acc + (curr.payment_status === 'pending' ? curr.amount : 0), 0) || 0
  
  // Group by Test Name for Chart
  const testDistribution = revenue?.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.test_name)
    if (existing) existing.value += 1
    else acc.push({ name: curr.test_name, value: 1 })
    return acc
  }, []) || []

  const chartData = [
    { name: 'Mon', revenue: 4500 },
    { name: 'Tue', revenue: 5200 },
    { name: 'Wed', revenue: 4800 },
    { name: 'Thu', revenue: 6100 },
    { name: 'Fri', revenue: 5900 },
    { name: 'Sat', revenue: 3200 },
    { name: 'Sun', revenue: 2800 },
  ]

  const COLORS = ['#0d9488', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Financial Performance</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Laboratory Economic Matrix • Revenue Analytics</p>
        </div>
        <div className="flex gap-2">
           <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl">
              Live Audit Active
           </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Cumulative Revenue', value: `₨ ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Awaiting Settlement', value: `₨ ${pendingRevenue.toLocaleString()}`, icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Analysis Volume', value: revenue?.length || 0, icon: FlaskConical, color: 'text-teal-500', bg: 'bg-teal-50' },
          { label: 'Avg Ticket Size', value: `₨ ${(totalRevenue / (revenue?.length || 1)).toFixed(0)}`, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 p-8 text-left transition-transform hover:scale-[1.02]">
             <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                <stat.icon size={24} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
             <h3 className="text-2xl font-black text-slate-900 leading-none">{stat.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
         {/* Revenue Trend */}
         <Card className="lg:col-span-2 border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 p-10">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <TrendingUp className="text-teal-600" /> Weekly Capital Inflow
               </h3>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 italic">PKR - Global Local Currency</div>
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                     <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                        itemStyle={{fontWeight: 900, fontSize: '12px', color: '#0d9488'}}
                        labelStyle={{fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', color: '#64748b'}}
                     />
                     <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </Card>

         {/* Distribution */}
         <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 p-10">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <PieChart className="text-indigo-600" /> Demand Matrix
            </h3>
            <div className="space-y-6">
               {testDistribution.slice(0, 5).map((item, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                       <span className="text-sm font-black text-slate-900">{item.value} Units</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full rounded-full" style={{ width: `${(item.value / revenue.length) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                 </div>
               ))}
            </div>
         </Card>

         {/* Ledger */}
         <Card className="lg:col-span-3 border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-900">Transaction Ledger</h3>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto text-left">
                  <table className="w-full">
                     <thead className="bg-slate-50/50">
                        <tr>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Entity Identity</th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Diagnostic Scope</th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital Transfer</th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right pr-12">Protocol Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 text-left">
                        {isLoading ? [1,2,3].map(i => <tr key={i}><td colSpan={4} className="h-20 animate-pulse" /></tr>) :
                         revenue?.map(item => (
                           <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6">
                                 <div className="font-black text-slate-900">{item.patients?.full_name}</div>
                                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">#{item.id.split('-')[0].toUpperCase()}</div>
                              </td>
                              <td className="px-10 py-6">
                                 <Badge className="bg-white text-teal-600 border border-teal-100 font-black text-[9px] uppercase tracking-widest">{item.test_name}</Badge>
                              </td>
                              <td className="px-10 py-6 font-black text-slate-900">₨ {item.amount}</td>
                              <td className="px-10 py-6 text-right pr-12">
                                 <Badge className={`font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl ${item.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {item.payment_status}
                                 </Badge>
                              </td>
                           </tr>
                         ))}
                     </tbody>
                  </table>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
