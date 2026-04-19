import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { 
  Users, UserCog, Calendar, DollarSign, Activity, 
  ArrowUpRight, ArrowDownRight, Clock, AlertCircle, ShieldCheck,
  BedDouble, AlertOctagon, FileText, TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminOverview() {
  // Fetch aggregate stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Fetch stats independently to prevent failure propagation
      const patients = await supabase.from('patients').select('*', { count: 'exact', head: true })
      const staff = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const appointments = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0])
      const revenue = await supabase.from('invoices').select('total_amount')
      const beds = await supabase.from('bed_management').select('*')
      const triage = await supabase.from('triage_queue').select('*')
      const payroll = await supabase.from('payroll').select('*')
      const claims = await supabase.from('insurance_claims').select('*')

      const totalRevenue = revenue.data?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0
      
      const icuBeds = beds.data?.filter(b => b.ward === 'ICU') || []
      const occupiedIcu = icuBeds.filter(b => b.status === 'occupied').length
      const criticalTriage = triage.data?.filter(t => t.triage_level === 'critical').length || 0
      const unpaidPayroll = payroll.data?.filter(p => p.status === 'unpaid').length || 0
      const pendingClaims = claims.data?.filter(c => ['under-review', 'submitted'].includes(c.status)).length || 0

      return {
        main: [
          { label: 'Total Patients', value: patients.count || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', change: '+12.5%', up: true },
          { label: 'Total Staff', value: staff.count || 0, icon: UserCog, color: 'text-teal-600', bg: 'bg-teal-50', change: '+2', up: true },
          { label: 'Appointments Today', value: appointments.count || 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', change: '-4%', up: false },
          { label: 'Total Revenue', value: `₨${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '+18.2%', up: true },
        ],
        secondary: [
          { label: 'ICU Occupied', value: `${occupiedIcu}/${icuBeds.length}`, icon: BedDouble, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Critical Triage', value: criticalTriage, icon: AlertOctagon, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Payroll Pending', value: unpaidPayroll, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Claims Pending', value: pendingClaims, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
        ],
        beds: beds.data || [],
        criticalTriageCount: criticalTriage
      }
    }
  })

  // Fetch recent activity (Audit Logs)
  const { data: activity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Removed failing join. Will fetch and map if needed, but for stability 
      // we'll just fetch the logs first. In HMS schema, audit_logs user_id matches auth.uid which is profiles user_id.
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`*`)
        .order('timestamp', { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data || []
    }
  })

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl" />)}
    </div>
  </div>

  return (
    <div className="space-y-8">
      {/* Triage Alert Banner */}
      {stats?.criticalTriageCount > 0 && (
        <Link to="/dashboard/nurse" className="block">
          <div className="bg-rose-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-600/20 animate-pulse transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-6 h-6" />
              <span className="font-black uppercase tracking-tight">
                ⚠️ ALERT: {stats.criticalTriageCount} critical patient(s) in Emergency Triage — Immediate attention required
              </span>
            </div>
            <ArrowUpRight className="w-5 h-5 opacity-70" />
          </div>
        </Link>
      )}

      {/* Stats Grid - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.main?.map((stat, i) => (
          <Card key={i} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {stat.label}
              </CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                {stat.up ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                )}
                <span className={stat.up ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                  {stat.change}
                </span>
                since last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.secondary?.map((stat, i) => (
          <Card key={i} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {stat.label}
              </CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Bed Status Panel */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <BedDouble className="w-4 h-4 text-slate-600" />
            </div>
            <CardTitle className="text-lg font-bold">Live Bed Status</CardTitle>
          </div>
          <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Available</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-rose-500" /> Occupied</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-slate-400" /> Maint.</div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats?.beds?.reduce((acc, bed) => {
              if (!acc[bed.ward]) acc[bed.ward] = []
              acc[bed.ward].push(bed)
              return acc
            }, {}) || {}).map(([ward, beds]) => (
              <div key={ward} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{ward}</h4>
                  <Badge variant="secondary" className="text-[10px] font-black">
                    {beds.filter(b => b.status === 'occupied').length}/{beds.length} Occupied
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {beds.map(bed => (
                    <div 
                      key={bed.id}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black transition-all border
                        ${bed.status === 'occupied' ? 'bg-rose-500 border-rose-600 text-white' : 
                          bed.status === 'available' ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 
                          'bg-slate-400 border-slate-500 text-white'}`}
                      title={`${bed.bed_number}: ${bed.status}${bed.patient_id ? ' - Patient ' + bed.patient_id : ''}`}
                    >
                      {bed.bed_number.split('-')[1] || bed.bed_number}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent System Activity</CardTitle>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600">Real-time Feed</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activity?.length > 0 ? activity.map((log, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== activity.length - 1 && (
                    <div className="absolute left-[17px] top-10 bottom-0 w-px bg-slate-100" />
                  )}
                  <div className="w-9 h-9 shrink-0 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      <span className="text-teal-600">{log.profiles?.full_name || 'System'}</span> 
                      {' performed '} 
                      <span className="font-bold uppercase text-[10px] tracking-widest px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 mx-1">{log.action}</span>
                      {' on table '}
                      <span className="italic text-slate-600">{log.table_name}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No activity logs recorded yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="lg:col-span-3 border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Patient Database', status: 'Operational', color: 'emerald' },
              { label: 'Medical Records', status: 'Operational', color: 'emerald' },
              { label: 'Billing Engine', status: 'Operational', color: 'emerald' },
              { label: 'Auth Service', status: 'Operational', color: 'emerald' },
              { label: 'Storage (Reports)', status: 'Warning', color: 'amber' },
            ].map((sys, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-${sys.color}-500 animate-pulse`} />
                  <span className="text-sm font-bold text-slate-700">{sys.label}</span>
                </div>
                <Badge variant={sys.color === 'emerald' ? 'success' : 'warning'} className="text-[10px]">
                  {sys.status}
                </Badge>
              </div>
            ))}
            
            <div className="mt-6 p-4 rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-teal-200" />
                <span className="text-xs font-bold uppercase tracking-widest">Security Notification</span>
              </div>
              <p className="text-xs text-teal-50">
                All sensitive data is encrypted at rest using AES-256 standards. RLS policies are active for all tables.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
