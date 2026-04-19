import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Users, DollarSign, Wallet, Landmark,
  Printer, CheckCircle2, AlertCircle,
  FileText, ArrowDownToLine, RefreshCw,
  Search, Filter, ChevronRight, X
} from 'lucide-react'

export default function AccountPayroll() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showSlipModal, setShowSlipModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)

  // Fetch staff for payroll
  const { data: staff, isLoading } = useQuery({
    queryKey: ['accounts-payroll-staff'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*')
      return data || []
    }
  })

  // Mutation: Release Salary
  const releaseSalary = useMutation({
    mutationFn: async (staffId) => {
      // In a real app we'd create a payroll_records entry
      // For mock, we'll just simulate success
      return { success: true }
    },
    onSuccess: () => {
      alert("Salary released successfully.")
      queryClient.invalidateQueries(['accounts-payroll-staff'])
    }
  })

  const filteredStaff = staff?.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalLiability: staff?.reduce((sum, s) => sum + Number(s.salary || 0), 0) || 0,
    staffCount: staff?.length || 0,
    paidThisMonth: Math.round((staff?.length || 0) * 0.4) // Mock 40% paid
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Payroll Command</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <Users className="text-indigo-600 w-4 h-4" /> Workforce Compensation • Disbursement Registry
          </p>
        </div>
        <div className="flex gap-2 text-right">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Monthly Liability</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">₨{stats.totalLiability.toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
         <Card className="p-6 border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] bg-white ring-1 ring-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Staff</p>
            <p className="text-3xl font-black text-slate-900">{stats.staffCount}</p>
         </Card>
         <Card className="p-6 border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] bg-white ring-1 ring-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Salaries Disbursed</p>
            <p className="text-3xl font-black text-emerald-600">{stats.paidThisMonth}</p>
         </Card>
         <Card className="p-6 border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] bg-white ring-1 ring-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Discharge</p>
            <p className="text-3xl font-black text-amber-600">{stats.staffCount - stats.paidThisMonth}</p>
         </Card>
         <Card className="p-6 border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Next Cycle</p>
            <p className="text-3xl font-black tracking-tighter">01 MAY</p>
         </Card>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
           <div className="relative w-full max-w-xl">
              <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search staff by name or designation..." 
                className="pl-12 h-14 bg-white rounded-2xl border-slate-200 shadow-sm font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-black py-6 pl-10 uppercase text-[10px] tracking-widest text-slate-400">Employee Profile</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Base Salary</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Allowances</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Net Payable</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-right pr-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/10" /></TableRow>)
              ) : filteredStaff?.length > 0 ? filteredStaff.map((s) => (
                <TableRow key={s.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                  <TableCell className="pl-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-100/30">
                        <Users size={22} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm tracking-tight mb-1">{s.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          {s.role} • ID: {s.id?.split('-')[0]}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-slate-600">₨{Number(s.salary || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-emerald-600">+₨{(Number(s.salary || 0) * 0.1).toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-black text-slate-900 text-lg tracking-tighter">₨{(Number(s.salary || 0) * 1.1).toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                         size="sm" 
                         className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-black text-[10px] uppercase border-0 shadow-lg shadow-indigo-600/10 gap-2"
                         onClick={() => { if(confirm(`Release salary for ${s.full_name}?`)) releaseSalary.mutate(s.id) }}
                       >
                         Release Pay
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                        onClick={() => { setSelectedStaff(s); setShowSlipModal(true); }}
                       >
                         <Printer size={18} />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-10">
                      <Users size={64} className="text-indigo-600" />
                      <p className="font-black uppercase tracking-widest text-xs">No payroll records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Salary Slip Modal */}
      {showSlipModal && selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="w-[320px] bg-white text-slate-900 p-8 shadow-2xl rounded-lg animate-in zoom-in-95 duration-200 font-mono text-xs">
             <div className="text-center border-b-2 border-dashed border-slate-200 pb-4 mb-4">
                <h3 className="text-sm font-black uppercase tracking-tighter">MedCare Pro HMS</h3>
                <p className="font-bold">Official Salary Advice</p>
                <p className="text-[10px]">Registry: PR-{Math.random().toString(36).substring(7).toUpperCase()}</p>
             </div>
             
             <div className="space-y-1 mb-4">
                <div className="flex justify-between"><span>PERIOD:</span> <span className="font-black">APRIL 2026</span></div>
                <div className="flex justify-between"><span>EMPLOYEE:</span> <span className="font-black uppercase">{selectedStaff.full_name}</span></div>
                <div className="flex justify-between"><span>ROLE:</span> <span className="uppercase">{selectedStaff.role}</span></div>
             </div>

             <div className="border-b border-dashed border-slate-200 pb-4 mb-4 space-y-1">
                <div className="flex justify-between">
                   <span>Basic Pay:</span>
                   <span>₨{Number(selectedStaff.salary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                   <span>Medical Allowance:</span>
                   <span>+₨{(Number(selectedStaff.salary) * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                   <span>Housing Rent:</span>
                   <span>+₨{(Number(selectedStaff.salary) * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                   <span>Income Tax:</span>
                   <span>-₨{(Number(selectedStaff.salary) * 0.02).toLocaleString()}</span>
                </div>
             </div>

             <div className="space-y-1 mb-6">
                <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-100">
                   <span>NET PAYABLE:</span>
                   <span>₨{(Number(selectedStaff.salary) * 1.08).toLocaleString()}</span>
                </div>
             </div>

             <div className="text-center border-t-2 border-dashed border-slate-200 pt-4 opacity-50 space-y-1">
                <p className="uppercase text-[9px] font-bold tracking-widest">Confidential Document</p>
                <p className="uppercase text-[9px] font-bold">Accounts Division Signature</p>
                <div className="mt-4 pt-4 border-t border-slate-100 italic">Paid via Bank Transfer</div>
             </div>

             <div className="flex gap-2 mt-8 print:hidden">
                <Button variant="ghost" className="flex-1 rounded-xl h-12 font-black text-[10px] uppercase border" onClick={() => setShowSlipModal(false)}>
                  Dismiss
                </Button>
                <Button className="flex-1 bg-indigo-600 text-white rounded-xl h-12 font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20" onClick={() => window.print()}>
                  Print Slip
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
