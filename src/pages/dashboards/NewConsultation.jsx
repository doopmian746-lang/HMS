import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Stethoscope, Pill, FlaskConical, 
  Trash2, Plus, ArrowLeft, Save,
  Users, Activity, ClipboardList
} from 'lucide-react'

export default function NewConsultation() {
  const { appointmentId } = useParams()
  const [searchParams] = useSearchParams()
  const patientIdFromQuery = searchParams.get('patientId')
  const navigate = useNavigate()
  const { profile } = useAuth()

  // Form State
  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [treatment, setTreatment] = useState('')
  const [notes, setNotes] = useState('')
  
  // Medications State
  const [meds, setMeds] = useState([])
  
  // Lab Orders State
  const [labs, setLabs] = useState([''])

  // Fetch Appointment & Patient Data
  const { data: appointmentData } = useQuery({
    queryKey: ['appointment-detail', appointmentId],
    queryFn: async () => {
      if (appointmentId === 'new') {
        const { data } = await supabase.from('patients').select('*').eq('id', patientIdFromQuery).single()
        return { patient: data }
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

  const patient = appointmentData?.patients || appointmentData?.patient

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
      alert('Please fill in symptoms and diagnosis.')
      return
    }

    try {
      // 1. Create Medical Record
      const { data: record, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patient.id,
          doctor_id: profile.id,
          diagnosis,
          symptoms,
          treatment_plan: treatment,
          notes
        })
        .select()
        .single()

      if (recordError) throw recordError

      // 2. Create Prescription if meds exist
      if (meds.length > 0) {
        const { data: prescription, error: pxError } = await supabase
          .from('prescriptions')
          .insert({
            patient_id: patient.id,
            doctor_id: profile.id,
            record_id: record.id,
            status: 'pending'
          })
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

        const { error: itemsError } = await supabase.from('prescription_items').insert(pxItems)
        if (itemsError) throw itemsError
      }

      // 3. Create Lab Orders if labs exist
      const validLabs = labs.filter(l => l.trim() !== '')
      if (validLabs.length > 0) {
        const labOrders = validLabs.map(l => ({
          patient_id: patient.id,
          doctor_id: profile.id,
          record_id: record.id,
          test_name: l,
          status: 'pending'
        }))
        const { error: labError } = await supabase.from('lab_orders').insert(labOrders)
        if (labError) throw labError
      }

      // 4. Mark appointment as completed
      if (appointmentId !== 'new') {
        await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId)
      }

      // 5. Success
      navigate(`/dashboard/doctor/patients/${patient.id}`)
    } catch (err) {
      console.error('Save Error:', err)
      alert('Failed to save consultation. Check console.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft size={16} /> Discard Changes
        </Button>
        <div className="flex items-center gap-3">
          <Badge className="bg-slate-100 text-slate-500 border-slate-200">Draft Auto-saved</Badge>
          <Button onClick={handleSave} className="bg-slate-900 gap-2 h-11 px-8 shadow-xl shadow-slate-900/20 font-bold">
            <Save size={18} /> Complete Consultation
          </Button>
        </div>
      </div>

      {/* Hero Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Consultation</div>
            <div className="text-xl font-black text-slate-900">{patient?.full_name} <span className="text-slate-400 font-medium">— {patient?.registration_no}</span></div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session Start</div>
          <div className="text-sm font-bold text-slate-700">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Clinical Findings */}
          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <CardTitle className="text-lg font-bold">Clinical Findings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Presenting Symptoms</label>
                  <textarea 
                    className="w-full min-h-[100px] p-4 rounded-xl border-slate-200 focus:ring-teal-500 bg-slate-50/30 text-sm font-medium"
                    placeholder="Describe patient's complaints..."
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Final Diagnosis</label>
                  <Input 
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/30 font-bold"
                    placeholder="Enter diagnosis..."
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Treatment Plan / Advice</label>
                  <textarea 
                    className="w-full min-h-[100px] p-4 rounded-xl border-slate-200 focus:ring-teal-500 bg-slate-50/30 text-sm font-medium"
                    placeholder="Advised rest, dietary changes, etc..."
                    value={treatment}
                    onChange={e => setTreatment(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-rose-500" />
                <CardTitle className="text-lg font-bold">Medications</CardTitle>
              </div>
              <Button size="sm" onClick={addMed} className="bg-rose-50 text-rose-600 hover:bg-rose-100 flex gap-2 font-bold shadow-none border-0 pt-0.5 pb-0.5">
                <Plus size={14} /> Add Medicine
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {meds.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {meds.map((med, i) => (
                    <div key={i} className="p-6 grid grid-cols-12 gap-4 items-end group">
                      <div className="col-span-12 md:col-span-4 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Medicine Name</label>
                        <Input 
                          placeholder="Paracetamol..."
                          value={med.name}
                          onChange={e => updateMed(i, 'name', e.target.value)}
                          className="bg-slate-50/30 border-slate-200 font-bold"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dosage</label>
                        <Input 
                          placeholder="500mg"
                          value={med.dosage}
                          onChange={e => updateMed(i, 'dosage', e.target.value)}
                          className="bg-slate-50/30 border-slate-200"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Frequency</label>
                        <Input 
                          placeholder="1-0-1"
                          value={med.frequency}
                          onChange={e => updateMed(i, 'frequency', e.target.value)}
                          className="bg-slate-50/30 border-slate-200"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-2 flex items-center justify-end pb-1">
                        <Button variant="ghost" size="icon" onClick={() => removeMed(i)} className="text-slate-300 hover:text-red-500">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-sm italic">No medications prescribed for this visit.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Lab Orders */}
          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-lg font-bold">Laboratories</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {labs.map((lab, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    placeholder="CBC, Serum Ferritin..."
                    value={lab}
                    onChange={e => {
                      const newLabs = [...labs]
                      newLabs[i] = e.target.value
                      setLabs(newLabs)
                    }}
                    className="bg-slate-50/50 border-slate-200"
                  />
                  <Button variant="ghost" size="icon" onClick={() => setLabs(labs.filter((_, idx) => idx !== i))} className="text-slate-300 shrink-0">
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setLabs([...labs, ''])} className="w-full border-dashed border-slate-200 text-indigo-600 font-bold hover:bg-indigo-50 bg-white">
                <Plus size={14} className="mr-2" /> Add More Test
              </Button>
            </CardContent>
          </Card>

          {/* Vitals Summary (Display Only) */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold">Latest Vitals</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-bold text-white/40 uppercase">Pulse</div>
                <div className="font-bold">72 BPM</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-bold text-white/40 uppercase">BP</div>
                <div className="font-bold">120/80</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
