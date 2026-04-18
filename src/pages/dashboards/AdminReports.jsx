import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { 
  BarChart3, TrendingUp, Users, DollarSign, 
  FlaskConical, Download, Calendar, ArrowRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const trendData = [
  { name: 'Mon', revenue: 4000, patients: 120 },
  { name: 'Tue', revenue: 3000, patients: 98 },
  { name: 'Wed', revenue: 5000, patients: 150 },
  { name: 'Thu', revenue: 8780, patients: 200 },
  { name: 'Fri', revenue: 6890, patients: 170 },
  { name: 'Sat', revenue: 9390, patients: 250 },
  { name: 'Sun', revenue: 7490, patients: 190 },
]

export default function AdminReports() {
// ... existing up to Card Placeholder ...
  const { data: reportGroups, isLoading } = useQuery({
    queryKey: ['admin-reports-summary'],
    queryFn: async () => {
      // Mocking some grouping for report categories
      return [
        {
          id: 'patient-reports',
          title: 'Patient Demographics',
          description: 'Analyze patient growth, gender distribution, and age groups.',
          icon: Users,
          count: '12 Reports Available',
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        },
        {
          id: 'revenue-reports',
          title: 'Financial Revenue',
          description: 'Detailed revenue breakdowns by department, service, and period.',
          icon: DollarSign,
          count: '8 Reports Available',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50'
        },
        {
          id: 'lab-reports',
          title: 'Laboratory Analytics',
          description: 'Test volume, turnaround times, and result distribution.',
          icon: FlaskConical,
          count: '5 Reports Available',
          color: 'text-teal-600',
          bg: 'bg-teal-50'
        },
        {
          id: 'appointment-reports',
          title: 'Appointment Volume',
          description: 'Doctor availability vs actual bookings and cancellation rates.',
          icon: Calendar,
          count: '10 Reports Available',
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        }
      ]
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h2>
          <p className="text-sm text-slate-500 font-medium">Generate and export comprehensive hospital performance data.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2">
             <Calendar className="w-4 h-4" />
             Month: April 2026
           </Button>
           <Button className="gap-2 shadow-lg shadow-teal-600/20">
             <TrendingUp className="w-4 h-4" />
             Generate Master Report
           </Button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid md:grid-cols-2 gap-6">
        {reportGroups?.map((group) => (
          <Card key={group.id} className="group border-slate-200/60 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-4">
               <div className={`${group.bg} ${group.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                 <group.icon className="w-6 h-6" />
               </div>
               <div className="flex-1">
                 <CardTitle className="text-xl font-bold">{group.title}</CardTitle>
                 <CardDescription className="font-medium">{group.description}</CardDescription>
               </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Available Files</span>
                  <span className="text-sm font-bold text-slate-700">{group.count}</span>
                </div>
                <Button variant="ghost" size="sm" className="gap-2 group-hover:text-teal-600 text-slate-400 font-bold">
                  View List
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
            <div className="px-6 pb-6 pt-0 flex gap-2">
               <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 flex-1 gap-2">
                 <Download className="w-4 h-4" />
                 Download Latest PDF
               </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Advanced Chart */}
      <Card className="border-slate-200/60 shadow-sm bg-[radial-gradient(circle_at_top_right,_#f0fdfa_0%,_white_50%)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Periodic Trend Analysis</CardTitle>
              <CardDescription>Aggregate hospital performance across all modules.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Badge className="bg-teal-100 text-teal-700 border-teal-200">Revenue</Badge>
               <Badge className="bg-blue-100 text-blue-700 border-blue-200">Patients</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₨${value}`} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area yAxisId="right" type="monotone" dataKey="patients" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
