import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { 
  BedDouble, LogOut, Edit3, 
  MapPin, User, Calendar, CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function WardManagement() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ ward_name: '', bed_number: '' })

  // Fetch active ward assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['ward-management-nurse', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ward_assignments')
        .select(`*, patients(*)`)
        .eq('assigned_nurse_id', profile.id)
        .is('discharged_at', null)
        .order('admitted_at', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id
  })

  // Mutation to update ward/bed
  const updateAssignment = useMutation({
    mutationFn: async ({ id, ward_name, bed_number }) => {
      const { error } = await supabase
        .from('ward_assignments')
        .update({ ward_name, bed_number })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ward-management-nurse'])
      setEditingId(null)
    }
  })

  // Mutation to discharge patient
  const dischargePatient = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('ward_assignments')
        .update({ discharged_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ward-management-nurse'])
      queryClient.invalidateQueries(['nurse-stats'])
    }
  })

  const startEditing = (a) => {
    setEditingId(a.id)
    setEditForm({ ward_name: a.ward_name, bed_number: a.bed_number })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ward Management</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Bed Assignments & Discharge Registry</p>
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-3xl ring-1 ring-slate-100 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 pl-8">Patient Detail</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Ward & Bed</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 text-center">Admission</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 text-right pr-8">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2].map(i => <TableRow key={i}><TableCell colSpan={4} className="h-20 animate-pulse bg-slate-50/20" /></TableRow>)
              ) : assignments?.length > 0 ? assignments.map((a) => (
                <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black border border-slate-800 shadow-lg shadow-slate-900/10">
                        {a.patients?.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg tracking-tight">{a.patients?.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{a.patients?.registration_no}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingId === a.id ? (
                      <div className="flex items-center gap-2 max-w-xs">
                        <Input 
                          value={editForm.ward_name} 
                          onChange={e => setEditForm({...editForm, ward_name: e.target.value})}
                          className="h-9 text-xs font-bold rounded-lg border-slate-200"
                          placeholder="Ward"
                        />
                        <Input 
                          value={editForm.bed_number} 
                          onChange={e => setEditForm({...editForm, bed_number: e.target.value})}
                          className="h-9 w-20 text-xs font-bold rounded-lg border-slate-200"
                          placeholder="Bed"
                        />
                        <Button 
                          size="sm" variant="success" 
                          className="h-9 px-3 rounded-lg border-0"
                          onClick={() => updateAssignment.mutate({ id: a.id, ...editForm })}
                        >
                          <CheckCircle2 size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-100 text-slate-600 border-0 flex items-center gap-1.5 font-black text-[10px] px-3 py-1">
                          <MapPin size={12} className="text-slate-400" />
                          {a.ward_name}
                        </Badge>
                        <Badge className="bg-rose-50 text-rose-700 border-0 flex items-center gap-1.5 font-black text-[10px] px-3 py-1">
                          <BedDouble size={12} className="text-rose-400" />
                          BED {a.bed_number}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                       <Calendar size={14} className="text-slate-300 mb-1" />
                       <span className="text-[11px] font-black text-slate-700 uppercase">{new Date(a.admitted_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                        variant="soft" size="sm" 
                        className="h-10 px-4 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold gap-2 rounded-xl"
                        onClick={() => startEditing(a)}
                       >
                         <Edit3 size={16} />
                         Modify
                       </Button>
                       <Button 
                        size="sm" 
                        className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 rounded-xl border-0 shadow-lg shadow-rose-600/10"
                        onClick={() => {
                          if (confirm('Are you sure you want to mark this patient as discharged?')) {
                            dischargePatient.mutate(a.id)
                          }
                        }}
                       >
                         <LogOut size={16} />
                         Discharge
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                      <BedDouble size={64} className="text-slate-900" />
                      <p className="text-slate-900 font-black uppercase tracking-widest text-xs">No active ward assignments</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4 shadow-sm">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-black text-blue-900 text-sm tracking-tight uppercase">Ward Governance Protocol</h4>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            Discharging a patient will remove them from the active ward lists across all nursing and doctor modules. This action is final for the current admission cycle. Ensure all clearance protocols from the billing and clinical departments are met.
          </p>
        </div>
      </div>
    </div>
  )
}
