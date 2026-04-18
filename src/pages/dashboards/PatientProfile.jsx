import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  User, Phone, MapPin, Calendar, 
  Activity, ArrowLeft, Clock,
  Stethoscope, CreditCard, ClipboardList,
  ChevronRight, AlertCircle
} from 'lucide-react'

export default function PatientProfile() {
  const { id } = useParams()

  // Fetch patient details
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()
      if (error) throw error
      return data
    }
  })

  // Fetch appointment history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['patient-history', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select(`*, profiles(full_name, department)`)
        .eq('patient_id', id)
        .order('date', { ascending: false })
        .order('time_slot', { ascending: false })
      return data || []
    }
  })

  if (patientLoading) return <div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full" /></div>

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/receptionist/appointments">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{patient?.full_name}</h2>
          <div className="flex items-center gap-3 mt-1">
             <Badge className="bg-indigo-50 text-indigo-700 border-0 font-black tracking-widest text-[10px] uppercase px-3">
                REG: {patient?.registration_no}
             </Badge>
             <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">Patient Clinical Identity</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Personal Details Card */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
            <div className="h-32 bg-slate-900 relative">
               <div className="absolute -bottom-10 left-8">
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center p-1">
                     <div className="w-full h-full bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-slate-300">
                        <User size={48} />
                     </div>
                  </div>
               </div>
            </div>
            <CardContent className="pt-16 pb-10 px-8 space-y-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                    <div className="p-2 bg-white rounded-xl shadow-sm"><Calendar className="w-4 h-4 text-indigo-600" /></div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Born On</div>
                      <div className="text-sm font-black text-slate-700">{patient?.date_of_birth || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                    <div className="p-2 bg-white rounded-xl shadow-sm"><Activity className="w-4 h-4 text-rose-500" /></div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Biometric Data</div>
                      <div className="text-sm font-black text-slate-700">{patient?.blood_group || 'Unknown'} / {patient?.gender}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                    <div className="p-2 bg-white rounded-xl shadow-sm"><Phone className="w-4 h-4 text-teal-600" /></div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Reach</div>
                      <div className="text-sm font-black text-slate-700">{patient?.phone || 'No Phone Registered'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                    <div className="p-2 bg-white rounded-xl shadow-sm"><MapPin className="w-4 h-4 text-amber-500" /></div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Geo Locality</div>
                      <div className="text-sm font-black text-slate-700">{patient?.address || 'N/A'}</div>
                    </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                  <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Emergency Response</div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                     <div className="text-xs font-black text-rose-700">{patient?.emergency_contact || 'None Listed'}</div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinical History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-2">
                <ClipboardList className="text-indigo-600 w-5 h-5" />
                <h3 className="text-xl font-black text-slate-800">Appointment Ledger</h3>
             </div>
             <Badge className="bg-slate-100 text-slate-500 border-0 font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[9px]">
                {history?.length || 0} Total Entries
             </Badge>
          </div>

          <div className="space-y-4">
            {historyLoading ? (
              [1,2,3].map(i => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-3xl" />)
            ) : history?.length > 0 ? history.map((h) => (
              <Card key={h.id} className="border-0 shadow-xl shadow-slate-200/40 rounded-3xl ring-1 ring-slate-100 overflow-hidden hover:ring-indigo-200 transition-all group">
                <div className="flex items-center p-6 gap-6">
                   <div className="w-16 h-16 bg-white border-2 border-slate-50 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                      <span className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">{new Date(h.date).toLocaleDateString([], { month: 'short' })}</span>
                      <span className="text-xl font-black text-slate-900 leading-none">{new Date(h.date).getDate()}</span>
                   </div>
                   
                   <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                         <span className="font-black text-slate-800 tracking-tight">Visit with Dr. {h.profiles?.full_name}</span>
                         <Badge className={
                            h.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-0 text-[8px] font-black' : 
                            h.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-0 text-[8px] font-black' : 
                            'bg-indigo-50 text-indigo-600 border-0 text-[8px] font-black'
                         }>
                            {h.status.toUpperCase()}
                         </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <span className="flex items-center gap-1.5"><Clock size={12} className="text-indigo-400" /> {h.time_slot}</span>
                         <span>•</span>
                         <span className="flex items-center gap-1.5"><Stethoscope size={12} className="text-teal-500" /> {h.profiles?.department}</span>
                      </div>
                   </div>

                   <ChevronRight className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Card>
            )) : (
              <div className="p-20 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                 <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                 <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No historical data found for this file</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
