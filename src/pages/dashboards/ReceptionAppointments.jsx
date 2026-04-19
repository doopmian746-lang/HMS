import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Calendar, Search, Plus, Clock, 
  User, CheckCircle2, MoreVertical, 
  Phone, UserCog, Filter, X,
  AlertTriangle, Save, Stethoscope,
  ChevronRight, CalendarDays, Printer,
  QrCode, Ticket
} from 'lucide-react'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
]

export default function ReceptionAppointments() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)

  const [bookingForm, setBookingForm] = useState({
    patient_query: '',
    patient_id: '',
    doctor_id: '',
    date: new Date().toISOString().split('T')[0],
    time_slot: ''
  })

  // Fetch doctors
  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'doctor')
      return data || []
    }
  })

  // Search patients
  const { data: searchResults } = useQuery({
    queryKey: ['patient-search-booking', bookingForm.patient_query],
    queryFn: async () => {
      if (!bookingForm.patient_query) return []
      const { data } = await supabase
        .from('patients')
        .select('*')
        .or(`full_name.ilike.%${bookingForm.patient_query}%,registration_no.ilike.%${bookingForm.patient_query}%`)
        .limit(5)
      return data || []
    },
    enabled: bookingForm.patient_query.length > 1
  })

  // Fetch all appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['reception-appointments', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`*, patients(full_name, phone, registration_no), profiles(full_name, department)`)
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data } = await query.order('date', { ascending: false }).order('time_slot', { ascending: true })
      return data || []
    }
  })

  // Mutation to book appointment
  const bookAppt = useMutation({
    mutationFn: async (data) => {
      const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', data.doctor_id)
        .eq('date', data.date)
        .eq('time_slot', data.time_slot)
        .eq('status', 'scheduled')
      
      if (existing && existing.length > 0) {
        throw new Error('This time slot is already booked for the selected doctor.')
      }

      const { data: inserted, error } = await supabase.from('appointments').insert([data]).select().single()
      if (error) throw error
      return inserted
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['reception-appointments'])
      setIsBooking(false)
      setBookingForm({ patient_query: '', patient_id: '', doctor_id: '', date: new Date().toISOString().split('T')[0], time_slot: '' })
      setBookingError('')
      
      // Auto-open ticket for the new booking
      const fullApt = appointments?.find(a => a.id === data.id) || data
      setSelectedTicket(fullApt)
    },
    onError: (err) => {
      setBookingError(err.message)
    }
  })

  // Mutation to update status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['reception-appointments'])
  })

  const filtered = appointments?.filter(a => 
    a.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patients?.registration_no?.includes(searchTerm) ||
    a.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const AppointmentTicket = ({ appointment, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
       <Card className="w-full max-w-md rounded-[3rem] shadow-3xl bg-white overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-10 text-center" id="appointment-ticket-print">
             <div className="flex justify-center mb-6">
                <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20">
                   <Ticket className="w-8 h-8 text-white" />
                </div>
             </div>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Visit Token</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Entry Voucher</p>
             
             <div className="my-8 py-8 border-y-2 border-dashed border-slate-100 space-y-6">
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subject Identity</label>
                   <p className="text-lg font-black text-slate-900 leading-none">{appointment.patients?.full_name}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{appointment.patients?.registration_no}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Check-in</label>
                      <p className="text-lg font-black text-indigo-600 leading-none">{appointment.time_slot}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Room/Zone</label>
                      <p className="text-sm font-black text-slate-800 leading-none">CLINIC-A4</p>
                   </div>
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Clinical Specialist</label>
                   <p className="text-sm font-black text-slate-700">Dr. {appointment.profiles?.full_name}</p>
                   <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{appointment.profiles?.department}</p>
                </div>
             </div>

             <div className="flex justify-center mb-6 opacity-30">
                <QrCode size={80} />
             </div>
             
             <p className="text-[8px] font-black text-slate-400 uppercase leading-relaxed max-w-[200px] mx-auto">
                Please present this token at the nursing station for vitals assessment before entering the doctor's office.
             </p>
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
             <Button variant="ghost" className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest" onClick={onClose}>
                Dismiss
             </Button>
             <Button className="flex-1 rounded-2xl h-14 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest border-0 flex items-center justify-center gap-3" onClick={() => window.print()}>
                <Printer size={18} />
                Print Token
             </Button>
          </div>
       </Card>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-40 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Clinical Arrival Registry</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <CalendarDays className="text-indigo-600 w-4 h-4" /> Daily Booking Management • System Active
          </p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
           <Button 
            className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xl shadow-indigo-600/30 font-black rounded-[1.5rem] gap-3 border-0 transition-transform active:scale-95"
            onClick={() => setIsBooking(true)}
           >
             <Plus size={20} />
             Book New Patient
           </Button>
        </div>
      </div>

      <Card className="border-0 shadow-3xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-10">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <Input 
                placeholder="Find booking by patient identity or doctor..." 
                className="pl-16 h-16 bg-white rounded-2xl border-0 ring-1 ring-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-lg"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
               {['all', 'scheduled', 'completed', 'cancelled'].map(s => (
                  <button 
                     key={s}
                     onClick={() => setFilterStatus(s)}
                     className={`h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${filterStatus === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200'}`}
                  >
                     {s}
                  </button>
               ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/10">
              <TableRow>
                <TableHead className="font-black py-8 pl-10 uppercase text-[10px] tracking-widest text-slate-400">Entry Reference</TableHead>
                <TableHead className="font-black py-8 uppercase text-[10px] tracking-widest text-slate-400">Subject Matrix</TableHead>
                <TableHead className="font-black py-8 uppercase text-[10px] tracking-widest text-slate-400">Allocated Specialist</TableHead>
                <TableHead className="font-black py-8 uppercase text-[10px] tracking-widest text-slate-400 text-center">Status</TableHead>
                <TableHead className="font-black py-8 uppercase text-[10px] tracking-widest text-slate-400 text-right pr-12">Action Desk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-24 animate-pulse bg-slate-50/10 border-b border-slate-50" /></TableRow>)
              ) : filtered?.length > 0 ? filtered.map((a) => (
                <TableRow key={a.id} className="group hover:bg-slate-50/30 transition-all border-b border-slate-50 last:border-0">
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-xs font-black uppercase text-indigo-600 leading-none mb-1">{a.time_slot}</span>
                        <Ticket size={14} className="text-slate-200" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                          {new Date(a.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Confirmed</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-2xl shadow-slate-900/10">
                        {a.patients?.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg tracking-tight mb-1">{a.patients?.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-indigo-500 font-black tracking-tight">{a.patients?.registration_no}</span>
                          <span className="flex items-center gap-1.5 font-black"> <Phone size={10} className="text-teal-600" /> {a.patients?.phone} </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shadow-inner border border-teal-100">
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-700 leading-none mb-1.5 uppercase tracking-tighter">Dr. {a.profiles?.full_name}</div>
                        <div className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{a.profiles?.department}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`h-8 px-4 rounded-xl font-black text-[9px] tracking-widest border-0 flex items-center justify-center min-w-[100px] gap-2 ${
                      a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 
                      a.status === 'cancelled' ? 'bg-rose-50 text-rose-700 shadow-sm' : 
                      'bg-indigo-50 text-indigo-700 shadow-sm'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'completed' ? 'bg-emerald-500' : a.status === 'cancelled' ? 'bg-rose-500' : 'bg-indigo-500 animate-pulse'}`} />
                      {a.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-12">
                     <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-12 w-12 rounded-2xl text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 shadow-sm"
                          onClick={() => setSelectedTicket(a)}
                          title="Print Ticket"
                        >
                           <Printer size={18} />
                        </Button>
                        {a.status === 'scheduled' && (
                          <Button 
                           className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-2xl border-0 shadow-xl shadow-emerald-600/20 text-[10px] uppercase tracking-widest"
                           onClick={() => updateStatus.mutate({ id: a.id, status: 'completed' })}
                          >
                           Arrival Marked
                         </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-12 w-12 text-slate-300 hover:text-rose-500 rounded-2xl"
                          onClick={() => { if(confirm('Abort session?')) updateStatus.mutate({ id: a.id, status: 'cancelled' }) }}
                        >
                          <X size={20} />
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center bg-slate-50/10">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-10">
                      <CalendarDays size={100} className="text-slate-900" />
                      <p className="text-slate-900 font-black uppercase tracking-widest text-sm">Registry Clear</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Booking Modal */}
      {isBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-xl border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500">
            <CardHeader className="bg-slate-900 text-white p-10 relative">
              <button 
                onClick={() => setIsBooking(false)}
                className="absolute top-10 right-10 text-slate-400 hover:text-white transition-colors"
                disabled={bookAppt.isPending}
              >
                <X size={24} />
              </button>
              <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-4">
                <Calendar className="text-indigo-400" />
                Resource Allocation
              </CardTitle>
              <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Specialist Time Slot Booking</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              {bookingError && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 font-black text-xs uppercase tracking-tight animate-shake">
                  <AlertTriangle size={24} />
                  {bookingError}
                </div>
              )}

              <div className="space-y-8">
                {/* Patient Selection */}
                <div className="space-y-4 relative">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Subject Authorization</label>
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <Input 
                      placeholder="Identify patient by name or ID..." 
                      className="pl-16 h-16 bg-slate-50 border-0 rounded-[1.5rem] font-black text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={bookingForm.patient_query}
                      onChange={e => setBookingForm({...bookingForm, patient_query: e.target.value, patient_id: ''})}
                    />
                  </div>
                  {searchResults?.length > 0 && !bookingForm.patient_id && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-3xl border border-slate-100 z-[110] divide-y overflow-hidden ring-4 ring-slate-900/5">
                      {searchResults.map(p => (
                        <div 
                          key={p.id} 
                          className="p-6 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                          onClick={() => setBookingForm({...bookingForm, patient_id: p.id, patient_query: p.full_name})}
                        >
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {p.full_name?.[0]}
                             </div>
                             <div>
                               <div className="font-black text-slate-900 text-lg tracking-tight">{p.full_name}</div>
                               <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{p.registration_no}</div>
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Doctor */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Medical Specialist</label>
                    <div className="relative">
                       <Stethoscope className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                       <select 
                        className="w-full h-16 rounded-[1.5rem] bg-slate-50 border-0 pl-16 pr-6 font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 appearance-none transition-all uppercase text-xs tracking-widest"
                        value={bookingForm.doctor_id}
                        onChange={e => setBookingForm({...bookingForm, doctor_id: e.target.value})}
                      >
                        <option value="">Select Doctor</option>
                        {doctors?.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.department})</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Date */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Visit Timeline</label>
                    <div className="relative">
                       <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                       <Input 
                        type="date" 
                        className="h-16 bg-slate-50 border-0 rounded-[1.5rem] pl-16 font-black uppercase tracking-widest text-xs focus:ring-4 focus:ring-indigo-500/10"
                        value={bookingForm.date}
                        onChange={e => setBookingForm({...bookingForm, date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Time Slot */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Available Allocation Slots</label>
                  <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setBookingForm({...bookingForm, time_slot: slot})}
                        className={`h-12 rounded-xl text-[10px] font-black transition-all border-2 uppercase tracking-widest ${
                          bookingForm.time_slot === slot 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-105' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-10 bg-slate-50 flex justify-end">
              <Button 
                className="w-full h-16 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-3xl border-0 shadow-3xl shadow-indigo-600/30 gap-4 text-sm uppercase tracking-widest transition-all"
                disabled={!bookingForm.patient_id || !bookingForm.doctor_id || !bookingForm.time_slot || bookAppt.isPending}
                onClick={() => bookAppt.mutate({
                  patient_id: bookingForm.patient_id,
                  doctor_id: bookingForm.doctor_id,
                  date: bookingForm.date,
                  time_slot: bookingForm.time_slot,
                  status: 'scheduled'
                })}
              >
                {bookAppt.isPending ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                Authorize & Confirm Booking
              </Button>
            </div>
          </Card>
        </div>
      )}

      {selectedTicket && <AppointmentTicket appointment={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  )
}
