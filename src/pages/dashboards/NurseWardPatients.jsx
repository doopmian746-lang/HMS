import { useState } from 'react'
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

export default function NurseWardPatients() {
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch only active ward assignments for the current nurse
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['ward-patients-nurse', profile?.id],
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

  const filtered = assignments?.filter(a => 
    a.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patients?.registration_no?.includes(searchTerm) ||
    a.ward_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ward Directory</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Patients under your clinical care</p>
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
                <TableHead className="font-bold py-5">Ward Location</TableHead>
                <TableHead className="font-bold py-5 text-center">Admission</TableHead>
                <TableHead className="font-bold py-5 text-center">Status</TableHead>
                <TableHead className="font-bold py-5 text-right pr-6">Clinical Actions</TableHead>
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
                <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors">
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
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-2 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase border border-slate-200 tracking-tight">
                        {a.ward_name}
                      </div>
                      <Badge variant="secondary" className="bg-teal-50 text-teal-700 font-black border-0 text-[10px]">
                        BED {a.bed_number}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex flex-col items-center">
                      <Calendar size={12} className="mb-1 text-slate-300" />
                      {new Date(a.admitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="success" className="text-[10px] font-black uppercase tracking-widest border-0">STABLE</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 text-indigo-400">
                    <div className="flex items-center justify-end gap-2">
                       <Link to={`/dashboard/nurse/vitals/${a.patients?.id}`}>
                        <Button size="sm" className="h-10 bg-slate-900 border-0 shadow-xl shadow-slate-900/10 font-bold px-4 rounded-xl gap-2">
                          <Thermometer className="w-4 h-4" />
                          Vitals
                        </Button>
                       </Link>
                       <Link to={`/dashboard/nurse/history/${a.patients?.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-600 rounded-xl">
                          <Activity className="w-5 h-5" />
                        </Button>
                       </Link>
                       <Link to={`/dashboard/nurse/notes/${a.patients?.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-teal-600 rounded-xl">
                          <Info className="w-5 h-5" />
                        </Button>
                       </Link>
                    </div>
                  </TableCell>
                </TableRow>
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
