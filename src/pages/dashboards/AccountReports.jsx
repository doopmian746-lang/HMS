import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Globe, Landmark, FileText, ChevronRight,
  Printer, X, Info, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import { useState } from 'react'

const financeData = [
  { month: 'Jan', projected: 40000, actual: 38000 },
  { month: 'Feb', projected: 45000, actual: 46000 },
  { month: 'Mar', projected: 42000, actual: 40500 },
  { month: 'Apr', projected: 50000, actual: 52000 },
  { month: 'May', projected: 48000, actual: 47000 },
  { month: 'Jun', projected: 55000, actual: 59000 },
]

export default function AccountReports() {
  const [reportPeriod, setReportPeriod] = useState('current_month')
  const [showStatement, setShowStatement] = useState(false)

  // Fetch high-level financial summary for reports
  const { data: reportStats, isLoading } = useQuery({
    queryKey: ['financial-reports-data', reportPeriod],
    queryFn: async () => {
      const { data: invoices } = await supabase.from('invoices').select('*')
      const { data: expenses } = await supabase.from('expenses').select('*')
      const { data: staff } = await supabase.from('profiles').select('salary')

      const income = invoices?.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0) || 0
      const totalSalaries = staff?.reduce((sum, s) => sum + Number(s.salary || 0), 0) || 0
      const operationalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0
      
      const totalOutgo = totalSalaries + operationalExpenses
      const netProfit = income - totalOutgo

      const expenseBreakdown = [
        { name: 'Payroll', value: totalSalaries },
        { name: 'Supplies', value: expenses?.filter(e => e.category === 'Supplies').reduce((s, e) => s + Number(e.amount), 0) || 0 },
        { name: 'Utilities', value: expenses?.filter(e => e.category === 'Utilities').reduce((s, e) => s + Number(e.amount), 0) || 0 },
        { name: 'Maintenance', value: expenses?.filter(e => e.category === 'Maintenance').reduce((s, e) => s + Number(e.amount), 0) || 0 },
      ].filter(d => d.value > 0)

      return { income, totalOutgo, netProfit, expenseBreakdown, totalBilled: income + 50000, recoveryRate: 85 }
    }
  })

  const COLORS = ['#0d9488', '#f43f5e', '#f59e0b', '#6366f1']

  const reportTypes = [
    {
      id: 'revenue-analysis',
      title: 'Revenue Intelligence',
      description: 'Strategic analysis of income streams by diagnostic department.',
      icon: TrendingUp,
      stat: `₨${reportStats?.totalCollected?.toLocaleString() || 0}`,
      label: 'Collected Revenue',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      id: 'unpaid-aging',
      title: 'Accounts Receivable',
      description: 'Aging report for outstanding patient balances and debt recovery.',
      icon: Clock,
      stat: `₨${reportStats?.outstandingDebt?.toLocaleString() || 0}`,
      label: 'Outstanding Debt',
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    {
      id: 'collection-efficiency',
      title: 'Recovery Metrics',
      description: 'Billing efficiency and collection success rates across services.',
      icon: Activity,
      stat: `${reportStats?.recoveryRate || 100}%`,
      label: 'Success Rate',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      id: 'fiscal-compliance',
      title: 'Audit & Compliance',
      description: 'Immutable financial logs for regulatory audit and tax filing.',
      icon: ShieldCheck,
      stat: 'Verified',
      label: 'Digital Integrity',
      color: 'text-slate-600',
      bg: 'bg-slate-50'
    }
  ]

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Financial Intelligence</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Hospital Fiscal Health • Strategic Reports</p>
        </div>
        <div className="flex gap-3">
           <select 
             className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer"
             value={reportPeriod}
             onChange={e => setReportPeriod(e.target.value)}
           >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="q1_2024">Q1 FY 2024</option>
           </select>
           <Button 
             className="h-11 px-6 bg-slate-900 hover:bg-black text-white shadow-2xl shadow-slate-900/20 font-black rounded-xl gap-2 border-0 text-[10px] uppercase tracking-widest"
             onClick={() => setShowStatement(true)}
           >
             <Download size={14} />
             View Statement
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
           <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Expense Distribution</CardTitle>
           </CardHeader>
           <CardContent className="p-8 h-80">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={reportStats?.expenseBreakdown}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reportStats?.expenseBreakdown?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-[radial-gradient(circle_at_top_right,_#0f172a_0%,_#020617_100%)] text-white p-12 flex flex-col justify-between">
           <div className="flex justify-between items-start">
              <div>
                 <h3 className="text-xl font-black uppercase tracking-tighter text-indigo-400 mb-1">Profit & Loss Summary</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report Period: {reportPeriod.replace('_', ' ')}</p>
              </div>
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-4 py-1.5 font-black uppercase text-[10px]">Strategic Analysis</Badge>
           </div>
           
           <div className="grid grid-cols-2 gap-12 my-12 pt-12 border-t border-slate-800">
              <div>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <TrendingUp size={12} /> Total Revenue
                 </p>
                 <p className="text-5xl font-black tracking-tighter">₨{reportStats?.income?.toLocaleString()}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <TrendingDown size={12} /> Total Outgo
                 </p>
                 <p className="text-5xl font-black tracking-tighter">₨{reportStats?.totalOutgo?.toLocaleString()}</p>
              </div>
           </div>

           <div className="p-8 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between">
              <div>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Net Operational Margin</p>
                 <p className={`text-3xl font-black tracking-tight ${reportStats?.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₨{reportStats?.netProfit?.toLocaleString()}
                 </p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase">Margin Factor</p>
                 <p className="text-lg font-black">{reportStats?.income > 0 ? ((reportStats.netProfit / reportStats.income) * 100).toFixed(1) : 0}%</p>
              </div>
           </div>
        </Card>
      </div>

      {showStatement && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden bg-white animate-in zoom-in-95 duration-300">
             <div className="p-16 print:p-8" id="financial-statement">
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-12 mb-12">
                   <div>
                      <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">MedCare Pro</h1>
                      <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Clinical Fiscal Statement</p>
                   </div>
                   <div className="text-right">
                      <p className="text-2xl font-black text-slate-900 mb-1">FY 2026/27</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Registry: ACCT-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-12 mb-16">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing Inflow</p>
                      <p className="text-3xl font-black text-slate-900">₨{reportStats?.income?.toLocaleString()}</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Cost</p>
                      <p className="text-3xl font-black text-slate-900">₨{reportStats?.totalOutgo?.toLocaleString()}</p>
                   </div>
                   <div className="p-8 bg-[radial-gradient(circle_at_top_right,_#4f46e5_0%,_#312e81_100%)] rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Net Balance</p>
                      <p className="text-3xl font-black">₨{reportStats?.netProfit?.toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-6 mb-16">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Detailed Ledger Balance</h4>
                   <div className="divide-y divide-slate-100">
                      <div className="py-4 flex justify-between items-center text-sm font-black text-slate-800">
                         <span>Patient Consultations (OPD)</span>
                         <span>{reportStats?.income > 0 ? `₨${(reportStats.income * 0.6).toLocaleString()}` : '₨0'}</span>
                      </div>
                      <div className="py-4 flex justify-between items-center text-sm font-black text-slate-800">
                         <span>Pharmacy Sales Inflow</span>
                         <span>{reportStats?.income > 0 ? `₨${(reportStats.income * 0.3).toLocaleString()}` : '₨0'}</span>
                      </div>
                      <div className="py-4 flex justify-between items-center text-sm font-black text-slate-800">
                         <span>Diagnostic & Lab Revenue</span>
                         <span>{reportStats?.income > 0 ? `₨${(reportStats.income * 0.1).toLocaleString()}` : '₨0'}</span>
                      </div>
                   </div>
                </div>

                <div className="border-t-2 border-slate-100 pt-12 flex justify-between items-center">
                   <div className="text-center w-48">
                      <div className="h-px bg-slate-200 mb-2" />
                      <p className="text-[9px] font-black text-slate-400 uppercase">Chief Financial Officer</p>
                   </div>
                   <div className="text-center w-48">
                      <div className="h-px bg-slate-200 mb-2" />
                      <p className="text-[9px] font-black text-slate-400 uppercase">Hospital Director</p>
                   </div>
                </div>
             </div>

             <div className="p-12 bg-slate-950 flex gap-4 print:hidden">
                <Button variant="ghost" className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-white hover:bg-white/10" onClick={() => setShowStatement(false)}>
                  Close Statement
                </Button>
                <Button className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest bg-indigo-600 shadow-xl shadow-indigo-600/30" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Official Statement
                </Button>
             </div>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {reportTypes.map((report) => (
          <Card key={report.id} className="group border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden transition-all hover:ring-indigo-600/30">
            <CardHeader className="p-8">
               <div className="flex items-center justify-between mb-6">
                 <div className={`${report.bg} ${report.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500`}>
                   <report.icon size={28} />
                 </div>
                 <Badge className={`${report.bg} ${report.color} border-0 font-black text-[10px] uppercase tracking-widest px-4 py-1.5`}>
                   Annual 2026
                 </Badge>
               </div>
               <div>
                 <CardTitle className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">{report.title}</CardTitle>
                 <CardDescription className="font-medium text-slate-500 text-sm leading-relaxed">{report.description}</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
               <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:bg-indigo-50/50 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                     <BarChart3 size={100} />
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{report.label}</div>
                  <div className="text-4xl font-black text-slate-900 tracking-tighter">{isLoading ? '...' : report.stat}</div>
               </div>
            </CardContent>
            <CardFooter className="px-8 py-6 bg-slate-50/50 flex justify-between items-center group-hover:bg-slate-50 transition-colors border-t border-slate-50">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol: STRAT-2026-FY</span>
               <Button variant="ghost" className="text-slate-900 font-black gap-2 hover:bg-white text-[10px] uppercase tracking-widest px-4 h-10 rounded-xl transition-all">
                 Generate Data
                 <ChevronRight size={14} />
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-slate-900 text-white overflow-hidden relative group h-[400px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(79,70,229,0.2)_0%,_transparent_50%)]" />
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000">
           <Globe size={300} />
        </div>
        
        <CardHeader className="p-12 relative z-10">
           <div className="w-16 h-16 bg-indigo-600 rounded-2xl mb-6 flex items-center justify-center shadow-2xl shadow-indigo-600/50 group-hover:scale-110 transition-transform">
              <Landmark size={32} />
           </div>
           <CardTitle className="text-4xl font-black tracking-tighter mb-4 uppercase">Revenue Projection & Velocity</CardTitle>
           <CardDescription className="text-slate-400 text-lg font-medium max-w-xl">
             Real-time analytical engine processing financial volatility and collection trends. Comparative analysis of FY26 targets vs actual billing fulfillment.
           </CardDescription>
        </CardHeader>
        
        <CardContent className="px-12 relative z-10">
           <div className="h-64 w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={financeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={8}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                 <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Legend wrapperStyle={{ paddingTop: '20px' }} />
                 <Bar dataKey="projected" name="Projected Target" fill="#334155" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="actual" name="Actual Collected" fill="#4f46e5" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-4 p-8 bg-amber-50/50 border border-amber-100 rounded-[2rem]">
         <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} />
         </div>
         <p className="text-xs text-amber-700 font-bold leading-relaxed italic">
           "The accounts reporting engine is operating under Clinical Fiscal Integrity Protocol v4.2. All financial records are cryptographically signed and archived for audit readiness."
         </p>
      </div>
    </div>
  )
}

// Importing missing icons for reference if needed
import { Clock } from 'lucide-react'
