import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Users, User, History, 
  FileText, Activity, Phone
} from 'lucide-react'

export default function DoctorPatients() {
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ['doctor-patients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .order('full_name', { ascending: true })
      return data || []
    }
  })

  const filteredPatients = patients?.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registration_no?.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h2>
          <p className="text-sm text-slate-500 font-medium">Access full medical history and records for all registered patients.</p>
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search patient database..." 
                className="pl-10 bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2 bg-white">
                <Users className="w-4 h-4" />
                All Patients
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-bold py-4">Patient Profile</TableHead>
                <TableHead className="font-bold py-4">Reg No</TableHead>
                <TableHead className="font-bold py-4 text-center">Contact</TableHead>
                <TableHead className="font-bold py-4 text-center">Medical Basics</TableHead>
                <TableHead className="font-bold py-4 text-right pr-6">Records</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16 animate-pulse bg-slate-50/20" />
                  </TableRow>
                ))
              ) : filteredPatients?.length > 0 ? filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {patient.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{patient.full_name}</div>
                        <div className="text-xs text-slate-500 font-medium">Age: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} • {patient.gender}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600">
                      {patient.registration_no}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-bold">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {patient.phone || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100 font-bold text-[10px] uppercase">
                      {patient.blood_group || 'O+'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                       <Link to={`/dashboard/doctor/patients/${patient.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-teal-600 rounded-xl">
                          <History className="w-5 h-5" />
                        </Button>
                       </Link>
                       <Link to={`/dashboard/doctor/patients/${patient.id}`}>
                        <Button size="sm" className="h-10 gap-3 bg-slate-900 border-0 shadow-xl shadow-slate-900/10 font-bold px-5 rounded-xl">
                          <Activity className="w-4 h-4" />
                          Clinical File
                        </Button>
                       </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <User className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-400 font-medium">No patients found matches your search.</p>
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
