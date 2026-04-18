import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Stethoscope, FileText, ArrowLeft, 
  User, ClipboardList, Info, Calendar
} from 'lucide-react'

export default function DoctorNotesView() {
  const { patientId } = useParams()

  // Fetch patient details
  const { data: patient } = useQuery({
    queryKey: ['patient-brief', patientId],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('*').eq('id', patientId).single()
      return data
    }
  })

  // Fetch medical records (Doctor Notes)
  const { data: records, isLoading } = useQuery({
    queryKey: ['patient-clinical-notes', patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('medical_records')
        .select(`*, profiles(full_name, department)`)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false })
      return data || []
    }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/nurse/patients">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Directives</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Medical Records Review — {patient?.full_name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Patient Profile Snapshot */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl ring-1 ring-slate-100 overflow-hidden bg-white">
            <CardContent className="p-8 space-y-6">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center border-4 border-slate-50 shadow-2xl shadow-slate-900/40 font-black text-2xl mx-auto">
                {patient?.full_name?.[0]}
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-black text-slate-900 text-xl tracking-tight">{patient?.full_name}</h3>
                <Badge variant="secondary" className="font-bold text-[10px] tracking-widest bg-slate-100 text-slate-500 border-0">{patient?.registration_no}</Badge>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-slate-50">
                 <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Age / Gender</span>
                    <span className="text-slate-700">{new Date().getFullYear() - new Date(patient?.date_of_birth).getFullYear()}Y / {patient?.gender}</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Status</span>
                    <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-0 text-[9px] px-2 py-0">ACTIVE</Badge>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Timeline */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            [1,2].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl" />)
          ) : records?.length > 0 ? records.map((record) => (
            <Card key={record.id} className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] ring-1 ring-slate-100 overflow-hidden hover:ring-teal-200 transition-all group">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-teal-600 flex items-center justify-center shadow-sm">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{record.diagnosis}</CardTitle>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={12} className="text-slate-300" />
                        {record.visit_date}
                      </div>
                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                        Dr. {record.profiles?.full_name}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                {/* Symptoms */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="w-8 h-px bg-slate-100" />
                    Presenting Symptoms
                  </h4>
                  <p className="text-base text-slate-700 font-bold leading-relaxed pl-10 border-l-4 border-slate-100">
                    {record.symptoms}
                  </p>
                </div>

                {/* Treatment Plan */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-[11px] font-black text-teal-600/50 uppercase tracking-[0.2em]">
                    <span className="w-8 h-px bg-teal-100" />
                    Management & Treatment Plan
                  </h4>
                  <div className="bg-teal-50/50 rounded-3xl p-8 border border-teal-100 shadow-inner group-hover:bg-teal-50 transition-colors">
                    <p className="text-base text-teal-900 font-black leading-relaxed italic">
                      {record.treatment_plan}
                    </p>
                  </div>
                </div>

                {/* Additional Clinical Notes */}
                {record.notes && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[11px] font-black text-indigo-400/50 uppercase tracking-[0.2em]">
                      <span className="w-8 h-px bg-indigo-100" />
                      Strategic Directives
                    </h4>
                    <pre className="text-sm font-bold text-slate-500 bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap font-sans leading-relaxed">
                      {record.notes}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )) : (
            <div className="p-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
               <FileText size={64} className="mx-auto text-slate-100 mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No doctor's notes available for this patient admission</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
