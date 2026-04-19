import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Thermometer, Heart, Activity, 
  ArrowLeft, Save, User, Scale, Ruler, 
  Droplets, CheckCircle2, AlertTriangle, Wind, Info
} from 'lucide-react'

export default function RecordVitals() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    temperature: '',
    blood_pressure: '',
    pulse_rate: '',
    oxygen_saturation: '',
    respiratory_rate: '',
    weight: '',
    height: '',
    pain_level: '0'
  })

  // Triage state
  const [selectedTriageId, setSelectedTriageId] = useState(null)

  // Fetch patient details (if patientId provided)
  const { data: patient } = useQuery({
    queryKey: ['patient-brief', patientId],
    queryFn: async () => {
      if (!patientId) return null
      const { data } = await supabase.from('patients').select('*').eq('id', patientId).single()
      return data
    },
    enabled: !!patientId
  })

  // Fetch Triage Queue
  const { data: triageQueue } = useQuery({
    queryKey: ['triage-queue-active'],
    queryFn: async () => {
      const { data } = await supabase.from('triage').select('*').eq('status', 'waiting').order('priority_score', { ascending: false })
      return data || []
    }
  })

  const calculateTriagePriority = () => {
    const temp = parseFloat(form.temperature)
    const spo2 = parseFloat(form.oxygen_saturation)
    const [sys] = (form.blood_pressure || '').split('/').map(Number)

    if (spo2 < 90 || sys > 170 || sys < 90 || temp > 39.5) return { label: 'CRITICAL', color: 'bg-rose-600', score: 10 }
    if (temp > 38.5 || sys > 150 || spo2 < 94) return { label: 'URGENT', color: 'bg-amber-500', score: 7 }
    return { label: 'NORMAL', color: 'bg-emerald-500', score: 3 }
  }

  const priorityMeta = calculateTriagePriority()

  const saveVitals = useMutation({
    mutationFn: async (vitalsData) => {
      // 1. Save Vitals
      const { error: vError } = await supabase.from('vital_signs').insert([{
        patient_id: patientId || 'TRIAGE_GUEST',
        nurse_id: profile.id,
        recorded_at: new Date().toISOString(),
        ...vitalsData,
        triage_score: priorityMeta.score
      }])
      if (vError) throw vError

      // 2. Finalize Triage if exists
      if (selectedTriageId) {
        await supabase.from('triage').update({ status: 'completed', finalized_at: new Date().toISOString() }).eq('id', selectedTriageId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recent-vitals-nurse'])
      queryClient.invalidateQueries(['patient-vitals-history'])
      navigate('/dashboard/nurse/patients')
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await saveVitals.mutateAsync({
        temperature: parseFloat(form.temperature),
        blood_pressure: form.blood_pressure,
        pulse_rate: parseInt(form.pulse_rate),
        oxygen_saturation: parseFloat(form.oxygen_saturation),
        weight: parseFloat(form.weight),
        height: parseFloat(form.height)
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/nurse/patients">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Record Vital Signs</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Clinical Observation Entry</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Patient Short Info */}
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 h-fit">
          <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
             <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Triage Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {triageQueue?.length > 0 ? triageQueue.map(t => (
              <button 
                key={t.id} 
                onClick={() => {
                  setSelectedTriageId(t.id)
                  alert(`Triage patient ${t.patient_name} selected.`)
                }}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedTriageId === t.id ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
              >
                <p className="font-black text-slate-800">{t.patient_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.reason || 'General malaise'}</p>
              </button>
            )) : (
              <div className="text-center py-6 opacity-30">
                <Users size={24} className="mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Queue Clear</p>
              </div>
            )}
          </CardContent>
          
          {patient && (
            <div className="p-6 border-t border-slate-100 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
                <User size={32} />
              </div>
              <div className="text-center">
                <h3 className="font-black text-slate-900 text-lg">{patient?.full_name}</h3>
                <Badge variant="secondary" className="mt-1 font-bold text-[10px]">{patient?.registration_no}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</div>
                  <div className="font-bold text-slate-700 capitalize">{patient?.gender}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood</div>
                  <div className="font-bold text-rose-600">{patient?.blood_group || 'O+'}</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Vitals Form */}
        <Card className="md:col-span-2 border-0 shadow-2xl shadow-slate-200/60 rounded-[2rem] ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
              <Activity className="text-rose-400" />
              Observations
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Capture real-time biometric data for clinical assessment.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Temperature */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Thermometer size={14} className="text-rose-500" />
                    Body Temp (°C)
                  </label>
                  <Input 
                    type="number" step="0.1" required
                    className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-rose-500 font-bold text-lg px-4"
                    placeholder="e.g. 37.0"
                    value={form.temperature}
                    onChange={e => setForm({...form, temperature: e.target.value})}
                  />
                </div>

                {/* Blood Pressure */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Heart size={14} className="text-rose-500" />
                    Blood Pressure
                  </label>
                  <Input 
                    required
                    className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-rose-500 font-bold text-lg px-4"
                    placeholder="e.g. 120/80"
                    value={form.blood_pressure}
                    onChange={e => setForm({...form, blood_pressure: e.target.value})}
                  />
                </div>

                {/* Pulse Rate */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-teal-500" />
                    Pulse Rate (bpm)
                  </label>
                  <Input 
                    type="number" required
                    className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-teal-500 font-bold text-lg px-4"
                    placeholder="e.g. 72"
                    value={form.pulse_rate}
                    onChange={e => setForm({...form, pulse_rate: e.target.value})}
                  />
                </div>

                {/* O2 Saturation */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Droplets size={14} className="text-teal-500" />
                    Oxygen Saturation (%)
                  </label>
                  <Input 
                    type="number" step="0.1" required
                    className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-teal-500 font-bold text-lg px-4"
                    placeholder="e.g. 98.5"
                    value={form.oxygen_saturation}
                    onChange={e => setForm({...form, oxygen_saturation: e.target.value})}
                  />
                </div>

                {/* Respiratory Rate */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Wind size={14} className="text-blue-500" />
                    Respiratory Rate (/min)
                  </label>
                  <Input 
                    type="number" required
                    className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-blue-500 font-bold text-lg px-4"
                    placeholder="e.g. 18"
                    value={form.respiratory_rate}
                    onChange={e => setForm({...form, respiratory_rate: e.target.value})}
                  />
                </div>

                {/* Pain Level */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-3">Assessment: Pain Level (0 - 10)</label>
                  <div className="flex gap-2">
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({...form, pain_level: n.toString()})}
                        className={`flex-1 h-12 rounded-xl font-black transition-all ${form.pain_level === n.toString() ? 'bg-slate-900 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Scale size={14} className="text-indigo-500" />
                    Weight (kg)
                  </label>
                  <Input 
                    type="number" step="0.1" required
                    className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 font-bold text-lg px-4"
                    placeholder="e.g. 70.0"
                    value={form.weight}
                    onChange={e => setForm({...form, weight: e.target.value})}
                  />
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={14} className="text-indigo-500" />
                    Height (cm)
                  </label>
                  <Input 
                    type="number" step="0.1" required
                    className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 font-bold text-lg px-4"
                    placeholder="e.g. 175.0"
                    value={form.height}
                    onChange={e => setForm({...form, height: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center">
                 <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className={priorityMeta.color.replace('bg-', 'text-')} />
                    <span className={`text-sm font-black uppercase tracking-widest ${priorityMeta.color.replace('bg-', 'text-')}`}>Auto-Triage: {priorityMeta.label}</span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Protocol based on biometric inputs provided above</p>
              </div>

              <div className="pt-6">
                <Button 
                   type="submit" 
                   disabled={loading || (!patientId && !selectedTriageId)}
                   className={`w-full h-14 text-white font-black text-lg rounded-2xl shadow-xl gap-3 border-0 transition-all ${priorityMeta.color} shadow-${priorityMeta.color.split('-')[1]}-600/20`}
                >
                  {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Save size={20} />}
                  Complete Registry & Finalize Assessment
                </Button>
              </div>
            </form>
          </CardContent>
          <div className="bg-slate-50 p-6 flex items-start gap-4 border-t border-slate-100">
             <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} />
             </div>
             <p className="text-xs text-slate-500 font-medium leading-relaxed">
               Submitted data will be immediately visible on the clinical dashboard and synchronized with the doctor's review module for treatment planning.
             </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
