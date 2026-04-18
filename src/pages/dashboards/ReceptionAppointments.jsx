import { useState } from 'react'
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
  ChevronRight, CalendarDays
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
      // 1. Check for double booking
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

      // 2. Insert
      const { error } = await supabase.from('appointments').insert([data])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reception-appointments'])
      setIsBooking(false)
      setBookingForm({ patient_query: '', patient_id: '', doctor_id: '', date: new Date().toISOString().split('T')[0], time_slot: '' })
      setBookingError('')
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Visit Management</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Daily Clinical Appointments & Arrivals</p>
        </div>
        <div className="flex gap-2">
           <Button 
            className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 font-black rounded-2xl gap-2 border-0"
            onClick={() => setIsBooking(true)}
           >
             <Plus className="w-5 h-5" />
             Book New Patient
           </Button>
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search patient name, registration ID or doctor..." 
                className="pl-12 h-14 bg-white rounded-2xl border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white border-slate-200 text-slate-400 font-black h-14 px-4 flex items-center gap-3 rounded-2xl">
                 <Filter size={16} />
                 <select 
                    className="bg-transparent border-0 font-black text-slate-600 uppercase tracking-widest text-[10px] focus:ring-0 outline-none"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Any Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-black py-6 pl-8 uppercase text-[10px] tracking-widest text-slate-400">Date / Slot</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Patient Detail</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Physician</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Status</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-24 animate-pulse bg-slate-50/20" /></TableRow>)
              ) : filtered?.length > 0 ? filtered.map((a) => (
                <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-lg shadow-slate-200 border border-slate-100 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black uppercase text-indigo-600 leading-none mb-0.5">{a.time_slot}</span>
                        <Calendar size={12} className="text-slate-300" />
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(a.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[1rem] bg-slate-900 text-white flex items-center justify-center font-black shadow-lg shadow-slate-900/10">
                        {a.patients?.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg tracking-tight">{a.patients?.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                          <code className="text-indigo-500">{a.patients?.registration_no}</code> • 
                          <span className="flex items-center gap-1 font-black"> {a.patients?.phone} </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-700">Dr. {a.profiles?.full_name}</div>
                        <div className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{a.profiles?.department}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={
                      a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-0 font-black' : 
                      a.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-0 font-black' : 
                      'bg-indigo-50 text-indigo-700 border-0 font-black'
                    }>
                      {a.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                       {a.status === 'scheduled' && (
                         <>
                           <Button 
                            className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 rounded-xl border-0 shadow-lg shadow-emerald-600/10 text-xs"
                            onClick={() => updateStatus.mutate({ id: a.id, status: 'completed' })}
                           >
                            Arrived
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                            onClick={() => { if(confirm('Cancel appointment?')) updateStatus.mutate({ id: a.id, status: 'cancelled' }) }}
                          >
                            <X size={18} />
                          </Button>
                         </>
                       )}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                      <CalendarDays size={64} className="text-slate-900" />
                      <p className="text-slate-900 font-black uppercase tracking-widest text-xs">No matching bookings recorded</p>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-slate-900 text-white p-8 relative">
              <button 
                onClick={() => setIsBooking(false)}
                className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"
                disabled={bookAppt.isPending}
              >
                <X size={24} />
              </button>
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Calendar className="text-indigo-400" />
                Schedule Visit
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium italic">Allocate clinical resources and specialist time.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {bookingError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                  <AlertTriangle size={18} />
                  {bookingError}
                </div>
              )}

              <div className="space-y-6">
                {/* Patient Selection */}
                <div className="space-y-2 relative">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Search Patient</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Enter name or registration no..." 
                      className="pl-12 h-14 bg-slate-50 border-0 rounded-2xl font-bold"
                      value={bookingForm.patient_query}
                      onChange={e => setBookingForm({...bookingForm, patient_query: e.target.value, patient_id: ''})}
                    />
                  </div>
                  {searchResults?.length > 0 && !bookingForm.patient_id && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-10 divide-y overflow-hidden">
                      {searchResults.map(p => (
                        <div 
                          key={p.id} 
                          className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                          onClick={() => setBookingForm({...bookingForm, patient_id: p.id, patient_query: p.full_name})}
                        >
                          <div>
                            <div className="font-black text-slate-900">{p.full_name}</div>
                            <div className="text-[10px] font-black text-indigo-600 uppercase">{p.registration_no}</div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Doctor */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Specialist</label>
                    <select 
                      className="w-full h-14 rounded-2xl bg-slate-50 border-0 px-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/50"
                      value={bookingForm.doctor_id}
                      onChange={e => setBookingForm({...bookingForm, doctor_id: e.target.value})}
                    >
                      <option value="">Select Doctor</option>
                      {doctors?.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.department})</option>)}
                    </select>
                  </div>
                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Service Date</label>
                    <Input 
                      type="date" 
                      className="h-14 bg-slate-50 border-0 rounded-2xl font-bold"
                      value={bookingForm.date}
                      onChange={e => setBookingForm({...bookingForm, date: e.target.value})}
                    />
                  </div>
                </div>

                {/* Time Slot */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Available Allocation</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setBookingForm({...bookingForm, time_slot: slot})}
                        className={`h-11 rounded-xl text-xs font-black transition-all border-2 ${
                          bookingForm.time_slot === slot 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                          : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50 flex justify-end">
              <Button 
                className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl border-0 shadow-2xl shadow-indigo-600/20 gap-3"
                disabled={!bookingForm.patient_id || !bookingForm.doctor_id || !bookingForm.time_slot || bookAppt.isPending}
                onClick={() => bookAppt.mutate({
                  patient_id: bookingForm.patient_id,
                  doctor_id: bookingForm.doctor_id,
                  date: bookingForm.date,
                  time_slot: bookingForm.time_slot,
                  status: 'scheduled'
                })}
              >
                {bookAppt.isPending ? <div className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Save size={20} />}
                Confirm Booking
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
