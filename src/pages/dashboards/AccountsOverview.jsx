import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  DollarSign, Receipt, CreditCard, TrendingUp, 
  Clock, CheckCircle2, AlertCircle, ArrowUpRight,
  Calculator, PieChart, Activity, ArrowRight,
  Wallet, Landmark, FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AccountsOverview() {
  // Fetch statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['accounts-stats'],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount, payment_status')
      
      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0) || 0
      const outstanding = invoices?.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0) || 0
      const unpaidCount = invoices?.filter(inv => inv.payment_status === 'unpaid').length || 0
      const collectionRate = invoices?.length > 0 
        ? Math.round((invoices.filter(inv => inv.payment_status === 'paid').length / invoices.length) * 100) 
        : 100

      return [
        { label: 'Net Revenue', value: `₨${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Total payments collected' },
        { label: 'Accounts Receivable', value: `₨${outstanding.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Outstanding balances' },
        { label: 'Unpaid Invoices', value: unpaidCount, icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Pending collection' },
        { label: 'Efficiency', value: `${collectionRate}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Invoice collection rate' },
      ]
    }
  })

  // Fetch recent invoices
  const { data: recentInvoices } = useQuery({
    queryKey: ['recent-invoices-summary'],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select(`*, patients(full_name, registration_no)`)
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    }
  })

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
          stats?.map((stat, i) => (
            <Card key={i} className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</CardTitle>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{stat.value}</div>
                <div className="flex items-center gap-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Billing Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               <Activity className="text-emerald-600 w-6 h-6" />
               Recent Billing Activity
            </h3>
            <Link to="invoices">
              <Button variant="ghost" size="sm" className="text-emerald-600 font-black gap-2 hover:bg-emerald-50 px-4 rounded-xl text-[10px] uppercase tracking-widest">
                Full Ledger <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          
          <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden divide-y divide-slate-50">
            {recentInvoices && recentInvoices.length > 0 ? recentInvoices.map((inv) => (
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

          <Card className="bg-slate-900 text-white p-10 shadow-3xl shadow-slate-900/40 rounded-[2.5rem] border-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
               <FileText size={120} />
            </div>
            <h4 className="text-2xl font-black mb-2 tracking-tight">Audit Readiness</h4>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">
              Every invoice is locked after final payment. Financial logs are immutable to ensure compliance with medical billing standards.
            </p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-black shadow-2xl shadow-emerald-600/30 h-14 rounded-2xl uppercase tracking-widest text-[11px] px-8">
              Verify Digital Records
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
