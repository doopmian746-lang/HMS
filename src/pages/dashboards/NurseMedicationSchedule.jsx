import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { 
  Pill, Clock, User, 
  Calendar, CheckCircle2, Info
} from 'lucide-react'

export default function NurseMedicationSchedule() {
  const { profile } = useAuth()

  // Fetch ward patients first
  const { data: wardPatients, isLoading: isWardLoading } = useQuery({
    queryKey: ['ward-patients-nurse-meds', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ward_assignments')
        .select(`patient_id, patients(*)`)
        .eq('assigned_nurse_id', profile.id)
        .is('discharged_at', null)
      return data || []
    },
    enabled: !!profile?.id
  })

  // Fetch prescriptions for these patients
  const patientIds = wardPatients?.map(wp => wp.patient_id) || []
  const { data: medications, isLoading: isMedsLoading } = useQuery({
    queryKey: ['ward-medications', patientIds],
    queryFn: async () => {
      const { data } = await supabase
        .from('prescriptions')
        .select(`*, prescription_items(*), patients(full_name, registration_no)`)
        .in('patient_id', patientIds)
        .eq('status', 'dispensed') // Only show dispensed meds ready for administration
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: patientIds.length > 0
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Medication Chart</h2>
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Ward-wide Administration Schedule</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isMedsLoading || isWardLoading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl" />)
        ) : medications?.length > 0 ? medications.map((px) => (
          <Card key={px.id} className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl ring-1 ring-slate-100 overflow-hidden flex flex-col bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center font-black shadow-sm">
                  {px.patients?.full_name?.[0]}
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 tracking-tight">{px.patients?.full_name}</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">{px.patients?.registration_no}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 space-y-4">
              {px.prescription_items?.map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-teal-200 hover:bg-teal-50/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-teal-600 shadow-sm">
                        <Pill size={16} />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 tracking-tight">{item.medicine_name}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Dosage: {item.dosage}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      <Clock size={12} className="text-teal-500" />
                      {item.frequency}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      <Calendar size={12} className="text-amber-500" />
                      {item.duration}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="p-5 bg-slate-50/50 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Prescribed: {new Date(px.created_at).toLocaleDateString()}</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-0 flex gap-1 items-center font-black">
                <CheckCircle2 size={10} /> DISPENSED
              </Badge>
            </div>
          </Card>
        )) : (
          <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
             <Pill size={64} className="mx-auto text-slate-200 mb-4 opacity-30" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active medication records for your ward</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
        <Info className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="text-xs text-amber-700 leading-relaxed font-medium">
          Only **dispensed** medications from the pharmacy are shown here. If a medicine is missing, please coordinate with the clinical pharmacist to ensure it has been released for administration.
        </div>
      </div>
    </div>
  )
}
