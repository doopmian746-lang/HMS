import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { 
  Activity, Thermometer, ArrowLeft, 
  History, User, Calendar, Clock
} from 'lucide-react'

export default function VitalsHistory() {
  const { patientId } = useParams()

  // Fetch patient details
  const { data: patient } = useQuery({
    queryKey: ['patient-brief', patientId],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('*').eq('id', patientId).single()
      return data
    }
  })

  // Fetch vitals history
  const { data: vitals, isLoading } = useQuery({
    queryKey: ['patient-vitals-history', patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('vital_signs')
        .select(`*, profiles(full_name)`)
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: true }) // Ascending for chart
      return data || []
    }
  })

  // Data for chart (most recent 10-20 points)
  const chartData = vitals?.map(v => ({
    time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date(v.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    temp: v.temperature,
    pulse: v.pulse_rate,
    spo2: v.oxygen_saturation
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/nurse/patients">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Trends</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Vitals History & Analysis — {patient?.full_name}</p>
        </div>
      </div>

      {/* Vitals Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Thermometer size={14} className="text-rose-500" />
              Temperature Trend (°C)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fb7185', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={4} dot={{ fill: '#f43f5e', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity size={14} className="text-teal-500" />
              Pulse & O2 Saturation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis yId="left" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis yId="right" orientation="right" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Line yId="left" type="monotone" dataKey="pulse" name="Pulse (bpm)" stroke="#0d9488" strokeWidth={3} dot={{ r: 3 }} />
                <Line yId="right" type="monotone" dataKey="spo2" name="SPO2 (%)" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-0 shadow-2xl shadow-slate-200/60 rounded-3xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <History className="text-rose-500" />
            Registry Logs
          </CardTitle>
          <CardDescription className="font-medium text-slate-500">Comprehensive chronological list of all biometric captures.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 pl-8">Entry Time</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Temp</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">BP</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Pulse</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">SPO2</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Nurse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => (
                <TableRow key={i}><TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/20" /></TableRow>
              )) : [...(vitals || [])].reverse().map((v) => (
                <TableRow key={v.id} className="group hover:bg-slate-50 transition-colors">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{new Date(v.recorded_at).toLocaleDateString()}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-slate-700">{v.temperature}°C</TableCell>
                  <TableCell className="font-black text-slate-700">{v.blood_pressure}</TableCell>
                  <TableCell className="font-bold text-teal-600">{v.pulse_rate} bpm</TableCell>
                  <TableCell>
                    <Badge variant="success" className="font-black border-0 bg-emerald-50 text-emerald-700 px-3">{v.oxygen_saturation}%</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 border border-white shadow-sm" />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{v.profiles?.full_name}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && vitals?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium italic">No historical records available for this patient.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
