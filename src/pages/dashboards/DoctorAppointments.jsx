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
                      variant={apt.status === 'completed' ? 'success' : apt.status === 'cancelled' ? 'destructive' : 'secondary'}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1 border-0"
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
                      
                      <Link to={`/dashboard/doctor/consultation/${apt.id}`}>
                        <Button size="sm" className="h-10 px-5 gap-2 bg-slate-900 shadow-xl shadow-slate-900/10 font-bold rounded-xl border-0">
                          <Stethoscope className="w-4 h-4" />
                          Visit
                        </Button>
                      </Link>

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
