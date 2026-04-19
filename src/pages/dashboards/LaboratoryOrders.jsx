import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Filter, Printer, ChevronDown, 
  CheckCircle, Clock, AlertCircle, Beaker,
  Activity, ArrowRight, User, FlaskConical,
  MoreVertical, ShieldCheck
} from 'lucide-react'

export default function LaboratoryOrders() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [filterPriority, setFilterPriority] = useState('all')

  // Fetch orders with patient and doctor details
  const { data: orders, isLoading } = useQuery({
    queryKey: ['lab-orders-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patients (full_name, registration_no, age, gender)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Mutation: Update Order Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('lab_orders')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-orders-full'])
      queryClient.invalidateQueries(['lab-dashboard-stats'])
    }
  })

  // Mutation: Cancel Order
  const cancelOrder = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('lab_orders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['lab-orders-full'])
  })

  const filtered = orders?.filter(o => {
    const matchesSearch = o.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        o.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'all' || o.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 border-0 font-black text-[9px] uppercase tracking-widest px-3">Awaiting Approval</Badge>
      case 'processing': return <Badge className="bg-indigo-100 text-indigo-700 border-0 font-black text-[9px] uppercase tracking-widest px-3">In Progress</Badge>
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-700 border-0 font-black text-[9px] uppercase tracking-widest px-3">Verified Results</Badge>
      default: return <Badge className="bg-slate-100 text-slate-500 border-0 font-black text-[9px] uppercase tracking-widest px-3">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Diagnostics Registry</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Test Queue • Clinical Verification Hub</p>
        </div>
        <div className="flex gap-4 items-center">
           <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {['all', 'STAT', 'Routine'].map(p => (
                <button 
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterPriority === p ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {p}
                </button>
              ))}
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search Patient Handle..." 
                className="pl-10 h-10 w-64 bg-slate-50 border-0 rounded-xl font-bold text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Test Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3,4,5].map(i => <tr key={i}><td colSpan={5} className="h-20 animate-pulse bg-slate-50/20" /></tr>)
              ) : filtered?.length > 0 ? filtered.map((order) => (
                <React.Fragment key={order.id}>
                  <tr 
                    className={`group transition-all hover:bg-slate-50/50 cursor-pointer ${expandedId === order.id ? 'bg-teal-50/30' : ''}`}
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs uppercase shadow-sm">
                          {order.patients?.full_name?.[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-base flex items-center gap-2">
                            {order.patients?.full_name}
                            {order.priority === 'STAT' && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{order.patients?.registration_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-700 flex items-center gap-2">
                        <FlaskConical size={14} className="text-teal-500 opacity-50" />
                        {order.test_name}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className={`border-0 font-black text-[9px] uppercase tracking-widest px-3 ${order.priority === 'STAT' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                        {order.priority}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-8 py-6 text-right pr-12">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                         <Button 
                          size="sm" 
                          className="h-8 bg-white border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-600 font-black text-[9px] uppercase tracking-widest px-4 rounded-lg shadow-sm"
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'processing' })}
                          disabled={order.status !== 'pending' || updateStatusMutation.isPending}
                         >
                           Approve
                         </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-600 rounded-lg">
                           <MoreVertical size={14} />
                         </Button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === order.id && (
                    <tr className="bg-slate-50/30">
                      <td colSpan={5} className="px-8 py-8 border-b-2 border-slate-50">
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Clinical Context</h4>
                              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Age / Gender</span>
                                    <span className="font-black text-slate-900">{order.patients?.age}Y / {order.patients?.gender}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Order Time</span>
                                    <span className="font-black text-slate-900">{new Date(order.created_at).toLocaleTimeString()}</span>
                                 </div>
                                 <div className="pt-4 border-t border-slate-50">
                                    <h5 className="text-[9px] font-black text-teal-600 uppercase mb-2">Request Origin</h5>
                                    <p className="text-xs font-bold text-slate-600">Electronic Order Entry System</p>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Test Protocols</h4>
                              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Beaker size={20} /></div>
                                    <div>
                                       <div className="font-black text-slate-900">Standard SOP</div>
                                       <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Category: Diagnostics</div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4 opacity-40">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Printer size={20} /></div>
                                    <div>
                                       <div className="font-black text-slate-400">Label Printing</div>
                                       <div className="text-[10px] font-bold text-slate-300 uppercase leading-none">Barcode Pending</div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Protocol Action</h4>
                              <div className="flex flex-col gap-3">
                                 <Button className="h-14 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl border-0 shadow-lg shadow-teal-600/20 uppercase tracking-widest text-[10px] gap-2">
                                    <ShieldCheck size={16} /> Mark as Sample Collected
                                 </Button>
                                 <Button variant="outline" className="h-14 rounded-2xl border-2 border-slate-100 font-black text-rose-600 hover:bg-rose-50 hover:border-rose-200 uppercase tracking-widest text-[10px]" onClick={() => { if(confirm("Discard this clinical order?")) cancelOrder.mutate(order.id) }}>
                                    Discard Clinical Order
                                 </Button>
                              </div>
                           </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                      <flask-conical size={64} className="text-slate-900" />
                      <p className="font-black uppercase tracking-widest text-xs">Test queue is currently clear</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
