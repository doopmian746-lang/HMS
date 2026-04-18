import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Search, Filter, Printer, ChevronDown, CheckCircle, Clock, AlertCircle, Calendar as CalendarIcon, Beaker } from 'lucide-react'

const MOCK_ORDERS = [
  { 
    id: 'ORD-8492', patientId: 'PT-1033', patientName: 'Alice Smith', doctor: 'Dr. John Doe', 
    testName: 'Complete Blood Count', priority: 'STAT', sampleType: 'Blood', 
    orderedAt: '2023-10-25 01:20 PM', status: 'Ordered',
    details: { age: 45, gender: 'Female', ward: 'General Ward A', diagnosis: 'Anemia evaluation' }
  },
  { 
    id: 'ORD-8493', patientId: 'PT-1088', patientName: 'Robert Johnson', doctor: 'Dr. Jane Smith', 
    testName: 'Lipid Profile', priority: 'Routine', sampleType: 'Blood', 
    orderedAt: '2023-10-25 02:00 PM', status: 'Sample Collected',
    details: { age: 52, gender: 'Male', ward: 'OPD', diagnosis: 'Routine Checkup' }
  },
  { 
    id: 'ORD-8494', patientId: 'PT-1102', patientName: 'Emily Davis', doctor: 'Dr. Alice Brown', 
    testName: 'Liver Function Test', priority: 'Urgent', sampleType: 'Blood', 
    orderedAt: '2023-10-25 02:15 PM', status: 'Processing',
    details: { age: 38, gender: 'Female', ward: 'ICU', diagnosis: 'Jaundice' }
  },
  { 
    id: 'ORD-8495', patientId: 'PT-0921', patientName: 'William Miller', doctor: 'Dr. Bob White', 
    testName: 'Throat Swab Culture', priority: 'Routine', sampleType: 'Swab', 
    orderedAt: '2023-10-25 02:30 PM', status: 'Completed',
    details: { age: 24, gender: 'Male', ward: 'OPD', diagnosis: 'Pharyngitis' }
  },
  { 
    id: 'ORD-8496', patientId: 'PT-1822', patientName: 'David Anderson', doctor: 'Dr. Sarah Lee', 
    testName: 'Renal Panel', priority: 'Urgent', sampleType: 'Blood', 
    orderedAt: '2023-10-25 03:00 PM', status: 'Ordered',
    details: { age: 61, gender: 'Male', ward: 'Ward B', diagnosis: 'CKD Follow-up' }
  },
  { 
    id: 'ORD-8497', patientId: 'PT-2011', patientName: 'Karen Thomas', doctor: 'Dr. Michael Chen', 
    testName: 'Urine Culture', priority: 'Routine', sampleType: 'Urine', 
    orderedAt: '2023-10-25 03:15 PM', status: 'Sample Collected',
    details: { age: 33, gender: 'Female', ward: 'OPD', diagnosis: 'UTI Symptoms' }
  },
]

export default function LaboratoryOrders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  const filteredOrders = MOCK_ORDERS.filter(order => {
    const matchesSearch = order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'All' || order.priority === filterPriority
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus
    return matchesSearch && matchesPriority && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ordered': return 'bg-slate-100 text-slate-700'
      case 'Sample Collected': return 'bg-blue-100 text-blue-700'
      case 'Processing': return 'bg-amber-100 text-amber-700'
      case 'Completed': return 'bg-emerald-100 text-emerald-700'
      case 'Cancelled': return 'bg-rose-100 text-rose-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'STAT': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'Urgent': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'Routine': return 'bg-slate-100 text-slate-700 border-slate-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const handlePrintLabel = (e, order) => {
    e.stopPropagation()
    alert(`Printing label for ${order.id} - ${order.patientName}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Test Orders</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search Orders or Patients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64 bg-white"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="STAT">STAT</option>
            </select>

            <select 
              className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Ordered">Ordered</option>
              <option value="Sample Collected">Sample Collected</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
            </select>
            
            <button className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 uppercase text-xs tracking-wider">Order Details</th>
                <th className="px-6 py-4 uppercase text-xs tracking-wider">Patient</th>
                <th className="px-6 py-4 uppercase text-xs tracking-wider">Test Information</th>
                <th className="px-6 py-4 uppercase text-xs tracking-wider">Date & Time</th>
                <th className="px-6 py-4 uppercase text-xs tracking-wider">Status</th>
                <th className="px-6 py-4 uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-600">No orders found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr 
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${expandedId === order.id ? 'bg-slate-50 shadow-inner' : ''}`}
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{order.id}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${getPriorityColor(order.priority)}`}>
                            {order.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{order.patientName}</div>
                        <div className="text-xs text-slate-500">{order.patientId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 whitespace-nowrap">{order.testName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Sample: {order.sampleType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700">{order.orderedAt.split(' ')[0]}</div>
                        <div className="text-xs text-slate-500">{order.orderedAt.split(' ').slice(1).join(' ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => handlePrintLabel(e, order)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                            title="Print Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {expandedId === order.id && (
                      <tr>
                        <td colSpan="6" className="px-0 py-0 border-b border-slate-200">
                          <div className="bg-slate-50/50 p-6 shadow-inner animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Patient Info */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                  Patient Information
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Name:</span>
                                    <span className="font-medium text-slate-900">{order.patientName}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Patient ID:</span>
                                    <span className="font-medium text-slate-900">{order.patientId}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Age / Gender:</span>
                                    <span className="font-medium text-slate-900">{order.details.age} yrs / {order.details.gender}</span>
                                  </div>
                                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                                    <span className="text-slate-500">Location:</span>
                                    <span className="font-medium text-slate-900">{order.details.ward}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Clinical Info */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                  Clinical Request
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 h-full">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Doctor:</span>
                                    <span className="font-medium text-slate-900">{order.doctor}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Diagnosis:</span>
                                    <span className="font-medium text-slate-900">{order.details.diagnosis}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Order Timeline or Actions */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                  Order Timeline
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                  <div className="relative pl-6 space-y-4">
                                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200"></div>
                                    
                                    <div className="relative">
                                      <div className="absolute -left-[27px] w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white">
                                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                                      </div>
                                      <div className="text-sm font-medium text-slate-900">Order Placed</div>
                                      <div className="text-xs text-slate-500">{order.orderedAt}</div>
                                    </div>

                                    <div className="relative">
                                      <div className={`absolute -left-[27px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${order.status !== 'Ordered' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                        <Beaker className={`w-3 h-3 ${order.status !== 'Ordered' ? 'text-blue-600' : 'text-slate-400'}`} />
                                      </div>
                                      <div className={`text-sm font-medium ${order.status !== 'Ordered' ? 'text-slate-900' : 'text-slate-400'}`}>Sample Collected</div>
                                    </div>
                                    
                                    <div className="relative">
                                      <div className={`absolute -left-[27px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${order.status === 'Completed' || order.status === 'Processing' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                                        <Activity className={`w-3 h-3 ${order.status === 'Completed' || order.status === 'Processing' ? 'text-amber-600' : 'text-slate-400'}`} />
                                      </div>
                                      <div className={`text-sm font-medium ${order.status === 'Completed' || order.status === 'Processing' ? 'text-slate-900' : 'text-slate-400'}`}>Processing</div>
                                    </div>

                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                              <button 
                                onClick={(e) => handlePrintLabel(e, order)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 hover:text-teal-600 transition-colors flex items-center gap-2 text-sm shadow-sm"
                              >
                                <Printer className="w-4 h-4" />
                                Print Label
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
