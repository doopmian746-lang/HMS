import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Pill, Clock, CheckCircle2, 
  User, ClipboardList, Filter, ArrowRight,
  X, AlertTriangle, ShieldCheck, Activity
} from 'lucide-react'

export default function PharmacyDispense() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [error, setError] = useState('')

  // Fetch pending prescriptions with patient and doctor details
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['pharmacy-dispense-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (full_name, registration_no),
          profiles:doctor_id (full_name),
          prescription_items (*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  // Mutation to dispense prescription
  const dispenseMutation = useMutation({
    mutationFn: async (prescription) => {
      setError('')
      const items = prescription.prescription_items
      
      // 1. Check stock for ALL items first
      for (const item of items) {
        const { data: inv, error: invErr } = await supabase
          .from('pharmacy_inventory')
          .select('id, quantity_in_stock, medicine_name')
          .ilike('medicine_name', `%${item.medicine_name}%`)
          .single()

        if (invErr || !inv) throw new Error(`Stock record not found for: ${item.medicine_name}`)
        if (inv.quantity_in_stock < (item.quantity || 1)) {
          throw new Error(`Insufficient stock for ${item.medicine_name}. Required: ${item.quantity}, Available: ${inv.quantity_in_stock}`)
        }
      }

      // 2. Perform updates (In a real app, this should be a DB RPC/transaction)
      for (const item of items) {
        // Fetch current stock again to be safe
        const { data: currentInv } = await supabase
          .from('pharmacy_inventory')
          .select('quantity_in_stock')
          .ilike('medicine_name', `%${item.medicine_name}%`)
          .single()

        await supabase
          .from('pharmacy_inventory')
          .update({ quantity_in_stock: currentInv.quantity_in_stock - (item.quantity || 1) })
          .ilike('medicine_name', `%${item.medicine_name}%`)
      }

      // 3. Update prescription status
      const { error: updateErr } = await supabase
        .from('prescriptions')
        .update({ status: 'dispensed' })
        .eq('id', prescription.id)

      if (updateErr) throw updateErr

      // 4. Record dispense event
      await supabase.from('dispensing_records').insert([{
        prescription_id: prescription.id,
        notes: 'Dispensed via Pharmacy Terminal'
      }])
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pharmacy-dispense-queue'])
      queryClient.invalidateQueries(['pharmacy-stats'])
      queryClient.invalidateQueries(['pharmacy-inventory-full'])
      setSelectedPrescription(null)
    },
    onError: (err) => {
      setError(err.message)
    }
  })

  const filtered = prescriptions?.filter(p => 
    p.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patients?.registration_no?.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dispense Terminal</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Order Fulfillment • Medication Security Registry</p>
        </div>
        <div className="flex gap-2">
           <Badge className="h-10 px-4 bg-teal-50 text-teal-700 border-teal-100 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2">
             <Activity size={14} />
             Live Queue: {prescriptions?.length || 0}
           </Badge>
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Lookup patient identity or clinical registration handle..." 
                className="pl-12 h-14 bg-white rounded-2xl border-slate-200 shadow-sm font-bold"
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
                <TableHead className="font-black py-6 pl-8 uppercase text-[10px] tracking-widest text-slate-400">Order Origin</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Patient Identity</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400">Prescribing Clinician</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-center">Status</TableHead>
                <TableHead className="font-black py-6 uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Fulfillment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-20 animate-pulse bg-slate-50/20" /></TableRow>)
              ) : filtered?.length > 0 ? filtered.map((p) => (
                <TableRow key={p.id} className="group hover:bg-slate-100/50 transition-colors">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="text-[10px] text-slate-300 ml-1">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-200 shadow-sm">
                        {p.patients?.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-base">{p.patients?.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID: {p.patients?.registration_no}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-700 font-bold italic">
                      <User size={14} className="text-slate-400" />
                      Dr. {p.profiles?.full_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-amber-100 text-amber-700 border-0 font-black text-[10px] uppercase tracking-widest px-3">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button 
                      className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase px-5 rounded-xl border-0 shadow-lg shadow-emerald-600/10 gap-2"
                      onClick={() => setSelectedPrescription(p)}
                    >
                      Process Order
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                      <Pill size={64} className="text-slate-900" />
                      <p className="text-slate-900 font-black uppercase tracking-widest text-xs">Queue is currently clear</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dispense Fulfillment Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-slate-900 text-white p-10 relative">
              <button 
                onClick={() => setSelectedPrescription(null)} 
                className="absolute top-10 right-10 text-slate-400 hover:text-white transition-colors"
                disabled={dispenseMutation.isPending}
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="text-white w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black tracking-tight uppercase">Medication Dispatch</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Digital Prescription Verification</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
               {error && (
                 <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse">
                    <AlertTriangle size={18} />
                    {error}
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                 <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <User size={80} />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Name</div>
                    <div className="text-lg font-black text-slate-900">{selectedPrescription.patients?.full_name}</div>
                 </div>
                 <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic ID</div>
                    <div className="text-lg font-black text-slate-900">{selectedPrescription.patients?.registration_no}</div>
                 </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Prescribed Items</h4>
                  <div className="space-y-3">
                    {selectedPrescription.prescription_items?.map((item) => (
                      <div key={item.id} className="bg-white border-2 border-slate-100 p-5 rounded-2xl flex items-center justify-between group hover:border-emerald-600 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                            <Pill size={18} className="text-slate-400 group-hover:text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-base">{item.medicine_name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.dosage} • {item.frequency}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase">Qty</div>
                          <div className="text-lg font-black text-slate-900 tracking-tighter">{item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </CardContent>
            <CardFooter className="p-10 bg-slate-50 flex justify-end gap-3">
              <Button 
                variant="outline"
                className="h-14 px-8 border-slate-200 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest"
                onClick={() => setSelectedPrescription(null)}
                disabled={dispenseMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                className="h-14 px-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-600/20 border-0 flex items-center gap-3"
                onClick={() => dispenseMutation.mutate(selectedPrescription)}
                disabled={dispenseMutation.isPending}
              >
                {dispenseMutation.isPending ? 'Verifying Stock...' : (
                  <>
                    Authorize Dispatch
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
