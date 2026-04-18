import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  UserPlus, Save, RotateCcw, Search, 
  MapPin, Phone, Calendar, Mail, 
  BadgeInfo, Activity, UserCheck, Printer,
  Download, QrCode, CreditCard
} from 'lucide-react'

export default function PatientRegistration() {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [patientData, setPatientData] = useState(null)
  const printRef = useRef()

  // Mutation to create patient
  const createPatient = useMutation({
    mutationFn: async (data) => {
      // Generate registration number (M-XXXX)
      const randomPart = Math.floor(1000 + Math.random() * 9000)
      const newRegNo = `M-${randomPart}`
      
      const { data: inserted, error } = await supabase
        .from('patients')
        .insert([{ ...data, registration_no: newRegNo }])
        .select()
        .single()
      
      if (error) throw error
      return inserted
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['recent-registrations'])
      setPatientData(data)
      setSuccess(true)
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.target)
    const payload = {
      full_name:         formData.get('full_name'),
      date_of_birth:     formData.get('date_of_birth'),
      gender:             formData.get('gender'),
      blood_group:        formData.get('blood_group'),
      phone:              formData.get('phone'),
      address:           formData.get('address'),
      emergency_contact:  formData.get('emergency_contact'),
    }
    
    try {
      await createPatient.mutateAsync(payload)
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML
    const originalContent = document.body.innerHTML
    document.body.innerHTML = printContent
    window.print()
    document.body.innerHTML = originalContent
    window.location.reload() // Important to restore React state
  }

  if (success && patientData) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-8 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 mb-6">
            <UserCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Registration Complete</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Patient file has been successfully initialized</p>
        </div>

        {/* Printable Card Container */}
        <div ref={printRef} className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 ring-1 ring-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors" />
          
          <div className="flex justify-between items-start mb-10 relative">
             <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-emerald-600 rounded-full" />
                   <span className="font-black text-slate-900 tracking-tighter text-lg">MEDCARE HMS</span>
                </div>
                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Medical Identity File</div>
             </div>
             <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reg No.</div>
                <div className="text-xl font-black text-emerald-600 tracking-tight">{patientData.registration_no}</div>
             </div>
          </div>

          <div className="flex gap-10 items-center relative py-6 border-y border-slate-50">
             <div className="w-32 h-32 bg-slate-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                <QrCode size={64} className="text-slate-300" />
             </div>
             <div className="space-y-4 flex-1">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Patient Name</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">{patientData.full_name}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</div>
                    <div className="font-bold text-slate-700 capitalize">{patientData.gender}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood Group</div>
                    <div className="font-black text-rose-600">{patientData.blood_group || 'Not Specified'}</div>
                  </div>
                </div>
             </div>
          </div>

          <div className="mt-8 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <div className="flex items-center gap-2">
                <Phone size={12} /> {patientData.phone}
             </div>
             <div>Registered: {new Date(patientData.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handlePrint}
            className="h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg gap-3 rounded-2xl shadow-xl shadow-slate-900/10 border-0"
          >
            <Printer size={20} />
            Print Patient Card
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 font-bold rounded-xl border-slate-200 gap-2" onClick={() => window.location.reload()}>
              <UserPlus size={18} />
              New Entry
            </Button>
            <Link to="/dashboard/receptionist" className="w-full">
              <Button variant="ghost" className="h-12 w-full font-bold rounded-xl text-slate-500 gap-2">
                Back to Desk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Patient Registration</h2>
          <p className="text-sm text-slate-500 font-bold">Register a new medical file in the hospital system.</p>
        </div>
        <Button variant="ghost" className="gap-2 text-slate-400 font-bold hover:text-slate-900" onClick={() => window.location.reload()}>
          <RotateCcw className="w-4 h-4" />
          Reset Form
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Personal Info */}
          <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
                <BadgeInfo className="w-6 h-6 text-sky-400" />
                Identity Details
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium italic">Legal naming and biological data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Patient Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                  <Input name="full_name" className="pl-12 h-14 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all font-bold text-lg" placeholder="e.g. Liam Smith" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Birth Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <Input name="date_of_birth" type="date" className="pl-12 h-14 bg-slate-50 border-0 rounded-2xl font-bold" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Gender</label>
                  <select name="gender" className="w-full h-14 rounded-2xl border-0 bg-slate-50 px-4 py-2 text-base font-bold focus:ring-2 focus:ring-sky-500/50 focus:outline-none" required>
                    <option value="" disabled selected>Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Validated Blood Group</label>
                <div className="relative">
                  <Activity className="absolute left-4 top-4 w-4 h-4 text-rose-500" />
                  <select name="blood_group" className="w-full h-14 rounded-2xl border-0 bg-slate-50 px-12 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/50">
                    <option value="">Awaiting Lab Result</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Emergency */}
          <div className="space-y-8">
            <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
               <CardHeader className="p-8 border-b border-slate-50">
                  <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800 tracking-tight">
                    <Phone className="w-5 h-5 text-teal-600" />
                    Reach & Locality
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6 p-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Mobile Phone</label>
                  <Input name="phone" className="h-14 bg-slate-50 border-0 rounded-2xl font-bold text-lg" placeholder="+1 (555) 000-0000" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Home Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <Input name="address" className="pl-12 h-14 bg-slate-50 border-0 rounded-2xl font-bold" placeholder="Unit, Street, City" required />
                  </div>
                </div>
               </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl shadow-rose-200/20 rounded-3xl bg-white ring-1 ring-rose-100 overflow-hidden">
              <CardHeader className="py-6 px-8 bg-rose-50/50">
                <CardTitle className="text-sm font-black text-rose-600 uppercase tracking-widest">Immediate Notification</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <Input name="emergency_contact" className="h-14 bg-slate-50 border-0 rounded-2xl font-bold italic" placeholder="Name / Kinship / Emergency Phone" required />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4">
          <Button type="submit" disabled={loading} className="w-full h-16 text-xl font-black bg-sky-600 hover:bg-sky-700 text-white shadow-2xl shadow-sky-600/30 group rounded-3xl border-0">
             {loading ? <div className="h-6 w-6 border-4 border-white/30 border-t-white animate-spin rounded-full" /> : (
               <>
                 Initialize Patient File
                 <Save className="ml-3 w-6 h-6 group-hover:scale-110 transition-transform" />
               </>
             )}
          </Button>
        </div>
      </form>
    </div>
  )
}
