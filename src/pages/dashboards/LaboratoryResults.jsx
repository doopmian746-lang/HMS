import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, ClipboardEdit, AlertCircle, 
  CheckCircle, ChevronRight, Calculator, 
  Send, FlaskConical, Filter, RefreshCw, 
  User, Activity, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const TEST_PARAMETERS = {
  'Complete Blood Count': [
    { key: 'hemo', name: 'Hemoglobin', unit: 'g/dL', normalMin: 12, normalMax: 16 },
    { key: 'wbc', name: 'WBC Count', unit: 'cumm', normalMin: 4000, normalMax: 11000 },
    { key: 'platelets', name: 'Platelets', unit: 'lakhs/cumm', normalMin: 1.5, normalMax: 4.0 },
  ],
  'Lipid Profile': [
    { key: 'tc', name: 'Total Cholesterol', unit: 'mg/dL', normalMin: 0, normalMax: 200 },
    { key: 'ldl', name: 'LDL Cholesterol', unit: 'mg/dL', normalMin: 0, normalMax: 100 },
    { key: 'hdl', name: 'HDL Cholesterol', unit: 'mg/dL', normalMin: 40, normalMax: 60 },
  ],
  'Renal Panel': [
    { key: 'crea', name: 'Creatinine', unit: 'mg/dL', normalMin: 0.6, normalMax: 1.2 },
    { key: 'urea', name: 'Blood Urea', unit: 'mg/dL', normalMin: 15, normalMax: 45 },
  ]
}

