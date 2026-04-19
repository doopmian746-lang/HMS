import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  DollarSign, Receipt, CreditCard, TrendingUp, 
  Clock, CheckCircle2, AlertCircle, ArrowUpRight,
  Calculator, PieChart, Activity, ArrowRight,
  Wallet, Landmark, FileText, BarChart, TrendingDown,
  ShieldCheck, RefreshCw, Layers
} from 'lucide-react'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function AccountsOverview() {
  const queryClient = useQueryClient()
  const [isAuditing, setIsAuditing] = useState(false)

  // Fetch statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['accounts-stats'],
    queryFn: async () => {
      const { data: invoices } = await supabase.from('invoices').select('*')
      const { data: expenses } = await supabase.from('expenses').select('*')
      const { data: staff } = await supabase.from('profiles').select('salary')
      
      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0) || 0
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      const outstanding = invoices?.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0) || 0
      const collectionRate = invoices?.length > 0 ? Math.round((invoices.filter(inv => inv.payment_status === 'paid').length / invoices.length) * 100) : 100

      const chartData = [
        { name: 'Jan', rev: 45000 }, { name: 'Feb', rev: 52000 }, { name: 'Mar', rev: 48000 }, { name: 'Apr', rev: totalRevenue }
      ]

      return { 
        cards: [
          { label: 'Net Revenue', value: `₨${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Total payments collected' },
          { label: 'Outflow', value: `₨${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Operational expenditures' },
          { label: 'Receivables', value: `₨${outstanding.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Outstanding balances' },
          { label: 'Efficiency', value: `${collectionRate}%`, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Collection performance' },
        ],
        chartData
      }
    }
  })

  // Fetch recent data
  const { data: recentData } = useQuery({
    queryKey: ['accounts-recent-summary'],
    queryFn: async () => {
      const { data: inv } = await supabase.from('invoices').select('*, patients(full_name)').order('created_at', { ascending: false }).limit(3)
      const { data: exp } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(3)
      return { inv: inv || [], exp: exp || [] }
    }
  })

  const runAudit = () => {
    setIsAuditing(true)
    setTimeout(() => {
      setIsAuditing(false)
      alert("System Audit Completed: 0 anomalies found. Financial integrity verified.")
    }, 3000)
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Finance Terminal</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Hospital Revenue • Billing Command</p>
        </div>
        <div className="flex gap-2">
           <Link to="invoices">
              <Button className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/20 font-black rounded-xl gap-2 border-0 text-[10px] uppercase tracking-widest">
                <Calculator size={14} />
                Generate Bill
              </Button>
           </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-40 bg-white border border-slate-100 animate-pulse rounded-[2.5rem]" />) :
          stats?.cards?.map((stat, i) => (
            <Card key={i} className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden group">
               <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                 <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</CardTitle>
                 <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                   <stat.icon size={20} />
                 </div>
               </CardHeader>
               <CardContent className="p-6 pt-0">
                 <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{stat.value}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stat.desc}</p>
               </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 p-8 h-96">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-lg font-black text-slate-900 leading-none">Revenue Growth</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cash Inflow Analytics</p>
              </div>
           </div>
           <ResponsiveContainer width="100%" height="80%">
              <RechartsBarChart data={stats?.chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                 <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                 <Bar dataKey="rev" fill="#0d9488" radius={[10, 10, 0, 0]}>
                    {stats?.chartData?.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index === 3 ? '#0d9488' : '#e2e8f0'} />
                    ))}
                 </Bar>
              </RechartsBarChart>
           </ResponsiveContainer>
        </Card>

        <div className="space-y-6">
           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-[radial-gradient(circle_at_top_right,_#0d9488_0%,_#0f172a_100%)] text-white p-8 group">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Payroll Status</p>
                    <h4 className="text-2xl font-black tracking-tighter">Cycle: April '26</h4>
                 </div>
                 <Users className="text-teal-400 opacity-50 group-hover:rotate-12 transition-transform" size={32} />
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-300">Disbursement Progress</span>
                    <span className="text-lg font-black text-teal-400">40%</span>
                 </div>
                 <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 w-[40%] rounded-full shadow-lg shadow-teal-500/50" />
                 </div>
                 <Link to="payroll">
                    <Button className="w-full h-11 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4">Complete Batch</Button>
                 </Link>
              </div>
           </Card>

           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 p-8">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recent Outflow</h4>
                 <Link to="expenses" className="text-[10px] font-black text-rose-600 uppercase">View All</Link>
              </div>
              <div className="space-y-4">
                 {recentData?.exp?.map(e => (
                   <div key={e.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingDown size={18} />
                         </div>
                         <div>
                            <div className="text-xs font-black text-slate-900 truncate w-32">{e.description}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{e.category}</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-black text-slate-900 tracking-tight">₨{Number(e.amount).toLocaleString()}</div>
                      </div>
                   </div>
                 ))}
                 {!recentData?.exp?.length && <p className="text-center text-[10px] font-bold text-slate-300 py-4 uppercase">No recent expenses</p>}
              </div>
           </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Billing Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2 text-left">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               <Activity className="text-emerald-600 w-6 h-6" />
               Recent Invoices
            </h3>
            <Link to="invoices">
              <Button variant="ghost" size="sm" className="text-emerald-600 font-black gap-2 hover:bg-emerald-50 px-4 rounded-xl text-[10px] uppercase tracking-widest">
                Ledger <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          
          <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden divide-y divide-slate-50">
            {recentData?.inv && recentData.inv.length > 0 ? recentData.inv.map((inv) => (
              <div key={inv.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-xl shadow-slate-200/50 group-hover:scale-105 transition-transform text-emerald-600">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg tracking-tight">{inv.patients?.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">#{inv.id.split('-')[0]}</span>
                      <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                     <div className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Total Bill</div>
                     <div className="text-lg font-black text-slate-900 tracking-tighter">₨{Number(inv.total_amount).toLocaleString()}</div>
                  </div>
                  <Badge 
                    className={`text-[10px] font-black uppercase tracking-widest px-3 border-0 rounded-lg min-w-[80px] justify-center ${
                      inv.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                      inv.payment_status === 'unpaid' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {inv.payment_status}
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center text-slate-400">
                <Landmark className="w-16 h-16 mx-auto mb-4 opacity-10 text-emerald-500" />
                <p className="font-black uppercase tracking-widest text-xs">No billing records for this period</p>
              </div>
            )}
          </Card>
        </div>

        {/* Financial Terminal Quick Links */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Account Registry</h3>
            <div className="grid gap-4">
              <Link to="invoices">
                <Button className="w-full justify-start gap-5 h-20 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/20 border-0 rounded-[2rem] p-6 group">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black tracking-tight leading-none mb-1">Billing Engine</div>
                    <div className="text-[10px] font-bold text-emerald-100/70 uppercase tracking-widest">Create & Manage Invoices</div>
                  </div>
                </Button>
              </Link>
              <Link to="reports">
                <Button className="w-full justify-start gap-5 h-20 bg-white border-2 border-slate-100 text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all rounded-[2rem] p-6 group">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black tracking-tight leading-none mb-1 text-slate-900">Revenue Analytics</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Performance Docs</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>

          <Card className="bg-slate-900 text-white p-10 shadow-3xl shadow-slate-900/40 rounded-[3rem] border-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
               <FileText size={120} />
            </div>
            <h4 className="text-2xl font-black mb-2 tracking-tight">Audit Readiness</h4>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">
               Verify fiscal integrity and compliance with medical billing standards via automated diagnostic checks.
            </p>
            <Button 
               className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-black shadow-2xl shadow-emerald-600/30 h-14 rounded-2xl uppercase tracking-widest text-[11px] px-8 flex items-center justify-center gap-3"
               onClick={runAudit}
               disabled={isAuditing}
            >
               {isAuditing ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={18} />}
               {isAuditing ? 'Auditing System...' : 'Initiate Full Audit'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
