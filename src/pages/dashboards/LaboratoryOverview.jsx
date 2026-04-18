import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Activity, Beaker, CheckCircle2, AlertOctagon, Clock, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MOCK_STATS = [
  { title: 'Pending Tests', value: '42', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { title: 'In Progress', value: '18', icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { title: 'Completed Today', value: '156', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { title: 'Critical Results', value: '3', icon: AlertOctagon, color: 'text-rose-600', bgColor: 'bg-rose-100' },
]

const WORKLOAD_DATA = [
  { name: 'Hematology', tests: 45 },
  { name: 'Biochemistry', tests: 62 },
  { name: 'Microbiology', tests: 24 },
  { name: 'Immunology', tests: 15 },
  { name: 'Urine', tests: 38 },
  { name: 'Other', tests: 12 },
]

const CRITICAL_RESULTS = [
  { id: 'RST-0921', patient: 'James Wilson', test: 'Hemoglobin', value: '6.2 g/dL', time: '10:15 AM' },
  { id: 'RST-0944', patient: 'Sarah Davis', test: 'Potassium', value: '6.8 mmol/L', time: '11:30 AM' },
  { id: 'RST-0951', patient: 'Michael Brown', test: 'Troponin I', value: '2.4 ng/mL', time: '12:45 PM' },
]

const PENDING_ORDERS = [
  { id: 'ORD-8492', patient: 'Alice Smith', test: 'Complete Blood Count', doctor: 'Dr. John Doe', time: '01:20 PM', priority: 'STAT' },
  { id: 'ORD-8493', patient: 'Robert Johnson', test: 'Lipid Profile', doctor: 'Dr. Jane Smith', time: '02:00 PM', priority: 'Routine' },
  { id: 'ORD-8494', patient: 'Emily Davis', test: 'Liver Function Test', doctor: 'Dr. Alice Brown', time: '02:15 PM', priority: 'Urgent' },
  { id: 'ORD-8495', patient: 'William Miller', test: 'Thyroid Panel', doctor: 'Dr. Bob White', time: '02:30 PM', priority: 'Routine' },
]

const SAMPLE_QUEUE = [
  { id: 'SMP-331', patient: 'Lisa Taylor', test: 'HbA1c', time: '10 Mins ago' },
  { id: 'SMP-332', patient: 'David Anderson', test: 'Renal Panel', time: '15 Mins ago' },
  { id: 'SMP-333', patient: 'Karen Thomas', test: 'Urine Culture', time: '25 Mins ago' },
]

export default function LaboratoryOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_STATS.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
                <h3 className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Workload Chart */}
        <Card className="xl:col-span-2 border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Today's Workload by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WORKLOAD_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="tests" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Critical Results Alert */}
        <Card className="border-rose-200 bg-rose-50/30">
          <CardHeader className="pb-3 border-b border-rose-100">
            <CardTitle className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-rose-100">
              {CRITICAL_RESULTS.map((result) => (
                <div key={result.id} className="p-4 hover:bg-rose-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-rose-900">{result.patient}</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-rose-100 text-rose-700 rounded-full">
                      {result.time}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-rose-800/80 mb-2">{result.test}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-rose-600 font-semibold bg-rose-100/50 px-2 rounded">
                      Value: {result.value}
                    </span>
                    <span className="text-xs text-rose-500 font-medium">({result.id})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <Card className="xl:col-span-2 border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Pending Test Orders
              </CardTitle>
              <button className="text-sm font-semibold text-teal-600 hover:text-teal-700">View All Orders</button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-bold">Patient / ID</th>
                  <th className="px-6 py-3 font-bold">Test Request</th>
                  <th className="px-6 py-3 font-bold">Doctor</th>
                  <th className="px-6 py-3 font-bold">Ordered</th>
                  <th className="px-6 py-3 font-bold">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PENDING_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{order.patient}</div>
                      <div className="text-xs text-slate-500">{order.id}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{order.test}</td>
                    <td className="px-6 py-4 text-slate-600">{order.doctor}</td>
                    <td className="px-6 py-4 text-slate-600">{order.time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        order.priority === 'STAT' ? 'bg-rose-100 text-rose-700' : 
                        order.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Sample Collection Queue */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Beaker className="w-5 h-5 text-blue-600" />
              Sample Collection Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {SAMPLE_QUEUE.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{item.patient}</div>
                    <div className="text-sm font-medium text-slate-600">{item.test}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.time} • {item.id}</div>
                  </div>
                  <button className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-2 rounded-full transition-colors">
                    <Activity className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-sm">
                Open Full Queue
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
