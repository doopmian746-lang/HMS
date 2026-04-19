import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Package, Plus, Archive, 
  AlertCircle, ChevronRight, BarChart2,
  Filter, Calendar, Pill, X, Save,
  AlertTriangle, RefreshCw, Trash2, CheckCircle2,
  TrendingUp, TrendingDown, ClipboardList
} from 'lucide-react'

export default function PharmacyInventory() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [expiryFilter, setExpiryFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [newMedicine, setNewMedicine] = useState({
    medicine_name: '',
    generic_name: '',
    category: '',
    quantity_in_stock: '',
    unit: 'Tablets',
    expiry_date: '',
    reorder_level: '20'
  })

  // Fetch inventory
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-full'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pharmacy_inventory')
        .select('*')
        .order('medicine_name', { ascending: true })
      return data || []
    }
  })

  // Mutation: Add New Medicine
  const addMedicine = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('pharmacy_inventory').insert([data])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pharmacy-inventory-full'])
      queryClient.invalidateQueries(['pharmacy-stats'])
      setIsAdding(false)
      setNewMedicine({ medicine_name: '', generic_name: '', category: '', quantity_in_stock: '', unit: 'Tablets', expiry_date: '', reorder_level: '20' })
    }
  })

  // Mutation: Update Stock
  const updateStock = useMutation({
    mutationFn: async ({ id, quantity }) => {
      const { error } = await supabase
        .from('pharmacy_inventory')
        .update({ quantity_in_stock: quantity })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pharmacy-inventory-full'])
      queryClient.invalidateQueries(['pharmacy-stats'])
      setIsUpdating(null)
    }
  })

  // Mutation: Batch Update Reorder Level
  const batchUpdate = useMutation({
    mutationFn: async ({ ids, reorderLevel }) => {
      const { error } = await supabase
        .from('pharmacy_inventory')
        .update({ reorder_level: reorderLevel })
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      setSelectedIds([])
      setShowBatchModal(false)
      queryClient.invalidateQueries(['pharmacy-inventory-full'])
    }
  })

  // Mutation: Delete Item
  const deleteItem = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('pharmacy_inventory').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['pharmacy-inventory-full'])
  })

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => {
    if (selectedIds.length === filtered?.length) setSelectedIds([])
    else setSelectedIds(filtered?.map(i => i.id) || [])
  }

  const filtered = inventory?.filter(i => {
    const matchesSearch = i.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter
    
    let matchesExpiry = true
    if (expiryFilter !== 'all') {
      const days = Number(expiryFilter)
      const date = new Date()
      date.setDate(date.getDate() + days)
      matchesExpiry = new Date(i.expiry_date) <= date
    }

    return matchesSearch && matchesCategory && matchesExpiry
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Stock Command Center</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Global Resource Registry & Expiry Tracking</p>
        </div>
        <div className="flex gap-2">
           {selectedIds.length > 0 && (
              <Button 
                variant="outline"
                className="h-12 px-6 border-slate-200 text-slate-900 font-black rounded-2xl gap-2 hover:bg-slate-50"
                onClick={() => setShowBatchModal(true)}
              >
                Batch Edit ({selectedIds.length})
              </Button>
           )}
           <Button 
            className="h-12 px-6 bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-600/20 font-black rounded-2xl gap-2 border-0"
            onClick={() => setIsAdding(true)}
           >
             <Plus className="w-5 h-5" />
             Register Medicine
           </Button>
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <select 
                className="h-14 px-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="all">Categories: All</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesics">Analgesics</option>
              </select>
              <select 
                className="h-14 px-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                value={expiryFilter}
                onChange={e => setExpiryFilter(e.target.value)}
              >
                <option value="all">Expiry: All</option>
                <option value="30">Within 30 Days</option>
                <option value="90">Within 90 Days</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="py-6 pl-8 w-10">
                   <input 
                     type="checkbox" 
                     className="w-4 h-4 rounded border-slate-300 accent-teal-600" 
                     checked={selectedIds.length === filtered?.length && filtered?.length > 0}
                     onChange={selectAll}
                   />
                </TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Resource / Generic</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Classification</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Batch Status</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Expiry Watch</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-24 animate-pulse bg-slate-50/20" /></TableRow>)
              ) : filtered?.length > 0 ? filtered.map((item) => {
                const isLow = Number(item.quantity_in_stock) <= Number(item.reorder_level);
                return (
                  <TableRow key={item.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedIds.includes(item.id) ? 'bg-teal-50/30' : ''}`}>
                    <TableCell className="pl-8">
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 rounded border-slate-300 accent-teal-600" 
                         checked={selectedIds.includes(item.id)}
                         onChange={() => toggleSelect(item.id)}
                       />
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border shadow-lg ${
                          isLow ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-rose-200/50' : 'bg-teal-50 border-teal-100 text-teal-600 shadow-teal-200/50'
                        }`}>
                          <Pill size={22} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg tracking-tight">{item.medicine_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{item.generic_name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className="bg-slate-100 text-slate-600 border-0 font-black text-[10px] uppercase tracking-widest px-3">
                          {item.category}
                        </Badge>
                        <div className="text-[9px] font-black text-slate-300 ml-1 uppercase">{item.unit}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xl font-black tracking-tighter ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {item.quantity_in_stock}
                        </span>
                        {isLow && (
                          <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1">
                            <AlertCircle size={10} /> Critical Level
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge variant="outline" className="text-[10px] font-black border-slate-200 bg-white px-3 py-1">
                          {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'N/A'}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="h-10 bg-white border-2 border-slate-100 text-slate-900 hover:border-teal-600 hover:text-teal-600 font-black text-[10px] uppercase px-4 rounded-xl shadow-sm transition-all"
                            onClick={() => setIsUpdating(item)}
                          >
                            Adjust
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-slate-300 hover:text-rose-600 rounded-xl"
                            onClick={() => { if(confirm("Confirm deletion of this resource?")) deleteItem.mutate(item.id) }}
                          >
                            <Trash2 size={16} />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                      <Archive size={64} className="text-slate-900" />
                      <p className="text-slate-900 font-black uppercase tracking-widest text-xs">No medical resources found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Medicine Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-teal-600 text-white p-10 relative">
              <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 text-teal-100 hover:text-white transition-colors"><X size={24} /></button>
              <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-4">
                <Pill className="w-8 h-8" />
                Resource Registry
              </CardTitle>
              <CardDescription className="text-teal-100 font-medium">Add a new medical formulation to the hospital global inventory.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Brand/Medicine Name</label>
                    <Input className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" value={newMedicine.medicine_name} onChange={e => setNewMedicine({...newMedicine, medicine_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Generic Formulation</label>
                    <Input className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" value={newMedicine.generic_name} onChange={e => setNewMedicine({...newMedicine, generic_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</label>
                    <select className="w-full h-14 bg-slate-50 border-0 rounded-2xl font-bold px-4" value={newMedicine.category} onChange={e => setNewMedicine({...newMedicine, category: e.target.value})}>
                      <option value="">Select Category</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Analgesics">Analgesics</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Vaccines">Vaccines</option>
                    </select>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Initial Stock</label>
                      <Input type="number" className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" value={newMedicine.quantity_in_stock} onChange={e => setNewMedicine({...newMedicine, quantity_in_stock: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Reorder Level</label>
                      <Input type="number" className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" value={newMedicine.reorder_level} onChange={e => setNewMedicine({...newMedicine, reorder_level: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Expiry Date</label>
                    <Input type="date" className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" value={newMedicine.expiry_date} onChange={e => setNewMedicine({...newMedicine, expiry_date: e.target.value})} />
                  </div>
               </div>
            </CardContent>
            <CardFooter className="p-10 bg-slate-50 flex justify-end">
              <Button 
                className="h-14 px-12 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl border-0 shadow-2xl shadow-teal-600/20 gap-3"
                disabled={!newMedicine.medicine_name || addMedicine.isPending}
                onClick={() => addMedicine.mutate(newMedicine)}
              >
                {addMedicine.isPending ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                Confirm Registry
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isUpdating && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-slate-900 text-white p-8 relative">
              <button onClick={() => setIsUpdating(null)} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
              <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                <RefreshCw className="text-teal-400" />
                Stock Correction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Resource</div>
                  <div className="text-lg font-black text-slate-900">{isUpdating.medicine_name}</div>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">New Total Quantity</label>
                  <Input 
                    type="number" 
                    className="h-14 bg-slate-100 border-0 rounded-2xl font-black text-2xl text-center" 
                    defaultValue={isUpdating.quantity_in_stock}
                    id="stockUpdateInput"
                  />
                  <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest mt-2">Update total units currently present in warehouse</p>
               </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50 flex justify-end gap-3">
              <Button 
                className="h-12 px-8 bg-slate-900 hover:bg-black text-white font-black rounded-xl border-0"
                onClick={() => updateStock.mutate({ 
                  id: isUpdating.id, 
                  quantity: document.getElementById('stockUpdateInput').value 
                })}
              >
                Save Adjustment
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {/* Batch Edit Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-slate-900 text-white p-8 relative">
               <button onClick={() => setShowBatchModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
               <CardTitle className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Batch Meta-Update</CardTitle>
               <CardDescription className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Modifying {selectedIds.length} Medical Records</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6 text-left">
               <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                     <AlertTriangle className="text-amber-600 w-5 h-5 mt-0.5" />
                     <p className="text-[10px] font-bold text-amber-900 leading-relaxed uppercase">Attention: Changes will be applied globally to all selected resources. This action cannot be reversed.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">New Reorder Level</label>
                    <Input 
                      type="number" 
                      id="batchReorderInput"
                      defaultValue="20"
                      className="h-14 bg-slate-50 border-0 rounded-2xl font-black text-xl text-center" 
                    />
                  </div>
               </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50 flex justify-end gap-3">
               <Button 
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl border-0 shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-[11px]" 
                onClick={() => batchUpdate.mutate({ ids: selectedIds, reorderLevel: document.getElementById('batchReorderInput').value })}
               >
                  Process Batch Execution
               </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
