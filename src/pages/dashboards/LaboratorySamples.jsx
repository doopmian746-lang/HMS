import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Beaker, Check, X, 
  AlertTriangle, Printer, Clock, 
  ShieldCheck, ArrowRight, User,
  FlaskConical, RefreshCw, Barcode
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function LaboratorySamples() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('queue')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [condition, setCondition] = useState('Ideal')

  // Fetch pending queue (Orders that need collection)
  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['lab-sample-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*, patients(full_name, registration_no)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Fetch collected history
  const { data: collected, isLoading: collectedLoading } = useQuery({
    queryKey: ['lab-sample-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_samples')
        .select('*, lab_orders(test_name), patients(full_name)')
        .order('collected_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data || []
    }
  })

  // Mutation: Record Collection
  const collectMutation = useMutation({
    mutationFn: async (order) => {
      // 1. Create sample record
      const { error: sampleError } = await supabase.from('lab_samples').insert([{
        order_id: order.id,
        patient_id: order.patient_id,
        sample_type: order.sample_type || 'Blood',
        status: 'collected',
        collector_id: profile?.id,
        condition: condition
      }])
      if (sampleError) throw sampleError

      // 2. Update order status
      const { error: orderError } = await supabase
        .from('lab_orders')
        .update({ status: 'processing' })
        .eq('id', order.id)
      if (orderError) throw orderError
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-sample-queue'])
      queryClient.invalidateQueries(['lab-sample-history'])
      queryClient.invalidateQueries(['lab-dashboard-stats'])
      setSelectedOrder(null)
    }
  })

  const filteredQueue = queue?.filter(q => q.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Phlebotomy Terminal</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sample Acquisition • Biological Asset Management</p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
           {['queue', 'history'].map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400'}`}
             >
               {tab === 'queue' ? `Active Queue (${queue?.length || 0})` : 'Collection Log'}
             </button>
           ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
             <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                {activeTab === 'queue' ? <Clock className="text-amber-500" /> : <ShieldCheck className="text-emerald-500" />}
                {activeTab === 'queue' ? 'Pending Samples' : 'Archived Collections'}
             </h3>
             <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Filter queue..." 
                  className="pl-10 h-10 w-48 bg-white border-slate-200 rounded-xl font-bold text-xs"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </CardHeader>
          <CardContent className="p-0">
             {activeTab === 'queue' ? (
                <div className="divide-y divide-slate-50">
                   {queueLoading ? [1,2,3].map(i => <div key={i} className="h-24 animate-pulse bg-slate-50/50" />) :
                    filteredQueue?.length > 0 ? filteredQueue.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedOrder(item)}
                        className={`p-6 flex items-center justify-between cursor-pointer transition-all ${selectedOrder?.id === item.id ? 'bg-teal-50/50 border-l-4 border-teal-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                      >
                         <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                               <Beaker size={24} />
                            </div>
                            <div>
                               <div className="font-black text-slate-900 leading-none mb-1">{item.patients?.full_name}</div>
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">#{item.id.split('-')[0]}</div>
                               <Badge className="bg-white text-teal-600 border border-teal-100 font-black text-[9px] uppercase tracking-widest">{item.test_name}</Badge>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                               <RefreshCw size={10} className="animate-spin-slow" /> Awaiting Phlebotomy
                            </div>
                            <div className="text-xs font-bold text-slate-400">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                         </div>
                      </div>
                    )) : (
                      <div className="p-20 text-center opacity-20">
                         <FlaskConical size={64} className="mx-auto mb-4" />
                         <p className="font-black uppercase tracking-widest text-xs">Phlebotomy queue is clear</p>
                      </div>
                    )
                   }
                </div>
             ) : (
                <div className="divide-y divide-slate-50">
                   {collected?.map(item => (
                     <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                        <div className="flex items-center gap-4 text-left">
                           <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Check size={18} /></div>
                           <div>
                              <div className="font-black text-slate-900">{item.patients?.full_name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.lab_orders?.test_name}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest mb-1">Batch #{item.id.split('-')[0]}</Badge>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">Verified: {new Date(item.collected_at).toLocaleTimeString()}</div>
                        </div>
                     </div>
                   ))}
                </div>
             )}
          </CardContent>
        </Card>

        {/* Action Panel */}
        <div className="space-y-6">
           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-slate-900 text-white p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                 <Barcode size={100} />
              </div>
              <h3 className="text-xl font-black mb-6 tracking-tight relative z-10">Collection Protocol</h3>
              
              {!selectedOrder ? (
                <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md relative z-10 transition-all">
                   <Beaker className="mx-auto mb-4 opacity-20" size={48} />
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Select an active order <br/> to initiate acquisition</p>
                </div>
              ) : (
                <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10 text-left">
                      <div className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1">Current Target</div>
                      <div className="font-black text-xl mb-1">{selectedOrder.patients?.full_name}</div>
                      <div className="text-[10px] font-bold text-white/60 uppercase">{selectedOrder.test_name}</div>
                   </div>

                   <div className="space-y-3 text-left">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Asset Integrity</label>
                      <select 
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                        value={condition}
                        onChange={e => setCondition(e.target.value)}
                      >
                         <option className="bg-slate-900" value="Ideal">Ideal Condition</option>
                         <option className="bg-slate-900" value="Hemolysed">Hemolysed (Danger)</option>
                         <option className="bg-slate-900" value="Insufficient">Insufficient Vol.</option>
                      </select>
                   </div>

                   <div className="flex flex-col gap-3">
                      <Button 
                        className="h-14 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl border-0 shadow-xl shadow-teal-600/20 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                        onClick={() => collectMutation.mutate(selectedOrder)}
                        disabled={collectMutation.isPending}
                      >
                         <ShieldCheck size={18} />
                         {collectMutation.isPending ? 'Syncing...' : 'Verify & Vault Sample'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-14 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                        onClick={() => alert('Printing Barcode Chain...')}
                      >
                         <Printer size={18} />
                         Thermal Label
                      </Button>
                   </div>
                </div>
              )}
           </Card>

           <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 p-8 text-left">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Integrity Standards</h4>
              <div className="space-y-4">
                 {[
                   { label: 'Asset Identification', status: 'Mandatory', icon: ShieldCheck, color: 'text-emerald-500' },
                   { label: 'Volumetric Precision', status: 'Required', icon: Activity, color: 'text-indigo-500' },
                   { label: 'Cold Chain Maintained', status: 'Optimal', icon: FlaskConical, color: 'text-teal-500' }
                 ].map((s, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-slate-50 ${s.color}`}><s.icon size={14} /></div>
                      <div>
                         <div className="text-[10px] font-black text-slate-900">{s.label}</div>
                         <div className="text-[8px] font-bold text-slate-400 uppercase leading-none">{s.status}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
