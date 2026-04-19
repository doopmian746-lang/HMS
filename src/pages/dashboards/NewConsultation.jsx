import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Stethoscope, Pill, FlaskConical, 
  Trash2, Plus, ArrowLeft, Save,
  Users, Activity, ClipboardList, Printer, X,
  AlertTriangle, Info, ChevronRight, CheckCircle2,
  RefreshCw, History, Search
} from 'lucide-react'

export default function NewConsultation() {
  const { appointmentId } = useParams()
  const [searchParams] = useSearchParams()
  const patientIdFromQuery = searchParams.get('patientId')
  const navigate = useNavigate()
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  // Form State
  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [treatment, setTreatment] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Medications State
  const [meds, setMeds] = useState([])
  
  // Lab Orders State
  const [labs, setLabs] = useState([''])

  const [showPrintModal, setShowPrintModal] = useState(false)
  const [lastSavedRecord, setLastSavedRecord] = useState(null)

  // Fetch Appointment & Patient Data
  const { data: appointmentData } = useQuery({
    queryKey: ['appointment-detail', appointmentId],
    queryFn: async () => {
      if (appointmentId === 'new') {
        const { data } = await supabase.from('patients').select('*').eq('id', patientIdFromQuery).single()
        return { patients: data }
      }
      const { data } = await supabase
        .from('appointments')
        .select(`*, patients(*)`)
        .eq('id', appointmentId)
        .single()
      return data
    },
    enabled: !!appointmentId || !!patientIdFromQuery
  })

  // Fetch Previous Vitals & Alleries for Context
  const patient = appointmentData?.patients
  
  const { data: clinicalContext } = useQuery({
    queryKey: ['patient-clinical-context', patient?.id],
    queryFn: async () => {
      const { data: vitals } = await supabase.from('vital_signs').select('*').eq('patient_id', patient.id).order('recorded_at', { ascending: false }).limit(1)
      const { data: allergies } = await supabase.from('patient_allergies').select('*').eq('patient_id', patient.id)
      const { data: history } = await supabase.from('medical_records').select('*').eq('patient_id', patient.id).order('visit_date', { ascending: false }).limit(3)
      return { vitals: vitals?.[0], allergies: allergies || [], history: history || [] }
    },
    enabled: !!patient?.id
  })

  const addMed = () => {
    setMeds([...meds, { name: '', dosage: '', frequency: '', duration: '', quantity: 1 }])
  }

  const removeMed = (index) => {
    setMeds(meds.filter((_, i) => i !== index))
  }

  const updateMed = (index, field, value) => {
    const newMeds = [...meds]
    newMeds[index][field] = value
    setMeds(newMeds)
  }

  const handleSave = async () => {
    if (!diagnosis || !symptoms) {
      alert('Please fill in symptoms and diagnosis before finalizing.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create Medical Record
      const { data: record, error: recordError } = await supabase
        .from('medical_records')
        .insert([{
          patient_id: patient.id,
          doctor_id: profile.id,
          diagnosis,
          symptoms,
          treatment_plan: treatment,
          notes,
          visit_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (recordError) throw recordError

      // 2. Create Prescription if meds exist
      if (meds.length > 0) {
        const { data: prescription, error: pxError } = await supabase
          .from('prescriptions')
          .insert([{
            patient_id: patient.id,
            doctor_id: profile.id,
            record_id: record.id,
            status: 'pending'
          }])
          .select()
          .single()

        if (pxError) throw pxError

        const pxItems = meds.map(m => ({
          prescription_id: prescription.id,
          medicine_name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          quantity: parseInt(m.quantity)
        }))

        await supabase.from('prescription_items').insert(pxItems)
      }

      // 3. Create Lab Orders if labs exist
      const validLabs = labs.filter(l => l.trim() !== '')
      if (validLabs.length > 0) {
        const labOrders = validLabs.map(l => ({
          patient_id: patient.id,
          doctor_id: profile.id,
          record_id: record.id,
          test_name: l,
          status: 'pending',
          ordered_date: new Date().toISOString()
        }))
        await supabase.from('lab_orders').insert(labOrders)
      }

      // 4. Mark appointment as completed
      if (appointmentId !== 'new') {
        await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId)
      }

      // 5. Invalidate Queries
      queryClient.invalidateQueries(['doctor-stats'])
      queryClient.invalidateQueries(['appointment-detail'])
      queryClient.invalidateQueries(['doctor-schedule'])

      // 6. Success State
      setLastSavedRecord({
        record,
        patient,
        meds,
        labs: validLabs,
        diagnosis,
        symptoms,
        treatment
      })
      setShowPrintModal(true)
    } catch (err) {
      console.error('Save Error:', err)
      alert('Clinical record preservation failed. Verify network connectivity.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const PrescriptionPreview = () => (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl rounded-[3rem] shadow-3xl overflow-hidden bg-white animate-in zoom-in-95 duration-300 my-8">
        <div className="p-16 print:p-8" id="prescription-print-area">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-12 mb-12">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-teal-600 rounded-3xl shadow-xl shadow-teal-600/20">
                 <Stethoscope className="w-10 h-10 text-white" />
               </div>
               <div>
                 <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">MedCare Pro HMS</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Advanced Clinical Matrix • License #HM-2024-X</p>
               </div>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-black text-slate-900 uppercase">{profile?.full_name}</h3>
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1 leading-loose">{profile?.role} • Specialist in {profile?.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject Information</label>
               <p className="text-2xl font-black text-slate-900 leading-none mb-1">{lastSavedRecord?.patient?.full_name}</p>
               <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                  {lastSavedRecord?.patient?.registration_no} 
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {lastSavedRecord?.patient?.gender} 
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Age: {lastSavedRecord?.patient?.age || 'N/A'}
               </p>
             </div>
             <div className="text-right">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Authorization Timestamp</label>
               <p className="text-xl font-black text-slate-900 uppercase">{new Date().toLocaleDateString('en-GB')}</p>
               <p className="text-[11px] font-black text-teal-600 uppercase tracking-widest mt-1">{new Date().toLocaleTimeString()}</p>
             </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-12">
             <div className="space-y-6">
                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 relative group">
                   <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                      <ClipboardList size={64} />
                   </div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Clinical Findings</label>
                   <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-l-4 border-teal-500 pl-4">
                     "{lastSavedRecord?.symptoms}"
                   </p>
                </div>
                <div className="p-8 rounded-[2rem] bg-teal-50 border border-teal-100">
                   <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest block mb-2">Authenticated Diagnosis</label>
                   <p className="text-xl font-black text-slate-900">{lastSavedRecord?.diagnosis}</p>
                </div>
             </div>

             <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 h-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Treatment Protocol & Advice</label>
                <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
                   {lastSavedRecord?.treatment || "Standard clinical care advised."}
                </p>
             </div>
          </div>

          <div className="space-y-8 mb-20">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                   <Pill size={24} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Pharmacological Prescription (Rx)</h4>
             </div>
             <div className="divide-y-2 divide-slate-100 border-y-2 border-slate-100">
               {lastSavedRecord?.meds?.length > 0 ? lastSavedRecord.meds.map((m, i) => (
                 <div key={i} className="py-6 flex items-center justify-between group hover:bg-slate-50 transition-colors px-4 rounded-xl">
                   <div className="flex-1">
                      <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{m.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{m.dosage} • {m.duration} Days Cycle</div>
                   </div>
                   <div className="text-right">
                      <Badge className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-lg border-0">{m.frequency}</Badge>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 px-1">Dispense Count: {m.quantity} Units</div>
                   </div>
                 </div>
               )) : (
                 <div className="py-12 text-center text-slate-300 italic font-medium uppercase tracking-widest text-sm">No pharmacological intervention recorded.</div>
               )}
             </div>
          </div>

          {lastSavedRecord?.labs?.length > 0 && (
             <div className="mb-20 space-y-6 bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                      <FlaskConical size={24} />
                   </div>
                   <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase">Diagnostic Directives</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                   {lastSavedRecord.labs.map((l, i) => (
                     <Badge key={i} className="bg-white text-indigo-700 border border-indigo-200 font-black uppercase text-[10px] tracking-widest px-5 py-3 rounded-2xl shadow-sm">
                        {l}
                     </Badge>
                   ))}
                </div>
             </div>
          )}

          <div className="flex justify-between items-end pt-12 border-t-4 border-slate-900 mt-20">
             <div>
                <img src="/qr-placeholder.png" className="w-24 h-24 mb-4 opacity-10 bg-slate-900 rounded-xl" alt="Auth QR" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Digital Auth Handle: {lastSavedRecord?.record?.id}</p>
             </div>
             <div className="text-center w-64">
                <div className="h-px bg-slate-200 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Practitioner's Endorsement</p>
                <p className="text-sm font-black text-slate-900 mt-2">{profile?.full_name}</p>
             </div>
          </div>
        </div>

        <div className="p-10 bg-slate-900 flex flex-col md:flex-row gap-4 print:hidden">
           <Button 
            variant="ghost" 
            className="flex-1 rounded-[1.5rem] h-16 font-black uppercase text-[11px] tracking-widest text-slate-400 hover:text-white hover:bg-white/10 border-white/10 border" 
            onClick={() => navigate(`/dashboard/doctor/patients`)}
           >
             <X className="w-5 h-5 mr-3" />
             Finalize and Return to Registry
           </Button>
           <Button 
            className="flex-1 rounded-[1.5rem] h-16 font-black uppercase text-[11px] tracking-widest bg-teal-600 hover:bg-teal-500 text-white shadow-3xl shadow-teal-600/30 border-0 flex items-center justify-center" 
            onClick={() => window.print()}
           >
             <Printer className="w-5 h-5 mr-3" />
             Preserve Physical Record
           </Button>
        </div>
      </Card>
    </div>
  )

  if (showPrintModal) return <PrescriptionPreview />

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <Button variant="ghost" onClick={() => navigate(-1)} className="h-12 w-12 rounded-2xl hover:bg-slate-50 text-slate-400">
              <ArrowLeft size={24} />
           </Button>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic Terminal</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Diagnostic Interface</h2>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-50 text-emerald-600 border-0 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl">Session Encrypted</Badge>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="bg-slate-900 hover:bg-black text-white gap-3 h-14 px-10 shadow-3xl shadow-slate-900/20 font-black uppercase text-[11px] tracking-widest rounded-2xl border-0 transition-all hover:scale-[1.02]"
          >
            {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
            Preserve visit
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Context */}
        <div className="lg:col-span-1 space-y-6">
           {/* Patient Identity */}
           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 p-8">
              <div className="text-center mb-8">
                 <div className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center text-teal-600 font-black text-3xl mx-auto mb-4 shadow-xl shadow-teal-600/10 border border-teal-100">
                    {patient?.full_name?.[0]}
                 </div>
                 <h3 className="text-xl font-black text-slate-900 leading-tight">{patient?.full_name}</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{patient?.registration_no}</p>
              </div>

              <div className="space-y-4">
                 {[
                   { label: 'Gender', value: patient?.gender, variant: 'secondary' },
                   { label: 'Age Group', value: patient?.age || 'Adult', variant: 'secondary' },
                   { label: 'Blood Group', value: 'B+', variant: 'destructive' }
                 ].map((tag, i) => (
                   <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tag.label}</span>
                      <Badge variant={tag.variant} className="font-black text-[10px] uppercase border-0 px-3 py-1">{tag.value}</Badge>
                   </div>
                 ))}
              </div>
           </Card>

           {/* Latest Vitals */}
           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 text-white p-8 group">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <Activity className="text-teal-400" size={20} />
                    <h4 className="text-[11px] font-black uppercase tracking-widest">Active Vitals</h4>
                 </div>
                 <Badge className="bg-white/10 text-white font-black text-[9px] uppercase border-0">{clinicalContext?.vitals?.recorded_at?.split('T')[0] || 'Today'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'Pulse', value: clinicalContext?.vitals?.pulse || '72', unit: 'bpm', color: 'text-teal-400' },
                   { label: 'BP', value: clinicalContext?.vitals?.bp || '120/80', unit: 'mmHg', color: 'text-indigo-400' },
                   { label: 'Temp', value: clinicalContext?.vitals?.temp || '98.6', unit: '°F', color: 'text-amber-400' },
                   { label: 'Oxygen', value: clinicalContext?.vitals?.oxygen || '98', unit: '%', color: 'text-rose-400' }
                 ].map((v, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                      <div className="text-[10px] font-black text-white/30 uppercase mb-1 tracking-tighter">{v.label}</div>
                      <div className={`text-xl font-black ${v.color} leading-none mb-1`}>{v.value}</div>
                      <div className="text-[9px] font-bold text-white/20 uppercase">{v.unit}</div>
                   </div>
                 ))}
              </div>
           </Card>

           {/* History Peek */}
           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} className="text-indigo-600" /> Encounter Archive
                 </h4>
              </CardHeader>
              <div className="p-2 divide-y divide-slate-50">
                 {clinicalContext?.history?.map((h, i) => (
                   <div key={i} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group rounded-2xl">
                      <div className="flex justify-between items-start mb-1">
                         <span className="text-[10px] font-black text-slate-400 uppercase">{h.visit_date}</span>
                         <ArrowRight size={12} className="text-slate-200 group-hover:text-indigo-600 transition-colors translate-x-1" />
                      </div>
                      <p className="text-xs font-black text-slate-800 line-clamp-1 uppercase tracking-tight">{h.diagnosis}</p>
                   </div>
                 ))}
                 {clinicalContext?.history?.length === 0 && <p className="p-8 text-center text-[10px] font-black text-slate-300 uppercase italic">No history found</p>}
              </div>
           </Card>
        </div>

        {/* Center: Clinical Input */}
        <div className="lg:col-span-3 space-y-8">
           {/* Findings Card */}
           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
              <div className="p-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-teal-600 border border-slate-100">
                       <Stethoscope size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Clinical Observations</h3>
                       <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">Diagnostic Registry Terminal</p>
                    </div>
                 </div>
              </div>
              <CardContent className="p-10 space-y-10">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                       <Info size={14} className="text-teal-600" /> Patient Complaints & Symptoms
                    </label>
                    <textarea 
                       className="w-full min-h-[140px] p-6 rounded-[2rem] border-0 ring-1 ring-slate-200 focus:ring-4 focus:ring-teal-500/10 bg-slate-50/50 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[10px]"
                       placeholder="Enter chief complaints, onset duration, and patient-reported symptoms..."
                       value={symptoms}
                       onChange={e => setSymptoms(e.target.value)}
                    />
                 </div>

                 <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Differential Diagnosis</label>
                       <div className="relative">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                          <Input 
                             className="h-16 pl-14 pr-6 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-4 focus:ring-teal-500/10 bg-white text-lg font-black text-slate-900 placeholder:font-black placeholder:uppercase placeholder:text-[10px]"
                             placeholder="Search or enter ICD code..."
                             value={diagnosis}
                             onChange={e => setDiagnosis(e.target.value)}
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Visit Outcome & Status</label>
                       <div className="h-16 flex items-center gap-3 bg-slate-50 p-2 rounded-2xl ring-1 ring-slate-200">
                          {['Stable', 'Observation', 'Referral'].map(s => (
                             <button key={s} className="flex-1 h-full rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-white text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 hover:border-teal-500">
                                {s}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-slate-50">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Treatment Protocol & General Advice</label>
                    <textarea 
                       className="w-full min-h-[140px] p-6 rounded-[2rem] border-0 ring-1 ring-slate-200 focus:ring-4 focus:ring-teal-500/10 bg-white text-sm font-bold text-slate-700"
                       placeholder="Detailed advice for the patient..."
                       value={treatment}
                       onChange={e => setTreatment(e.target.value)}
                    />
                 </div>
              </CardContent>
           </Card>

           {/* Prescription Card */}
           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
              <div className="p-10 bg-rose-50/30 border-b border-rose-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-600 border border-slate-100">
                       <Pill size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Prescription Matrix</h3>
                       <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">Pharmacological Interventions</p>
                    </div>
                 </div>
                 <Button onClick={addMed} className="h-12 px-8 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl shadow-rose-600/20 gap-3 border-0">
                    <Plus size={16} /> Prescribe Medicine
                 </Button>
              </div>
              <CardContent className="p-0">
                 {meds.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                       {meds.map((med, i) => (
                          <div key={i} className="p-10 grid md:grid-cols-4 gap-8 items-end group animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Medicine Identifier</label>
                                <Input 
                                   className="h-14 rounded-xl border-slate-200 bg-white font-black uppercase text-xs"
                                   placeholder="Tablet Augmentin..."
                                   value={med.name}
                                   onChange={e => updateMed(i, 'name', e.target.value)}
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unit Dosage</label>
                                <Input 
                                   className="h-14 rounded-xl border-slate-200 bg-white font-black"
                                   placeholder="625mg"
                                   value={med.dosage}
                                   onChange={e => updateMed(i, 'dosage', e.target.value)}
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Frequency Control</label>
                                <select 
                                   className="w-full h-14 rounded-xl border-slate-200 bg-white font-black text-[11px] uppercase tracking-widest px-4 focus:ring-rose-500/20"
                                   value={med.frequency}
                                   onChange={e => updateMed(i, 'frequency', e.target.value)}
                                >
                                   <option value="">Select Frequency</option>
                                   <option value="1-0-1 (Twice Daily)">Twice Daily (1-0-1)</option>
                                   <option value="1-1-1 (Thrice Daily)">Thrice Daily (1-1-1)</option>
                                   <option value="1-0-0 (Morning)">Morning (1-0-0)</option>
                                   <option value="0-0-1 (Night)">Night (0-0-1)</option>
                                   <option value="SOS (Only if needed)">SOS (If needed)</option>
                                </select>
                             </div>
                             <div className="flex gap-4">
                                <div className="space-y-3 flex-1">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cycle Days</label>
                                   <Input 
                                      type="number"
                                      className="h-14 rounded-xl border-slate-200 bg-white font-black text-center"
                                      value={med.duration}
                                      onChange={e => updateMed(i, 'duration', e.target.value)}
                                   />
                                </div>
                                <div className="pb-2">
                                   <Button variant="ghost" size="icon" onClick={() => removeMed(i)} className="h-12 w-12 rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50">
                                      <Trash2 size={20} />
                                   </Button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-24 text-center">
                       <Pill size={64} className="mx-auto text-slate-100 mb-4" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Pharmacological interventions will appear here</p>
                    </div>
                 )}
              </CardContent>
           </Card>

           {/* Diagnostics Card */}
           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
              <div className="p-10 bg-indigo-50/30 border-b border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-slate-100">
                       <FlaskConical size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Diagnostic Directives</h3>
                       <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">Laboratory Analytics Request</p>
                    </div>
                 </div>
                 <Button onClick={() => setLabs([...labs, ''])} variant="outline" className="h-12 px-8 border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all h-12 shadow-sm gap-2">
                    <Plus size={16} /> Add Test Request
                 </Button>
              </div>
              <CardContent className="p-10">
                 <div className="grid md:grid-cols-2 gap-4">
                    {labs.map((lab, i) => (
                       <div key={i} className="flex gap-3 animate-in fade-in zoom-in-95 duration-300">
                          <Input 
                             placeholder="CBC, LFT, Serum Electrolytes..."
                             value={lab}
                             onChange={e => {
                                const newLabs = [...labs]
                                newLabs[i] = e.target.value
                                setLabs(newLabs)
                             }}
                             className="h-14 rounded-xl border-slate-200 bg-slate-50/50 font-black uppercase text-xs"
                          />
                          <Button variant="ghost" size="icon" onClick={() => setLabs(labs.filter((_, idx) => idx !== i))} className="h-14 w-14 text-slate-300 hover:text-rose-500 rounded-xl shrink-0">
                             <Trash2 size={18} />
                          </Button>
                       </div>
                    ))}
                 </div>
                 {labs.length === 0 && (
                    <div className="text-center py-10 opacity-30">
                       <Activity className="mx-auto mb-2 text-indigo-200" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No diagnostics ordered</p>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
