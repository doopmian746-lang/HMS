import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { 
  Pill, Clock, User, 
  Calendar, CheckCircle2, Info,
  AlertCircle, History, RefreshCw, ChevronRight,
  TrendingUp, Activity
} from 'lucide-react'

export default function NurseMedicationSchedule() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [selectedMed, setSelectedMed] = useState(null)

  // Fetch ward assignment context
  const { data: wardAssignments, isLoading: isWardLoading } = useQuery({
    queryKey: ['ward-context-nurse-meds', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ward_assignments')
        .select(`*, patients(*)`)
        .is('discharged_at', null)
      return data || []
    },
    enabled: !!profile?.id
  })

  // Fetch pending doses from medication_log
  const { data: medicationSchedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['medication-schedule-full', profile?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('medication_log')
        .select(`*, patients(full_name, registration_no)`)
        .gte('scheduled_time', `${today}T00:00:00`)
        .lte('scheduled_time', `${today}T23:59:59`)
        .order('scheduled_time', { ascending: true })
      return data || []
    },
    enabled: !!profile?.id
  })

  const confirmAdministration = useMutation({
    mutationFn: async ({ id, notes }) => {
      const { error } = await supabase
        .from('medication_log')
        .update({ 
          status: 'given', 
          given_at: new Date().toISOString(), 
          nurse_id: profile.id,
          administration_notes: notes 
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medication-schedule-full'])
      queryClient.invalidateQueries(['nurse-stats'])
      setSelectedMed(null)
    }
  })

  const AdminModal = ({ med, onClose }) => {
     const [notes, setNotes] = useState('')
     return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <Card className="w-full max-w-lg rounded-[3rem] shadow-3xl bg-white overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-slate-900 text-white p-10">
                 <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-teal-600 rounded-2xl">
                       <Pill size={24} />
                    </div>
                    <div>
                       <CardTitle className="text-2xl font-black uppercase tracking-tight">Dose Confirmation</CardTitle>
                       <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Medication Administration Record</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                 <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Prescribed Protocol</label>
                    <p className="text-xl font-black text-slate-900">{med.medication_name}</p>
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mt-1">{med.dosage} • {med.route}</p>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observations / Tolerance Notes</label>
                    <textarea 
                       className="w-full h-32 p-4 rounded-2xl bg-slate-50 border-0 ring-1 ring-slate-100 focus:ring-4 focus:ring-teal-500/10 text-sm font-medium"
                       placeholder="Enter any specific observations or the patient's reaction to the dose..."
                       value={notes}
                       onChange={e => setNotes(e.target.value)}
                    />
                 </div>

                 <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-red-700 leading-relaxed uppercase tracking-tight">
                       By confirming, you verify that the 5 Patient Rights (Right Patient, Right Drug, Right Dose, Right Route, Right Time) have been validated.
                    </p>
                 </div>
              </CardContent>
              <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                 <Button variant="ghost" className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest" onClick={onClose}>
                    Abort
                 </Button>
                 <Button 
                    className="flex-1 rounded-2xl h-14 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/20 border-0 flex items-center justify-center gap-3"
                    onClick={() => confirmAdministration.mutate({ id: med.id, notes })}
                    disabled={confirmAdministration.isPending}
                 >
                    {confirmAdministration.isPending ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Confirm Dose
                 </Button>
              </div>
           </Card>
        </div>
     )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full -mr-32 -mt-32 opacity-40 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Medication Matrix</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock className="text-teal-600 w-4 h-4" /> Real-time Administration Schedule • Shift: Morning
          </p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
           <Badge className="bg-teal-50 text-teal-700 border border-teal-100 px-4 py-2 rounded-xl">
             <span className="font-black text-[10px] uppercase tracking-widest">{medicationSchedule?.filter(m => m.status === 'pending').length} Pending Doses</span>
           </Badge>
           <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 text-slate-400 hover:text-teal-600">
              <History size={20} />
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
               {isScheduleLoading ? (
                  [1,2,3].map(i => <div key={i} className="h-40 bg-slate-50 animate-pulse rounded-[2.5rem]" />)
               ) : medicationSchedule?.length > 0 ? medicationSchedule.map((med) => (
                  <Card key={med.id} className={`border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden transition-all hover:scale-[1.01] ${med.status === 'given' ? 'opacity-50' : ''}`}>
                     <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                           <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-xl ${med.status === 'given' ? 'bg-slate-100 text-slate-400' : 'bg-teal-600 text-white shadow-teal-600/20'}`}>
                              {med.scheduled_time.split('T')[1].substring(0, 5)}
                           </div>
                           <div>
                              <div className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1.5">{med.patients?.full_name}</div>
                              <div className="flex items-center gap-3">
                                 <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{med.patients?.registration_no}</span>
                                 <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                 <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{med.medication_name}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right hidden md:block">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Posology</p>
                              <p className="text-xs font-black text-slate-700">{med.dosage} • {med.frequency}</p>
                           </div>
                           {med.status === 'pending' ? (
                              <Button 
                                 className="h-14 px-8 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/20 border-0 flex items-center gap-3"
                                 onClick={() => setSelectedMed(med)}
                              >
                                 Log Dose
                                 <ChevronRight size={16} />
                              </Button>
                           ) : (
                              <Badge className="h-12 px-6 rounded-2xl bg-emerald-50 text-emerald-700 border-0 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                                 <CheckCircle2 size={16} /> Administered
                              </Badge>
                           )}
                        </div>
                     </div>
                  </Card>
               )) : (
                  <div className="p-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                     <TrendingUp size={64} className="mx-auto text-slate-100 mb-6" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Efficiency Protocol: All doses are current</p>
                  </div>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 text-white p-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Activity size={80} />
               </div>
               <h4 className="text-2xl font-black mb-2 tracking-tight">Shift Summary</h4>
               <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">Active monitoring for Surgical Unit B.</p>
               
               <div className="space-y-4">
                  {[
                     { label: 'Total Due', value: medicationSchedule?.length || 0, color: 'text-white' },
                     { label: 'Administered', value: medicationSchedule?.filter(m => m.status === 'given').length || 0, color: 'text-teal-400' },
                     { label: 'Omitted', value: 0, color: 'text-rose-400' }
                  ].map((s, i) => (
                     <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{s.label}</span>
                        <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                     </div>
                  ))}
               </div>
            </Card>

            <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-indigo-50/50 border border-indigo-100 p-8">
               <div className="flex items-center gap-3 mb-4">
                  <Info className="text-indigo-600" size={20} />
                  <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Protocol Reminder</h4>
               </div>
               <p className="text-xs text-indigo-700/70 font-medium leading-relaxed mb-6">
                  Standard precautions: high-alert medications (Insulin, Heparin) require dual nurse verification prior to administration.
               </p>
               <Button className="w-full h-12 bg-white text-indigo-600 border border-indigo-200 shadow-sm rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                  Safety Checklist
               </Button>
            </Card>
         </div>
      </div>

      {selectedMed && <AdminModal med={selectedMed} onClose={() => setSelectedMed(null)} />}
    </div>
  )
}
