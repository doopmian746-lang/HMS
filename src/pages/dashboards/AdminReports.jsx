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
import React, { useState } from 'react'
import { Check, X, FileText, ExternalLink } from 'lucide-react'

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
  const [selectedMonth, setSelectedMonth] = useState('April 2026')
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [showMasterModal, setShowMasterModal] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({})

  const months = ['April 2026', 'March 2026', 'February 2026', 'January 2026', 'December 2025', 'November 2025']

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Fetch Stats for Master Report
  const { data: masterStats } = useQuery({
    queryKey: ['master-report-stats'],
    queryFn: async () => {
      const patients = await supabase.from('patients').select('*', { count: 'exact', head: true })
      const admitted = await supabase.from('bed_management').select('*').eq('status', 'occupied')
      const invoices = await supabase.from('invoices').select('total_amount, paid_amount')
      const labTests = await supabase.from('lab_orders').select('status')
      const staff = await supabase.from('profiles').select('*', { count: 'exact', head: true })

      const totalRevenue = invoices.data?.reduce((sum, i) => sum + Number(i.total_amount), 0) || 0
      const collected = invoices.data?.reduce((sum, i) => sum + Number(i.paid_amount), 0) || 0

      return {
        patients: { total: patients.count || 0, admitted: admitted.data?.length || 0, discharged: 5 },
        revenue: { total: totalRevenue, collected, outstanding: totalRevenue - collected },
        labs: { completed: labTests.data?.filter(t => t.status === 'completed').length || 0, pending: labTests.data?.filter(t => t.status === 'pending').length || 0 },
        staff: { total: staff.count || 0, onLeave: 2 }
      }
    }
  })
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
        <div className="flex gap-2 relative">
           <div className="relative">
             <Button variant="outline" className="gap-2 bg-white" onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
               <Calendar className="w-4 h-4" />
               Month: {selectedMonth}
             </Button>
             {showMonthDropdown && (
               <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                 {months.map(m => (
                   <button 
                     key={m}
                     className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                     onClick={() => {
                       setSelectedMonth(m)
                       setShowMonthDropdown(false)
                     }}
                   >
                     {m}
                   </button>
                 ))}
               </div>
             )}
           </div>
           <Button className="gap-2 shadow-lg shadow-teal-600/20" onClick={() => setShowMasterModal(true)}>
             <TrendingUp className="w-4 h-4" />
             Generate Master Report
           </Button>
        </div>
      </div>

      {showMasterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
            <CardHeader className="p-8 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">Master Report — {selectedMonth}</CardTitle>
                <CardDescription className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mt-1">Generated on {new Date().toLocaleDateString()}</CardDescription>
              </div>
              <button onClick={() => setShowMasterModal(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {[
                { label: 'Patient Summary', data: `${masterStats?.patients?.total} total, ${masterStats?.patients?.admitted} admitted, ${masterStats?.patients?.discharged} discharged`, icon: Users },
                { label: 'Revenue Analytics', data: `₨${masterStats?.revenue?.collected.toLocaleString()} collected, ₨${masterStats?.revenue?.outstanding.toLocaleString()} outstanding`, icon: DollarSign },
                { label: 'Laboratory Services', data: `${masterStats?.labs?.completed} completed investigations, ${masterStats?.labs?.pending} pending`, icon: FlaskConical },
                { label: 'Clinical Staffing', data: `${masterStats?.staff?.total} active personnel, ${masterStats?.staff?.onLeave} on authorized leave`, icon: ShieldCheck }
              ].map((sec, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <sec.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-3 h-3 text-teal-500 font-black" />
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{sec.label}</h4>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{sec.data}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex gap-4">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black uppercase text-xs tracking-widest" onClick={() => setShowMasterModal(false)}>Close</Button>
              <Button className="flex-1 h-12 rounded-2xl font-black uppercase text-xs tracking-widest bg-teal-600 shadow-lg shadow-teal-600/20" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" />
                Print Master Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 group-hover:text-teal-600 text-slate-400 font-bold"
                  onClick={() => toggleGroup(group.id)}
                >
                  {expandedGroups[group.id] ? 'Hide List' : 'View List'}
                  <ArrowRight className={`w-4 h-4 transition-transform ${expandedGroups[group.id] ? 'rotate-90' : ''}`} />
                </Button>
              </div>

              {expandedGroups[group.id] && (
                <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-600 group/item hover:border-teal-200 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {group.id.split('-')[0]}_report_0{i}_apr2026.pdf
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/item:opacity-100 text-teal-600" onClick={() => alert("Preparing download...")}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="px-6 pb-6 pt-0 flex gap-2">
               <Button 
                 size="sm" 
                 className="bg-slate-900 text-white hover:bg-slate-800 flex-1 gap-2"
                 onClick={() => alert(`Generating PDF for ${group.title}...`)}
               >
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
