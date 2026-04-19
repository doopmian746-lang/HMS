import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Calendar, Clock, CheckCircle2, 
  XCircle, Filter, ChevronRight, User, Stethoscope
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Check, Info, History, X } from 'lucide-react'

export default function DoctorAppointments() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Fetch appointments for the selected date
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['doctor-appointments-full', profile?.id, selectedDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select(`*, patients(*)`)
        .eq('date', selectedDate)
        .eq('doctor_id', profile.id)
        .order('time_slot', { ascending: true })
      return data || []
    },
    enabled: !!profile?.id
  })

  // Mutation to update appointment status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['doctor-appointments-full'])
      queryClient.invalidateQueries(['doctor-stats'])
    }
  })

  const filteredAppts = appointments?.filter(a => 
    a.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patients?.registration_no?.includes(searchTerm)
  )

  const currentPatient = appointments?.find(a => a.status === 'processing')
  const nextScheduled = appointments?.find(a => a.status === 'scheduled')

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState(null)

  const fetchHistory = async (patientId) => {
    const { data } = await supabase.from('medical_records').select('*').eq('patient_id', patientId).order('visit_date', { ascending: false })
    setSelectedHistory(data || [])
    setShowHistoryModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Schedule</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Management of patient appointments & visits</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className="w-40 h-11 font-bold border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {currentPatient && (
        <Card className="border-0 shadow-2xl shadow-teal-600/10 rounded-3xl ring-2 ring-teal-500/20 overflow-hidden bg-[radial-gradient(circle_at_top_right,_#f0fdfa_0%,_white_100%)]">
          <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-teal-600/20">
                  {currentPatient.patients?.full_name?.[0]}
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">Currently Processing</Badge>
                  <span className="text-xs font-bold text-slate-400">Slot: {currentPatient.time_slot}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{currentPatient.patients?.full_name}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  {currentPatient.patients?.registration_no} <span className="h-1 w-1 bg-slate-200 rounded-full" /> {currentPatient.patients?.gender}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-black uppercase text-[10px] tracking-widest bg-white" onClick={() => fetchHistory(currentPatient.patient_id)}>
                <History className="w-4 h-4 mr-2" />
                View Full History
              </Button>
              <Link to={`/dashboard/doctor/consultation/${currentPatient.id}`}>
                <Button className="h-12 px-8 rounded-2xl bg-teal-600 shadow-xl shadow-teal-600/20 font-black uppercase text-[10px] tracking-widest">
                  Continue Consultation
                </Button>
              </Link>
              <Button variant="ghost" className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest text-rose-600 hover:bg-rose-50" onClick={() => updateStatus.mutate({ id: currentPatient.id, status: 'completed' })}>
                Finish Visit
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <CardHeader className="bg-slate-50 p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-xl font-black tracking-tight">Patient Medical History</CardTitle>
                   <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Found {selectedHistory?.length || 0} previous encounters</CardDescription>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
             </CardHeader>
             <CardContent className="p-8 max-h-[50vh] overflow-y-auto space-y-4">
                {selectedHistory?.length > 0 ? selectedHistory.map((rec, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">{rec.visit_date}</span>
                       <Badge variant="secondary" className="text-[8px] font-black uppercase">{rec.diagnosis}</Badge>
                    </div>
                    <p className="text-xs font-bold text-slate-500 line-clamp-2">{rec.clinical_notes}</p>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <History className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No previous history found</p>
                  </div>
                )}
             </CardContent>
             <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Button className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-slate-900" onClick={() => setShowHistoryModal(false)}>Close Archive</Button>
             </div>
          </Card>
        </div>
      )}

      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Find patient by name or registration number..." 
                className="pl-10 h-12 bg-white rounded-xl border-slate-200"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-bold py-5 pl-6">Time Slot</TableHead>
                <TableHead className="font-bold py-5">Patient Identity</TableHead>
                <TableHead className="font-bold py-5 text-center">Status</TableHead>
                <TableHead className="font-bold py-5 text-right pr-6">Clinical Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="h-20 animate-pulse bg-slate-50/20" />
                  </TableRow>
                ))
              ) : filteredAppts?.length > 0 ? filteredAppts.map((apt) => (
                <TableRow key={apt.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3 font-black text-slate-900">
                      <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      {apt.time_slot}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200">
                        {apt.patients?.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 tracking-tight">{apt.patients?.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{apt.patients?.registration_no} • {apt.patients?.gender}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={apt.status === 'completed' ? 'success' : apt.status === 'cancelled' ? 'destructive' : apt.status === 'processing' ? 'outline' : 'secondary'}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-0 ${apt.status === 'processing' ? 'bg-teal-50 text-teal-700 border-teal-200 border ring-1 ring-teal-200 animate-pulse' : ''}`}
                    >
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {apt.status === 'scheduled' && (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                            onClick={() => updateStatus.mutate({ id: apt.id, status: 'completed' })}
                            title="Quick Complete"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl"
                            onClick={() => updateStatus.mutate({ id: apt.id, status: 'cancelled' })}
                            title="Cancel Appointment"
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      )}
                      
                      {apt.status === 'scheduled' && (
                        <Button 
                          size="sm" 
                          className="h-10 px-5 gap-2 bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/10 font-black uppercase text-[10px] tracking-widest rounded-xl border-0"
                          onClick={() => {
                            if (currentPatient) {
                               alert("Please finish the current visit before accepting next patient.")
                            } else {
                               updateStatus.mutate({ id: apt.id, status: 'processing' })
                            }
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Accept Next
                        </Button>
                      )}

                      {apt.status === 'processing' && (
                        <Link to={`/dashboard/doctor/consultation/${apt.id}`}>
                          <Button size="sm" className="h-10 px-5 gap-2 bg-slate-900 shadow-xl shadow-slate-900/10 font-bold rounded-xl border-0">
                            <Stethoscope className="w-4 h-4" />
                            Continue visit
                          </Button>
                        </Link>
                      )}

                      <Link to={`/dashboard/doctor/patients/${apt.patients?.id}`}>
                        <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-400 hover:text-teal-600 rounded-xl">
                          <User className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                      <Calendar className="w-16 h-16 text-slate-900" />
                      <p className="text-slate-900 font-black uppercase tracking-widest text-xs">No entries for this date</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
