import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { 
  User, Calendar, FileText, Pill, 
  FlaskConical, Activity, ArrowLeft, 
  Phone, Mail, MapPin, Droplet, History
} from 'lucide-react'

export default function PatientDetail() {
  const { id } = useParams()

  // Fetch patient details
  const { data: patient, isLoading: isPatientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    }
  })

  // Fetch visit history
  const { data: records, isLoading: isRecordsLoading } = useQuery({
    queryKey: ['patient-records', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('medical_records')
        .select(`*, profiles(full_name)`)
        .eq('patient_id', id)
        .order('visit_date', { ascending: false })
      return data || []
    }
  })

  // Fetch prescriptions
  const { data: prescriptions } = useQuery({
    queryKey: ['patient-prescriptions', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('prescriptions')
        .select(`*, prescription_items(*), profiles(full_name)`)
        .eq('patient_id', id)
        .order('date', { ascending: false })
      return data || []
    }
  })

  // Fetch lab orders
  const { data: labOrders } = useQuery({
    queryKey: ['patient-labs', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lab_orders')
        .select(`*, lab_results(*), profiles(full_name)`)
        .eq('patient_id', id)
        .order('ordered_date', { ascending: false })
      return data || []
    }
  })

  if (isPatientLoading) return <div className="p-8 text-center animate-pulse">Loading Patient Record...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/dashboard/doctor/patients">
          <Button variant="ghost" className="gap-2 text-slate-500">
            <ArrowLeft size={16} />
            Back to Patients
          </Button>
        </Link>
        <Link to={`/dashboard/doctor/consultation/new?patientId=${id}`}>
          <Button className="bg-teal-600 gap-2 shadow-lg shadow-teal-600/20 font-bold">
            <Activity size={18} />
            New Consultation
          </Button>
        </Link>
      </div>

      {/* Patient Header Card */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white overflow-hidden rounded-2xl">
        <div className="h-2 bg-teal-600" />
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="h-24 w-24 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border-2 border-teal-100/50">
              <User size={48} />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient?.full_name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="bg-slate-900 text-white border-0">{patient?.registration_no}</Badge>
                  <Badge variant="outline" className="border-slate-200 text-slate-500">{patient?.gender}</Badge>
                  <Badge variant="outline" className="border-teal-100 text-teal-700 bg-teal-50 font-bold">
                    {new Date().getFullYear() - new Date(patient?.date_of_birth).getFullYear()} Years Old
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-50">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood Group</div>
                  <div className="flex items-center gap-1.5 font-bold text-rose-600">
                    <Droplet size={14} />
                    {patient?.blood_group || 'Not Set'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Phone size={14} className="text-slate-300" />
                    {patient?.phone}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <MapPin size={14} className="text-slate-300" />
                    {patient?.address || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Visit History Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <History className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-800">Clinical History</h2>
          </div>

          <div className="space-y-4">
            {records?.length > 0 ? records.map((record) => (
              <Card key={record.id} className="border-slate-100 shadow-sm hover:border-teal-100 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="font-bold text-slate-700">{record.visit_date}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">Dr. {record.profiles?.full_name}</span>
                  </div>
                  <CardTitle className="text-md font-bold text-slate-800 mt-2">{record.diagnosis}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-900">Symptoms:</span> {record.symptoms}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic">
                    <span className="font-bold text-slate-900 not-italic">Treatment:</span> {record.treatment_plan}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                <FileText size={48} className="mx-auto mb-4 opacity-10" />
                <p className="font-medium">No previous consultation records found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Meds & Labs */}
        <div className="space-y-8">
          {/* Recent Prescriptions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-800">Current Meds</h3>
              </div>
            </div>
            <Card className="border-slate-100 divide-y divide-slate-50">
              {prescriptions?.length > 0 ? prescriptions.slice(0, 3).map((px) => (
                <div key={px.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-bold text-slate-400">{px.date}</div>
                    <Badge variant={px.status === 'dispensed' ? 'success' : 'secondary'} className="text-[10px]">
                      {px.status}
                    </Badge>
                  </div>
                  {px.prescription_items?.map((item, i) => (
                    <div key={i} className="text-sm font-bold text-slate-700">
                      {item.medicine_name} <span className="text-slate-400 font-medium">— {item.dosage}</span>
                    </div>
                  ))}
                </div>
              )) : (
                <div className="p-8 text-center text-xs text-slate-400">None dispensed</div>
              )}
            </Card>
          </div>

          {/* Lab Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800">Lab Reports</h3>
              </div>
            </div>
            <div className="space-y-3">
              {labOrders?.length > 0 ? labOrders.map((lab) => (
                <Card key={lab.id} className="p-4 border-slate-100 bg-slate-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-800 text-sm">{lab.test_name}</div>
                    <Badge className="text-[10px]">{lab.status}</Badge>
                  </div>
                  {lab.lab_results?.[0] && (
                    <div className="text-sm text-teal-700 font-bold bg-teal-50 p-2 rounded border border-teal-100">
                      RESULT: {lab.lab_results[0].result_value}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-2 font-medium">Ordered: {lab.ordered_date}</div>
                </Card>
              )) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">No lab tests ordered</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

