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
  const [genderFilter, setGenderFilter] = useState('all')
  const [ageFilter, setAgeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

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

  const filteredPatients = patients?.filter(p => {
    const matchesSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.registration_no?.includes(searchTerm)
    
    const matchesGender = genderFilter === 'all' || p.gender?.toLowerCase() === genderFilter
    
    let matchesAge = true
    const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
    if (ageFilter === 'child') matchesAge = age < 18
    else if (ageFilter === 'adult') matchesAge = age >= 18 && age < 60
    else if (ageFilter === 'senior') matchesAge = age >= 60

    return matchesSearch && matchesGender && matchesAge
  })

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
              <Button 
                variant="outline" 
                className={`gap-2 ${showFilters ? 'bg-slate-900 text-white' : 'bg-white'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                  <select 
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-bold appearance-none cursor-pointer"
                    value={genderFilter}
                    onChange={e => setGenderFilter(e.target.value)}
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Age Group</label>
                  <select 
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-bold appearance-none cursor-pointer"
                    value={ageFilter}
                    onChange={e => setAgeFilter(e.target.value)}
                  >
                    <option value="all">All Ages</option>
                    <option value="child">Child (&lt;18)</option>
                    <option value="adult">Adult (18-59)</option>
                    <option value="senior">Senior (60+)</option>
                  </select>
               </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-bold py-4">Patient Profile</TableHead>
                <TableHead className="font-bold py-4">Reg No</TableHead>
                <TableHead className="font-bold py-4">Last Visit</TableHead>
                <TableHead className="font-bold py-4 text-center">Status</TableHead>
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
                  <TableCell>
                    <div className="text-xs font-bold text-slate-600">
                       {patient.last_visit_date || 'New Admission'}
                       <div className="text-[10px] text-slate-400 font-medium">Joined: {patient.registration_date || '2024-01-01'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={patient.is_active !== false ? 'success' : 'secondary'} className="font-bold text-[10px] uppercase border-0 h-6">
                      {patient.is_active !== false ? 'Active' : 'Inactive'}
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
