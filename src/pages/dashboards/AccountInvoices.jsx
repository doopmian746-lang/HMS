import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Receipt, Plus, DollarSign, 
  Filter, Download, Eye, CheckCircle2,
  Clock, XCircle, MoreVertical, X,
  Save, Trash2, User, CreditCard,
  Wallet, Landmark, ArrowRight, RefreshCw,
  PlusCircle, FileText, ChevronRight
} from 'lucide-react'

export default function AccountInvoices() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Creation State
  const [newInvoice, setNewInvoice] = useState({
    patient_id: '',
    patient_name: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  })

  // Payment State
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'Cash',
    notes: ''
  })

  // Fetch invoices with details
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['account-invoices-full', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          patients (full_name, registration_no),
          invoice_items (*)
        `)
      
      if (statusFilter !== 'all') query = query.eq('payment_status', statusFilter)
      
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Mutation: Create Invoice
  const createInvoice = useMutation({
    mutationFn: async (payload) => {
      // 1. Create Invoice
      const totalAmount = payload.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert([{
          patient_id: payload.patient_id,
          total_amount: totalAmount,
          paid_amount: 0,
          payment_status: 'unpaid'
        }])
        .select()
        .single()
      
      if (invErr) throw invErr

      // 2. Create Items
      const items = payload.items.map(i => ({
        invoice_id: inv.id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price
      }))

      const { error: itemsErr } = await supabase.from('invoice_items').insert(items)
      if (itemsErr) throw itemsErr
      
      return inv
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['account-invoices-full'])
      queryClient.invalidateQueries(['accounts-stats'])
      setShowCreateModal(false)
      setNewInvoice({ patient_id: '', patient_name: '', items: [{ description: '', quantity: 1, unit_price: 0 }] })
    }
  })

  // Mutation: Record Payment
  const recordPayment = useMutation({
    mutationFn: async ({ invoice, amount, method, notes }) => {
      const newPaidAmount = Number(invoice.paid_amount) + Number(amount)
      let status = 'partial'
      if (newPaidAmount >= Number(invoice.total_amount)) status = 'paid'

      const { error } = await supabase
        .from('invoices')
        .update({ 
          paid_amount: newPaidAmount,
          payment_status: status,
          payment_method: method
        })
        .eq('id', invoice.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['account-invoices-full'])
      queryClient.invalidateQueries(['accounts-stats'])
      setShowPaymentModal(false)
      setSelectedInvoice(null)
    }
  })

  const filtered = invoices?.filter(inv => 
    inv.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.patients?.registration_no?.includes(searchTerm) ||
    inv.id?.includes(searchTerm)
  )

  const addItem = () => {
    setNewInvoice({...newInvoice, items: [...newInvoice.items, { description: '', quantity: 1, unit_price: 0 }]})
  }

  const removeItem = (index) => {
    const items = [...newInvoice.items]
    items.splice(index, 1)
    setNewInvoice({...newInvoice, items})
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Billing & Invoices</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Accounts Receivable • Financial Records</p>
        </div>
        <div className="flex gap-2">
           <Button 
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/20 font-black rounded-xl gap-2 border-0 text-[10px] uppercase tracking-widest"
            onClick={() => setShowCreateModal(true)}
           >
             <Plus size={16} />
             Create Invoice
           </Button>
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search invoices by patient name, registration ID, or invoice handle..." 
                className="pl-12 h-14 bg-white rounded-2xl border-slate-200 shadow-sm font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  className="bg-transparent text-[11px] font-black uppercase tracking-widest focus:outline-none"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">Status: All</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-black py-6 pl-8 uppercase text-[10px] tracking-widest text-slate-400">Invoice Registry</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Patient Subject</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Total Balance</TableHead>
                <CardTitle className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Status</CardTitle>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/10" /></TableRow>)
              ) : filtered?.length > 0 ? filtered.map((inv) => (
                <TableRow key={inv.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-lg shadow-slate-100/50">
                        <Receipt size={22} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm tracking-tight mb-1">#{inv.id.split('-')[0]}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
                        {inv.patients?.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm tracking-tight">{inv.patients?.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{inv.patients?.registration_no}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                       <span className="font-black text-slate-900 text-lg tracking-tighter">₨{Number(inv.total_amount).toLocaleString()}</span>
                       <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Paid: ₨{Number(inv.paid_amount || 0).toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-0 rounded-lg ${
                        inv.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                        inv.payment_status === 'unpaid' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {inv.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                       {inv.payment_status !== 'paid' && (
                         <Button 
                           size="sm" 
                           className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl font-black text-[10px] uppercase border-0 shadow-lg shadow-emerald-600/10"
                           onClick={() => {
                             setSelectedInvoice(inv);
                             setPaymentData({...paymentData, amount: Number(inv.total_amount) - Number(inv.paid_amount)});
                             setShowPaymentModal(true);
                           }}
                         >
                           Record Payment
                         </Button>
                       )}
                       <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
                         <ChevronRight size={20} />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-10">
                      <Landmark size={64} className="text-slate-900" />
                      <p className="font-black uppercase tracking-widest text-xs">No financial records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-emerald-600 text-white p-10 relative">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-10 right-10 text-emerald-100 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <PlusCircle className="text-emerald-600 w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black tracking-tight uppercase">Generate Invoice</CardTitle>
                  <CardDescription className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest">Medical Billing System</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Patient Registry</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Enter Patient UUID or lookup Patient Record..."
                      className="h-14 pl-12 bg-slate-50 border-0 rounded-2xl font-bold shadow-inner"
                      value={newInvoice.patient_id}
                      onChange={(e) => setNewInvoice({...newInvoice, patient_id: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Billing Items</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-emerald-600 font-black gap-2 h-8 text-[10px] uppercase"
                      onClick={addItem}
                    >
                      <PlusCircle size={14} /> Add Line Item
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {newInvoice.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group">
                        <div className="col-span-6 space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                          <Input 
                            placeholder="Consultation, Medication, Test..."
                            className="bg-white border-slate-100 h-11 rounded-xl font-bold"
                            value={item.description}
                            onChange={(e) => {
                              const items = [...newInvoice.items]
                              items[index].description = e.target.value
                              setNewInvoice({...newInvoice, items})
                            }}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                          <Input 
                            type="number"
                            className="bg-white border-slate-100 h-11 rounded-xl font-bold text-center"
                            value={item.quantity}
                            onChange={(e) => {
                              const items = [...newInvoice.items]
                              items[index].quantity = Number(e.target.value)
                              setNewInvoice({...newInvoice, items})
                            }}
                          />
                        </div>
                        <div className="col-span-3 space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price (₨)</label>
                          <Input 
                            type="number"
                            className="bg-white border-slate-100 h-11 rounded-xl font-black text-emerald-600"
                            value={item.unit_price}
                            onChange={(e) => {
                              const items = [...newInvoice.items]
                              items[index].unit_price = Number(e.target.value)
                              setNewInvoice({...newInvoice, items})
                            }}
                          />
                        </div>
                        <div className="col-span-1 pb-1">
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-slate-300 hover:text-rose-500 transition-colors"
                            onClick={() => removeItem(index)}
                           >
                             <Trash2 size={16} />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </CardContent>
            <CardFooter className="p-10 bg-slate-50 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill Estimate</div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">₨{newInvoice.items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0).toLocaleString()}</div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-14 px-8 border-slate-200 text-slate-600 font-bold rounded-2xl uppercase text-[10px] tracking-widest" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button 
                  className="h-14 px-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-600/20 border-0 flex items-center gap-3"
                  onClick={() => createInvoice.mutate(newInvoice)}
                  disabled={createInvoice.isPending || !newInvoice.patient_id}
                >
                  {createInvoice.isPending ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                  Authorize Invoice
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Payment Recording Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-slate-900 text-white p-10 relative">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-10 right-10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <CreditCard className="text-white w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black tracking-tight uppercase">Record Payment</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Transaction Authorization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
               <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Pending Balance</div>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter">₨{(Number(selectedInvoice.total_amount) - Number(selectedInvoice.paid_amount)).toLocaleString()}</div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 font-black uppercase tracking-widest text-[9px] border-0 px-3">Active Record</Badge>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Payment Amount (₨)</label>
                    <Input 
                      type="number"
                      className="h-16 bg-slate-50 border-0 rounded-2xl font-black text-2xl text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Settlement Method</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['Cash', 'Card', 'Online', 'Insurance'].map(m => (
                         <button 
                          key={m}
                          className={`h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                            paymentData.method === m ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                          onClick={() => setPaymentData({...paymentData, method: m})}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Internal Notes</label>
                    <Input 
                      className="h-14 bg-slate-50 border-0 rounded-2xl font-bold"
                      placeholder="e.g. Received via digital transfer..."
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    />
                  </div>
               </div>
            </CardContent>
            <CardFooter className="p-10 pt-0 bg-white">
               <Button 
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3"
                disabled={recordPayment.isPending || paymentData.amount <= 0}
                onClick={() => recordPayment.mutate({ invoice: selectedInvoice, ...paymentData })}
               >
                 {recordPayment.isPending ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={20} />}
                 Authorize Settlement
               </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
