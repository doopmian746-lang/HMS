import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Search, Beaker, Check, X, AlertTriangle, Printer, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const MOCK_QUEUE = [
  { id: 'ORD-8492', patient: 'Alice Smith', test: 'Complete Blood Count', sampleType: 'Blood', reqTime: '10 mins ago', status: 'Pending' },
  { id: 'ORD-8496', patient: 'David Anderson', test: 'Renal Panel', sampleType: 'Blood', reqTime: '15 mins ago', status: 'Pending' },
  { id: 'ORD-8501', patient: 'Michael Brown', test: 'Liver Function Test', sampleType: 'Blood', reqTime: '30 mins ago', status: 'Pending' },
]

const MOCK_COLLECTED = [
  { id: 'ORD-8493', patient: 'Robert Johnson', test: 'Lipid Profile', sampleType: 'Blood', collTime: '02:10 PM', collector: 'Staff User', condition: 'Good' },
  { id: 'ORD-8497', patient: 'Karen Thomas', test: 'Urine Culture', sampleType: 'Urine', collTime: '02:45 PM', collector: 'Staff User', condition: 'Good' },
]

export default function LaboratorySamples() {
  const { profile } = useAuth()
  const [queue, setQueue] = useState(MOCK_QUEUE)
  const [collected, setCollected] = useState(MOCK_COLLECTED)
  const [activeTab, setActiveTab] = useState('queue') // 'queue' or 'collected'
  
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [collectionState, setCollectionState] = useState({ condition: 'Good', rejectReason: '' })

  const handleMarkCollected = () => {
    if (!selectedOrder) return

    const newCollected = {
      ...selectedOrder,
      collTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      collector: profile?.full_name || 'Staff User',
      condition: collectionState.condition,
      rejectReason: collectionState.rejectReason
    }

    setCollected([newCollected, ...collected])
    setQueue(queue.filter(q => q.id !== selectedOrder.id))
    setSelectedOrder(null)
    setCollectionState({ condition: 'Good', rejectReason: '' })
  }

  const handlePrintLabel = (e, order) => {
    e.stopPropagation()
    alert(`|||| || |||||||||||||||| |||||\n[BARCODE]\n${order.id} | ${order.patient}\n${order.test} | ${order.sampleType}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sample Collection</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage active test queues and physical sample integrity</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'queue' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pending Queue ({queue.length})
          </button>
          <button 
            onClick={() => setActiveTab('collected')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'collected' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Recently Collected
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {activeTab === 'queue' ? <Clock className="w-5 h-5 text-indigo-600" /> : <Beaker className="w-5 h-5 text-teal-600" />}
                {activeTab === 'queue' ? 'Attention Required' : 'Collected Samples'}
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search patient..." className="pl-8 h-8 text-sm w-48 bg-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === 'queue' ? (
              <div className="divide-y divide-slate-100">
                {queue.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Check className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-600">Queue empty</p>
                  </div>
                ) : (
                  queue.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedOrder(item)}
                      className={`p-4 flex items-center justify-between transition-colors cursor-pointer border-l-4 
                        ${selectedOrder?.id === item.id ? 'bg-teal-50 border-teal-500' : 'hover:bg-slate-50 border-transparent'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <Beaker className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{item.patient}</div>
                          <div className="text-sm text-slate-600">{item.test} <span className="text-slate-400">({item.sampleType})</span></div>
                          <div className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Requested {item.reqTime}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase">{item.id}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {collected.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${item.condition === 'Good' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}
                      `}>
                        {item.condition === 'Good' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">{item.patient}</div>
                        <div className="text-sm text-slate-600">{item.test} <span className="text-slate-400">({item.sampleType})</span></div>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          Collected at <span className="text-slate-700">{item.collTime}</span> by <span className="text-slate-700">{item.collector}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                       <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border
                          ${item.condition === 'Good' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}
                       `}>
                         {item.condition}
                       </span>
                       <button 
                        onClick={(e) => handlePrintLabel(e, item)}
                        className="text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Print Label"
                       >
                         <Printer className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Panel */}
        <div className="space-y-6">
          <Card className={`border-2 transition-colors ${selectedOrder ? 'border-teal-200 shadow-md' : 'border-slate-100 shadow-sm'}`}>
            <CardHeader className={`${selectedOrder ? 'bg-teal-50' : 'bg-slate-50'} pb-3`}>
              <CardTitle className="text-base font-bold text-slate-800">
                Action Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {!selectedOrder ? (
                <div className="text-center py-8">
                  <Beaker className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Select an order from the queue<br/>to record sample collection.</p>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-900">{selectedOrder.patient}</h3>
                    <p className="text-sm font-medium text-teal-700 mt-1">{selectedOrder.test}</p>
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200/60">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Order ID</div>
                        <div className="text-sm font-semibold text-slate-700">{selectedOrder.id}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sample</div>
                        <div className="text-sm font-semibold text-slate-700">{selectedOrder.sampleType}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sample Condition</label>
                    <select 
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      value={collectionState.condition}
                      onChange={(e) => setCollectionState({...collectionState, condition: e.target.value})}
                    >
                      <option value="Good">Good (Ideal)</option>
                      <option value="Hemolysed">Hemolysed (Warning)</option>
                      <option value="Insufficient">Insufficient (Warning)</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    {collectionState.condition === 'Rejected' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <textarea 
                          placeholder="Reason for rejection and re-collection notes..."
                          className="w-full p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-900 placeholder:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                          rows="3"
                          value={collectionState.rejectReason}
                          onChange={(e) => setCollectionState({...collectionState, rejectReason: e.target.value})}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={handleMarkCollected}
                      className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                        collectionState.condition === 'Rejected' 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200' 
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-200'
                      }`}
                    >
                      {collectionState.condition === 'Rejected' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      {collectionState.condition === 'Rejected' ? 'Reject & Notify' : 'Verify Collection'}
                    </button>
                    <button 
                      onClick={(e) => handlePrintLabel(e, selectedOrder)}
                      className="w-full mt-2 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Barcode Label
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
