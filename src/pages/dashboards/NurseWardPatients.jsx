import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, BedDouble, User, Activity, 
  ChevronRight, Thermometer, Info, Calendar
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, LogOut, Check, X } from 'lucide-react'

export default function NurseWardPatients() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandingNoteId, setExpandingNoteId] = useState(null)
  const [shiftNote, setShiftNote] = useState('')

  // Fetch only active ward assignments for the current nurse
    queryFn: async () => {
      const { data } = await supabase
        .from('ward_assignments')
        .select(`*, patients(*)`)
        .is('discharged_at', null)
        .order('admitted_at', { ascending: false })
      return data || []
    }
  })

  const dischargeMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('ward_assignments')
        .update({ discharged_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ward-patients-nurse'])
      alert("Patient discharged successfully.")
    }
  })

  const saveShiftNote = useMutation({
    mutationFn: async ({ id, note }) => {
       const { error } = await supabase
          .from('ward_assignments')
          .update({ last_nurse_note: note, last_note_at: new Date().toISOString() })
          .eq('id', id)
       if (error) throw error
    },
    onSuccess: () => {
       setExpandingNoteId(null)
       setShiftNote('')
       queryClient.invalidateQueries(['ward-patients-nurse'])
    }
  })

  const filtered = assignments?.filter(a => 
    a.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patients?.registration_no?.includes(searchTerm) ||
    a.ward_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
             <Badge className="bg-rose-100 text-rose-700 border-0 font-black px-2 py-0.5 text-[8px] uppercase tracking-widest">Zone: Surgical Unit B</Badge>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Ward Registry</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ward Management</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">Responsible Nurse: {profile?.full_name}</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search patient name, ID or ward..." 
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
                <TableHead className="font-bold py-5 pl-6">Patient / ID</TableHead>
                <TableHead className="font-bold py-5">Location & Type</TableHead>
                <TableHead className="font-bold py-5 text-center">Reason / stay</TableHead>
                <TableHead className="font-bold py-5 text-center">Last Note</TableHead>
                <TableHead className="font-bold py-5 text-right pr-6">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/20" />
                  </TableRow>
                ))
              ) : filtered?.length > 0 ? filtered.map((a) => (
                <React.Fragment key={a.id}>
                  <TableRow className="group hover:bg-slate-50/50 transition-colors border-b-0">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black border border-rose-100 shadow-sm">
                          {a.patients?.full_name?.[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 tracking-tight">{a.patients?.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{a.patients?.registration_no}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase">{a.ward_name}</span>
                          <Badge variant="secondary" className="bg-teal-50 text-teal-700 font-black border-0 text-[9px] h-5">BED {a.bed_number}</Badge>
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{a.room_type || 'STANDARD'} UNIT</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <p className="text-xs font-black text-slate-700">{a.reason_for_admission || 'General Monitoring'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                        Stay: {Math.ceil((new Date() - new Date(a.admitted_at)) / (100 * 60 * 60 * 24))} Days
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={`text-[10px] font-black border px-2 py-1 rounded-lg ${a.last_nurse_note ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {a.last_nurse_note ? 'UPDATED' : 'MISSING'}
                       </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => {
                              setExpandingNoteId(expandingNoteId === a.id ? null : a.id)
                              setShiftNote(a.last_nurse_note || '')
                           }}
                           className={`h-10 w-10 rounded-xl transition-colors ${expandingNoteId === a.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'}`}
                         >
                           <MessageSquare className="w-5 h-5" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => { if(confirm("Discharge patient?")) dischargeMutation.mutate(a.id) }}
                           className="h-10 w-10 text-slate-400 hover:text-rose-600 rounded-xl"
                         >
                           <LogOut className="w-5 h-5" />
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandingNoteId === a.id && (
                    <TableRow className="bg-indigo-50/30 border-b-2 border-indigo-100">
                      <TableCell colSpan={5} className="p-6">
                        <div className="bg-white rounded-[2rem] p-6 shadow-inner ring-1 ring-slate-100 space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Shift Progress Note</h4>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Last Updated: {a.last_note_at || 'Never'}</span>
                           </div>
                           <textarea 
                             className="w-full h-24 bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-600"
                             placeholder="Document today's patient progress, medication tolerance, and vitals summary..."
                             value={shiftNote}
                             onChange={e => setShiftNote(e.target.value)}
                           />
                           <div className="flex justify-end gap-3">
                              <Button variant="ghost" className="font-bold text-slate-500" onClick={() => setExpandingNoteId(null)}>Discard</Button>
                              <Button 
                                className="bg-indigo-600 font-bold px-6 shadow-lg shadow-indigo-600/20"
                                onClick={() => saveShiftNote.mutate({ id: a.id, note: shiftNote })}
                              >
                                {saveShiftNote.isPending ? 'Saving...' : 'Save Shift Note'}
                              </Button>
                           </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                      <BedDouble className="w-16 h-16 text-slate-900" />
                      <p className="text-slate-900 font-black uppercase tracking-widest text-xs">No active assignments</p>
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
