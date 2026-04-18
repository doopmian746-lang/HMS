import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { 
  Clock, User, Stethoscope, 
  CalendarDays, Printer, ChevronRight,
  UserCheck, AlertCircle
} from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function TodaySchedule() {
  const today = new Date().toISOString().split('T')[0]

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['today-full-schedule', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select(`*, patients(full_name, registration_no, phone), profiles(full_name, department)`)
        .eq('date', today)
        .order('time_slot', { ascending: true })
      
      // Group by doctor
      const grouped = (data || []).reduce((acc, curr) => {
        const docName = curr.profiles?.full_name || 'Unassigned'
        if (!acc[docName]) acc[docName] = { 
          doctor: curr.profiles,
          appointments: [] 
        }
        acc[docName].appointments.push(curr)
        return acc
      }, {})
      
      return Object.values(grouped)
    }
  })

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daily Clinical Terminal</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Full Facility Schedule • {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Button variant="outline" className="h-12 border-slate-200 font-black gap-2 bg-white rounded-2xl px-6 shadow-sm">
          <Printer size={18} />
          Print Daily PDF
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-8">
           {[1,2].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2.5rem]" />)}
        </div>
      ) : schedule?.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {schedule.map((group, idx) => (
            <Card key={idx} className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                     <Stethoscope size={28} className="text-indigo-100" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black tracking-tight">Dr. {group.doctor?.full_name}</CardTitle>
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{group.doctor?.department} Specialist</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="divide-y divide-slate-100">
                  {group.appointments.map((appt) => (
                    <div key={appt.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className={`w-2 h-10 rounded-full ${
                           appt.status === 'completed' ? 'bg-emerald-500' : 
                           appt.status === 'cancelled' ? 'bg-rose-500' : 'bg-indigo-500'
                         }`} />
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="font-black text-slate-900 tracking-tight">{appt.time_slot}</span>
                               <span className="text-[10px] font-black text-slate-300">•</span>
                               <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{appt.patients?.full_name}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400">Reg: {appt.patients?.registration_no}</div>
                         </div>
                      </div>
                      <Badge className={
                        appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-0 text-[9px] font-black px-2' : 
                        appt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-0 text-[9px] font-black px-2' : 
                        'bg-slate-100 text-slate-500 border-0 text-[9px] font-black px-2'
                      }>
                        {appt.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {group.appointments.length} Appointments Total
                 </div>
                 <Badge className="bg-indigo-600 text-white border-0 font-black px-3 py-1 text-[10px]">
                    LIVE
                 </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
           <CalendarDays className="w-16 h-16 mx-auto mb-4 text-slate-200" />
           <h3 className="text-xl font-black text-slate-400">No Appointments Scheduled Today</h3>
           <p className="text-sm text-slate-300 font-bold mt-1 uppercase tracking-widest">Facility is currently in standby mode</p>
        </div>
      )}
    </div>
  )
}
