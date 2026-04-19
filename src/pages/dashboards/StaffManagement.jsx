import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, UserPlus, MoreVertical, Edit2, ShieldOff,
  UserCheck, Mail, Phone, Building2, Filter, Users, X,
  ChevronDown, ChevronUp, Briefcase, Calendar as CalendarIcon, HeartPulse, Banknote
} from 'lucide-react'

const ROLES = ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacy', 'laboratory', 'accounts']

export default function StaffManagement() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)

  // Add new staff mutation (Warning: creating auth users client side requires edge functions. We only simulate profile creation here for UI purposes)
  const addStaff = useMutation({
    mutationFn: async (data) => {
      // In a real app, you would call a Supabase Edge Function to create the user in Auth first.
      // Here we just insert into profiles with a random UUID to mimic success.
      const pseudoId = crypto.randomUUID();
      const { error } = await supabase.from('profiles').insert([{
        id: pseudoId,
        user_id: pseudoId,
        full_name: data.full_name,
        role: data.role,
        department: data.department,
        salary: data.salary,
        specialization: data.specialization,
        joining_date: data.joining_date,
        emergency_contact: data.emergency_contact,
        phone: data.phone,
        email: data.email
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
      setShowAddModal(false)
    },
    onError: (err) => {
      alert("Note: True Staff creation requires Supabase Auth Edge Functions. " + err.message);
    }
  })

  // Fetch staff profiles
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', roleFilter],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*')
      if (roleFilter !== 'all') query = query.eq('role', roleFilter)
      const { data } = await query.order('created_at', { ascending: false })
      return data || []
    }
  })

  // Toggle active status
  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
    }
  })

  const filteredStaff = staff?.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Directory</h2>
          <p className="text-sm text-slate-500 font-medium">Manage hospital personnel, roles, and access status.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-teal-600/20" onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4" />
          Add New Staff
        </Button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">Add Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              addStaff.mutate({
                email: formData.get('email'),
                full_name: formData.get('full_name'),
                role: formData.get('role'),
                department: formData.get('department'),
                salary: Number(formData.get('salary')),
                specialization: formData.get('specialization'),
                joining_date: formData.get('joining_date'),
                emergency_contact: formData.get('emergency_contact'),
                phone: formData.get('phone')
              });
            }} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <Input name="full_name" required placeholder="Dr. Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Email (For Login)</label>
                <Input name="email" type="email" required placeholder="jane@medcare.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Role</label>
                  <select name="role" required className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm focus:ring-2 focus:ring-teal-500/20">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Department</label>
                  <Input name="department" placeholder="e.g. Cardiology" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Salary (₨)</label>
                  <Input name="salary" type="number" placeholder="50000" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Joining Date</label>
                  <Input name="joining_date" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Specialization (For Doctors)</label>
                <Input name="specialization" placeholder="e.g. Interventional Cardiology" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Phone Number</label>
                  <Input name="phone" placeholder="0300-1234567" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Emergency Contact</label>
                  <Input name="emergency_contact" placeholder="Name & Phone" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" disabled={addStaff.isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
                  {addStaff.isPending ? 'Creating...' : 'Create Staff'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by name or department..." 
                className="pl-10 bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Staff Member</TableHead>
                <TableHead className="font-bold py-4">Role & Dept</TableHead>
                <TableHead className="font-bold py-4">Salary (₨)</TableHead>
                <TableHead className="font-bold py-4 text-center">Status</TableHead>
                <TableHead className="font-bold py-4 text-right pr-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16 animate-pulse bg-slate-50/30" />
                  </TableRow>
                ))
              ) : filteredStaff?.length > 0 ? filteredStaff.map((member) => (
                <React.Fragment key={member.id}>
                  <TableRow className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                          {member.full_name?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{member.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">ID: {member.id.split('-')[0]}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 uppercase text-[10px] font-bold">
                          {member.role}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Building2 className="w-3 h-3" />
                          {member.department || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-700">₨{(member.salary || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={member.is_active ? 'success' : 'destructive'}
                        className="text-[10px] py-0.5 px-2"
                      >
                        {member.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-1.5 text-xs font-bold text-teal-600 hover:bg-teal-50"
                          onClick={() => setExpandedRow(expandedRow === member.id ? null : member.id)}
                        >
                          {expandedRow === member.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          View Profile
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={member.is_active ? "h-8 w-8 text-slate-400 hover:text-red-600" : "h-8 w-8 text-slate-400 hover:text-emerald-500"}
                          onClick={() => toggleStatus.mutate({ id: member.id, status: member.is_active })}
                        >
                          {member.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRow === member.id && (
                    <TableRow className="bg-slate-50/80">
                      <TableCell colSpan={5} className="p-6">
                        <div className="grid md:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {member.email || 'No email set'}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Phone className="w-3.5 h-3.5 text-slate-400" /> {member.phone || 'No phone set'}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Details</label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {member.department || 'N/A'} Dept
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Joined: {member.joining_date || 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Info</label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <HeartPulse className="w-3.5 h-3.5 text-slate-400" /> {member.specialization || 'General Rotation'}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Banknote className="w-3.5 h-3.5 text-slate-400" /> Salary: ₨{(member.salary || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</label>
                            <p className="text-sm font-bold text-slate-700 mt-2">{member.emergency_contact || 'None specified'}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Users className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-400 font-medium">No staff members found matching your search.</p>
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
