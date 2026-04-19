import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  X, AlertTriangle, ShieldCheck, Activity, Printer,
  FileText, Search, RefreshCw, ShoppingCart, User,
  Pill, Clock, ArrowRight
} from 'lucide-react'

export default function PharmacyDispense() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [dispensedData, setDispensedData] = useState(null)
  const [error, setError] = useState('')

  // Fetch pending prescriptions
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
      
      // Stock Verification and Deduction
      for (const item of items) {
        const { data: inv } = await supabase.from('pharmacy_inventory')
          .select('quantity_in_stock, id')
          .ilike('medicine_name', `%${item.medicine_name}%`).single()
        
        if (!inv || Number(inv.quantity_in_stock) < Number(item.quantity)) {
          throw new Error(`Insufficient stock for ${item.medicine_name}`)
        }
        
        await supabase.from('pharmacy_inventory')
          .update({ quantity_in_stock: Number(inv.quantity_in_stock) - Number(item.quantity || 1) })
          .eq('id', inv.id)
      }

      await supabase.from('prescriptions').update({ status: 'dispensed' }).eq('id', prescription.id)
      await supabase.from('dispensing_records').insert([{ prescription_id: prescription.id }])

      return prescription
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['pharmacy-dispense-queue'])
      queryClient.invalidateQueries(['pharmacy-stats'])
      queryClient.invalidateQueries(['pharmacy-inventory-full'])
      setDispensedData(data)
      setSelectedPrescription(null)
      setShowReceipt(true)
    },
    onError: (err) => setError(err.message)
  })

  const filtered = prescriptions?.filter(p => 
    p.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patients?.registration_no?.includes(searchTerm)
  )

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Dispense Terminal</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Order Fulfillment • Medication Security Registry</p>
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
          <div className="relative w-full max-w-xl text-left">
            <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Lookup patient identity or clinical registration handle..." 
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-200 shadow-sm">
                        {p.patients?.full_name?.[0]}
                      </div>
                      <div className="text-left">
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
                      className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase px-5 rounded-xl border-0 shadow-lg shadow-emerald-600/10"
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
                      <p className="font-black uppercase tracking-widest text-xs">Queue is currently clear</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Dispense Fulfillment */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-slate-900 text-white p-10 relative">
              <button onClick={() => setSelectedPrescription(null)} className="absolute top-10 right-10 text-slate-400 hover:text-white"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg"><ShieldCheck className="text-white w-7 h-7" /></div>
                <div className="text-left">
                  <CardTitle className="text-3xl font-black uppercase tracking-tighter">Medication Dispatch</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Digital Prescription Verification</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
               {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-bold uppercase">{error}</div>}
               <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</p>
                    <p className="font-black">{selectedPrescription.patients?.full_name}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prescriber</p>
                    <p className="font-black">Dr. {selectedPrescription.profiles?.full_name}</p>
                  </div>
               </div>
               <div className="space-y-3">
                  {selectedPrescription.prescription_items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border-2 border-slate-50 rounded-2xl text-left">
                       <div>
                          <p className="font-black text-slate-900">{item.medicine_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.dosage} • {item.frequency}</p>
                       </div>
                       <Badge className="bg-slate-900 text-white font-black px-3">QTY: {item.quantity}</Badge>
                    </div>
                  ))}
               </div>
            </CardContent>
            <CardFooter className="p-10 pt-0 flex gap-3">
               <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => setSelectedPrescription(null)}>Cancel</Button>
               <Button 
                className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-600/30 border-0"
                onClick={() => dispenseMutation.mutate(selectedPrescription)}
                disabled={dispenseMutation.isPending}
               >
                 {dispenseMutation.isPending ? 'Processing...' : 'Authorize Dispatch'}
               </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Modal: Thermal Receipt */}
      {showReceipt && dispensedData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="w-[300px] bg-white p-8 shadow-2xl rounded-sm font-mono text-[10px] text-slate-900">
             <div className="text-center border-b-2 border-dashed border-slate-200 pb-4 mb-4">
                <h3 className="font-black uppercase text-xs">MedCare Pro Pharmacy</h3>
                <p>Tax ID: PH-{Math.random().toString(36).substring(7).toUpperCase()}</p>
             </div>
             <div className="space-y-1 mb-4">
                <div className="flex justify-between"><span>DATE:</span> <span>{new Date().toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>PATIENT:</span> <span className="font-black">{dispensedData.patients?.full_name}</span></div>
             </div>
             <div className="border-b border-dashed border-slate-200 pb-2 mb-2">
                {dispensedData.prescription_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 uppercase">
                     <span>{item.medicine_name}</span>
                     <span>x{item.quantity}</span>
                  </div>
                ))}
             </div>
             <div className="text-center pt-4 opacity-50 italic">*** Thank You - Health First ***</div>
             <div className="flex gap-2 mt-8 print:hidden">
                <Button variant="ghost" className="flex-1 h-10 font-black text-[10px] uppercase border" onClick={() => setShowReceipt(false)}>Close</Button>
                <Button className="flex-1 bg-slate-900 text-white h-10 font-black text-[10px] uppercase" onClick={() => window.print()}>Print</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
