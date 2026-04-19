import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Wallet, Plus, DollarSign, 
  Filter, Download, CheckCircle2,
  Clock, XCircle, MoreVertical, X,
  Save, Trash2, Building, Receipt,
  FileText, TrendingDown, Paperclip,
  ShieldCheck, RefreshCw, ChevronRight
} from 'lucide-react'

export default function AccountExpenses() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newExpense, setNewExpense] = useState({
    description: '',
    category: 'Supplies',
    amount: 0,
    vendor: '',
    date: new Date().toISOString().split('T')[0]
  })

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['accounts-expenses', categoryFilter],
    queryFn: async () => {
      let query = supabase.from('expenses').select('*')
      if (categoryFilter !== 'all') query = query.eq('category', categoryFilter)
      const { data } = await query.order('date', { ascending: false })
      return data || []
    }
  })

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('expenses').insert([{ ...payload, status: 'pending' }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts-expenses'])
      setShowAddModal(false)
      setNewExpense({ description: '', category: 'Supplies', amount: 0, vendor: '', date: new Date().toISOString().split('T')[0] })
    }
  })

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('expenses').update({ status: 'approved' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['accounts-expenses'])
  })

  const filtered = expenses?.filter(e => 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalThisMonth: expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
    pendingApproval: expenses?.filter(e => e.status === 'pending').length || 0,
    criticalSpend: expenses?.filter(e => Number(e.amount) > 50000).length || 0
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Expense Ledger</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <TrendingDown className="text-rose-500 w-4 h-4" /> Operational Cost Tracking • Procurement
          </p>
        </div>
        <Button 
          className="h-12 px-8 bg-slate-900 hover:bg-black text-white shadow-2xl shadow-slate-900/20 font-black rounded-xl gap-3 border-0 text-[10px] uppercase tracking-widest"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={18} />
          Record Expenditure
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
         <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] bg-white ring-1 ring-slate-100 p-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Monthly Outflow</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">₨{stats.totalThisMonth.toLocaleString()}</p>
         </Card>
         <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] bg-white ring-1 ring-slate-100 p-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Awaiting Verification</p>
            <p className="text-3xl font-black text-amber-600 tracking-tighter">{stats.pendingApproval} Items</p>
         </Card>
         <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] bg-rose-600 text-white p-8 shadow-xl shadow-rose-600/20">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">High Value Purchases</p>
            <p className="text-3xl font-black tracking-tighter">{stats.criticalSpend} Alerts</p>
         </Card>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by description or vendor..." 
                className="pl-12 h-14 bg-white rounded-2xl border-slate-200 shadow-sm font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="h-14 px-6 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Salaries">Payroll / Salaries</option>
              <option value="Supplies">Medical Supplies</option>
              <option value="Utilities">Utilities (Elect/Water)</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Equipment">Major Equipment</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-black py-6 pl-10 uppercase text-[10px] tracking-widest text-slate-400">Transaction Info</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Vendor / Entity</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Amount</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Status</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-right pr-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/10" /></TableRow>)
              ) : filtered?.length > 0 ? filtered.map((exp) => (
                <TableRow key={exp.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                  <TableCell className="pl-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-rose-600 shadow-lg shadow-slate-100/50">
                        <Receipt size={22} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm tracking-tight mb-1">{exp.description}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {exp.category} • {exp.date}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <Building size={14} />
                      </div>
                      <span className="font-bold text-slate-900">{exp.vendor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-black text-slate-900 text-lg tracking-tighter">₨{Number(exp.amount).toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-0 rounded-lg ${
                      exp.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {exp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                       {exp.status === 'pending' && (
                         <Button 
                           size="sm" 
                           className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl font-black text-[10px] uppercase border-0 shadow-lg shadow-emerald-600/10 gap-2"
                           onClick={() => approveMutation.mutate(exp.id)}
                         >
                           <ShieldCheck size={14} /> Approve
                         </Button>
                       )}
                       <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
                         <Paperclip size={18} />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-10">
                      <Wallet size={64} className="text-slate-900" />
                      <p className="font-black uppercase tracking-widest text-xs">No expenditure records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 text-left">
          <Card className="w-full max-w-xl border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-slate-900 text-white p-12 relative">
              <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-white"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center"><Plus className="text-white w-6 h-6" /></div>
                <div>
                   <CardTitle className="text-3xl font-black uppercase tracking-tighter">Record Cost</CardTitle>
                   <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Expense Authorization Engine</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-12 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</label>
                    <select 
                      className="w-full h-14 bg-slate-50 border-0 rounded-2xl px-4 font-bold"
                      value={newExpense.category}
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    >
                      <option value="Salaries">Payroll / Salaries</option>
                      <option value="Supplies">Medical Supplies</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Equipment">Major Equipment</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Amount (₨)</label>
                    <Input 
                      type="number"
                      className="h-14 bg-slate-50 border-0 rounded-2xl font-black text-emerald-600"
                      value={newExpense.amount}
                      onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Description</label>
                  <Input 
                    placeholder="e.g. Monthly Electricity Bill, Surgical Kit Purchase..."
                    className="h-14 bg-slate-50 border-0 rounded-2xl font-bold"
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Vendor / Payee</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Enter company or individual name..."
                      className="h-14 pl-12 bg-slate-50 border-0 rounded-2xl font-bold"
                      value={newExpense.vendor}
                      onChange={e => setNewExpense({...newExpense, vendor: e.target.value})}
                    />
                  </div>
               </div>

               <Button className="w-full h-14 bg-slate-50 border-dashed border-2 border-slate-200 text-slate-400 hover:text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-2">
                  <Paperclip size={18} /> Attach Digital Receipt (PDF/JPG)
               </Button>
            </CardContent>
            <CardFooter className="p-12 pt-0 flex gap-3">
               <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => setShowAddModal(false)}>Cancel</Button>
               <Button 
                 className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-600/30 border-0"
                 onClick={() => addMutation.mutate(newExpense)}
                 disabled={!newExpense.description || !newExpense.amount}
               >
                 {addMutation.isPending ? <RefreshCw className="animate-spin" /> : <Save size={18} className="mr-2" />}
                 Authorize Record
               </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