export default function LaboratoryResults() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [results, setResults] = useState({})
  const [remarks, setRemarks] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch orders in processing state
  const { data: queue, isLoading } = useQuery({
    queryKey: ['lab-results-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*, patients(full_name, registration_no, age, gender)')
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Mutation: Submit Results
  const submitMutation = useMutation({
    mutationFn: async ({ order, results, isCritical }) => {
      // 1. Save Results
      const { error: resError } = await supabase.from('lab_results').insert([{
        order_id: order.id,
        result_value: JSON.stringify(results),
        remarks: remarks,
        is_critical: isCritical,
        technician_id: profile?.id
      }])
      if (resError) throw resError

      // 2. Complete Order
      const { error: orderError } = await supabase
        .from('lab_orders')
        .update({ status: 'completed' })
        .eq('id', order.id)
      if (orderError) throw orderError
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-results-queue'])
      queryClient.invalidateQueries(['lab-dashboard-stats'])
      setSelectedOrder(null)
      setResults({})
      setRemarks('')
    }
  })

  const handleResultChange = (key, value) => {
    setResults(prev => ({ ...prev, [key]: value }))
  }

  const evaluateFlag = (value, min, max) => {
    if (!value) return null
    const num = parseFloat(value)
    if (isNaN(num)) return null
    if (num < min) return 'Low'
    if (num > max) return 'High'
    return 'Normal'
  }

  const getOverallStatus = () => {
    if (!selectedOrder) return 'Normal'
    const params = TEST_PARAMETERS[selectedOrder.test_name] || []
    let hasCritical = false
    let hasAbnormal = false
    
    params.forEach(p => {
      const flag = evaluateFlag(results[p.key], p.normalMin, p.normalMax)
      if (flag === 'High' || flag === 'Low') {
        hasAbnormal = true
        const val = parseFloat(results[p.key])
        if (val < p.normalMin * 0.5 || val > p.normalMax * 1.5) hasCritical = true
      }
    })
    
    return hasCritical ? 'Critical' : hasAbnormal ? 'Abnormal' : 'Normal'
  }

  const status = getOverallStatus()
  const filtered = queue?.filter(q => q.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Diagnostic Terminal</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Molecular Verification • Result Integrity Verification</p>
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
           <Input 
            placeholder="Search Registry..." 
            className="pl-10 h-10 w-64 bg-slate-50 border-0 rounded-xl font-bold text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
           <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ready for Entry</h3>
           </CardHeader>
           <CardContent className="p-0 text-left">
              <div className="divide-y divide-slate-50">
                 {isLoading ? [1,2,3].map(i => <div key={i} className="h-20 animate-pulse" />) :
                  filtered?.length > 0 ? filtered.map(order => (
                    <div 
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-5 cursor-pointer transition-all hover:bg-slate-50 ${selectedOrder?.id === order.id ? 'bg-teal-50/50 ring-2 ring-inset ring-teal-600/10' : ''}`}
                    >
                       <div className="font-black text-slate-900 leading-none mb-1">{order.patients?.full_name}</div>
                       <div className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">{order.test_name}</div>
                       <div className="text-[8px] font-bold text-slate-400 uppercase">Wait: {new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                  )) : (
                    <div className="p-10 text-center opacity-30 font-black uppercase tracking-widest text-[10px]">Registry is empty</div>
                  )
                 }
              </div>
           </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
           {!selectedOrder ? (
              <Card className="h-full min-h-[400px] border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 flex flex-col items-center justify-center">
                 <FlaskConical size={64} className="text-slate-100 mb-4" />
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select an acquisition record <br/> to perform clinical entry</p>
              </Card>
           ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                 <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
                    <CardHeader className="p-10 bg-slate-900 text-white relative flex flex-row items-center justify-between">
                       <div className="text-left">
                          <h2 className="text-3xl font-black tracking-tighter mb-1">{selectedOrder.patients?.full_name}</h2>
                          <div className="flex items-center gap-4">
                             <Badge className="bg-teal-500 text-white font-black text-[9px] uppercase px-3">{selectedOrder.test_name}</Badge>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{selectedOrder.id.split('-')[0]}</div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Outcome Diagnostic</div>
                          <Badge className={`h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl ${status === 'Critical' ? 'bg-rose-500 text-white animate-pulse' : status === 'Abnormal' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                             {status === 'Critical' ? <AlertCircle className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                             {status} Outcome
                          </Badge>
                       </div>
                    </CardHeader>
                    <CardContent className="p-0">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-100">
                             <tr>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Parameter</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Measured Value</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Reference Range</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Integrity Flag</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {(TEST_PARAMETERS[selectedOrder.test_name] || []).map(p => {
                               const val = results[p.key] || ''
                               const flag = evaluateFlag(val, p.normalMin, p.normalMax)
                               return (
                                 <tr key={p.key} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-6">
                                       <div className="font-black text-slate-900">{p.name}</div>
                                       <div className="text-[10px] font-bold text-slate-400 uppercase">{p.unit}</div>
                                    </td>
                                    <td className="px-10 py-6">
                                       <Input 
                                          type="number"
                                          className="h-12 w-32 bg-slate-50 border-0 rounded-xl font-black text-lg text-center focus:ring-2 focus:ring-teal-500/20"
                                          placeholder="0.00"
                                          value={val}
                                          onChange={e => handleResultChange(p.key, e.target.value)}
                                       />
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                       <div className="text-[10px] font-black text-slate-900 underline decoration-teal-500/30 decoration-2 underline-offset-4">{p.normalMin} - {p.normalMax}</div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                       {flag && (
                                         <Badge className={`font-black text-[9px] uppercase px-3 shadow-sm ${flag === 'Normal' ? 'bg-emerald-50 text-emerald-600' : flag === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {flag} Variation
                                         </Badge>
                                       )}
                                    </td>
                                 </tr>
                               )
                             })}
                          </tbody>
                       </table>
                    </CardContent>
                    <CardFooter className="p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col items-stretch gap-6">
                       <div className="text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Technologist interpretation</label>
                          <textarea 
                            className="w-full h-24 bg-white border border-slate-200 rounded-3xl p-6 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
                            placeholder="Add clinical observation notes..."
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                          />
                       </div>
                       <div className="flex justify-end gap-3">
                          <Button variant="ghost" className="h-14 px-10 font-black uppercase text-[10px] tracking-widest rounded-2xl" onClick={() => setSelectedOrder(null)}>Discard Draft</Button>
                          <Button 
                            className={`h-14 px-12 font-black uppercase text-[10px] tracking-widest rounded-2xl border-0 shadow-2xl transition-all flex items-center gap-3 ${status === 'Critical' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'}`}
                            onClick={() => submitMutation.mutate({ order: selectedOrder, results, isCritical: status === 'Critical' })}
                            disabled={submitMutation.isPending}
                          >
                             {submitMutation.isPending ? <RefreshCw className="animate-spin" /> : <Send size={18} />}
                             {status === 'Critical' ? 'Urgent Submission' : 'Finalize Outcome'}
                          </Button>
                       </div>
                    </CardFooter>
                 </Card>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
