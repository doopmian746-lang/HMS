import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Search, ClipboardEdit, AlertCircle, CheckCircle, ChevronRight, Calculator, Send } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const PENDING_RESULTS = [
  { id: 'ORD-8493', patient: 'Robert Johnson', testDetails: { name: 'Complete Blood Count', type: 'cbc' }, time: '02:10 PM' },
  { id: 'ORD-8510', patient: 'Susan Clarke', testDetails: { name: 'Lipid Profile', type: 'lipid' }, time: '03:15 PM' },
]

const TEST_PARAMETERS = {
  cbc: [
    { key: 'hemo', name: 'Hemoglobin', unit: 'g/dL', normalMin: 12, normalMax: 16 },
    { key: 'wbc', name: 'WBC Count', unit: 'cumm', normalMin: 4000, normalMax: 11000 },
    { key: 'platelets', name: 'Platelets', unit: 'lakhs/cumm', normalMin: 1.5, normalMax: 4.0 },
    { key: 'rbc', name: 'RBC Count', unit: 'mill/cumm', normalMin: 4.5, normalMax: 5.5 },
  ],
  lipid: [
    { key: 'tc', name: 'Total Cholesterol', unit: 'mg/dL', normalMin: 0, normalMax: 200 },
    { key: 'ldl', name: 'LDL Cholesterol', unit: 'mg/dL', normalMin: 0, normalMax: 100 },
    { key: 'hdl', name: 'HDL Cholesterol', unit: 'mg/dL', normalMin: 40, normalMax: 60 },
    { key: 'tg', name: 'Triglycerides', unit: 'mg/dL', normalMin: 0, normalMax: 150 },
  ]
}

export default function LaboratoryResults() {
  const { profile } = useAuth()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [results, setResults] = useState({})
  const [remarks, setRemarks] = useState('')
  const [overallStatus, setOverallStatus] = useState('Normal') // Normal, Abnormal, Critical

  useEffect(() => {
    if (selectedOrder) {
      setResults({})
      setRemarks('')
      setOverallStatus('Normal')
    }
  }, [selectedOrder])

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

  // Recalculate overall status
  useEffect(() => {
    if (!selectedOrder) return
    const params = TEST_PARAMETERS[selectedOrder.testDetails.type]
    let hasAbnormal = false
    let hasCritical = false
    
    params.forEach(p => {
      const flag = evaluateFlag(results[p.key], p.normalMin, p.normalMax)
      if (flag === 'Low' || flag === 'High') {
        hasAbnormal = true
        // Simulate critical check (e.g. 50% out of range)
        const val = parseFloat(results[p.key])
        if (val < p.normalMin * 0.5 || val > p.normalMax * 1.5) {
          hasCritical = true
        }
      }
    })

    if (hasCritical) setOverallStatus('Critical')
    else if (hasAbnormal) setOverallStatus('Abnormal')
    else setOverallStatus('Normal')
  }, [results, selectedOrder])

  const handleSubmit = () => {
    if (overallStatus === 'Critical') {
      alert(`CRITICAL ALERT SENT TO DOCTOR!\nTest Results for ${selectedOrder.patient} have been submitted.`)
    } else {
      alert(`Results saved successfully for ${selectedOrder.patient}`)
    }
    
    // Process submit logic here (remove from list, etc)
    setSelectedOrder(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Result Entry</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Input test parameters and verify clinical outcomes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Pending List */}
        <Card className="lg:col-span-1 border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-bold text-slate-700">Ready for Entry</CardTitle>
            <div className="mt-3 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search..." className="pl-8 h-8 text-xs bg-white" />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[600px] divide-y divide-slate-100">
            {PENDING_RESULTS.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedOrder(item)}
                className={`p-4 cursor-pointer transition-colors border-l-4 ${selectedOrder?.id === item.id ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-slate-50 border-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-slate-900 text-sm">{item.patient}</div>
                  <ChevronRight className={`w-4 h-4 ${selectedOrder?.id === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
                <div className="text-xs font-medium text-slate-600 truncate">{item.testDetails.name}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-2">{item.id} • {item.time}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Side: Data Entry Form */}
        <div className="lg:col-span-3">
          {!selectedOrder ? (
            <Card className="border-slate-200 h-full min-h-[400px] flex items-center justify-center bg-slate-50/50">
              <div className="text-center">
                <ClipboardEdit className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-500 mb-1">No Order Selected</h3>
                <p className="text-sm text-slate-400">Select a patient from the list to enter test results</p>
              </div>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white rounded-t-xl">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedOrder.patient}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">{selectedOrder.testDetails.name}</span>
                    <span className="text-sm text-slate-500 font-medium">ID: {selectedOrder.id}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overall Status</div>
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm inline-flex items-center gap-2
                    ${overallStatus === 'Normal' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                      overallStatus === 'Abnormal' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                      'bg-rose-600 text-white shadow-rose-200 animate-pulse'}`}
                  >
                    {overallStatus === 'Critical' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {overallStatus}
                  </span>
                </div>
              </div>

              <div className="p-0 bg-slate-50/50">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100/50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Parameter</th>
                      <th className="px-6 py-4">Observed Value</th>
                      <th className="px-6 py-4">Unit</th>
                      <th className="px-6 py-4">Normal Range</th>
                      <th className="px-6 py-4">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 bg-white">
                    {TEST_PARAMETERS[selectedOrder.testDetails.type].map((param) => {
                      const value = results[param.key] || ''
                      const flag = evaluateFlag(value, param.normalMin, param.normalMax)
                      
                      return (
                        <tr key={param.key} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-semibold text-slate-800">{param.name}</td>
                          <td className="px-6 py-4">
                            <Input 
                              type="number"
                              className={`w-32 h-10 font-bold text-base transition-all
                                ${flag === 'Low' ? 'border-blue-300 bg-blue-50 text-blue-800 focus:ring-blue-500' : 
                                  flag === 'High' ? 'border-rose-300 bg-rose-50 text-rose-800 focus:ring-rose-500' : 
                                  value ? 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-500' : 'bg-white'}`}
                              value={value}
                              onChange={(e) => handleResultChange(param.key, e.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{param.unit}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {param.normalMin} - {param.normalMax}
                          </td>
                          <td className="px-6 py-4">
                            {flag && (
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider
                                ${flag === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 
                                  flag === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}
                              >
                                {flag}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-white border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Remarks / Interpretation</label>
                    <textarea 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-24"
                      placeholder="Add any technical remarks or clinical interpretations..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Verified By:</span>
                        <span className="font-bold text-slate-900">{profile?.full_name || 'Staff Technologist'}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-medium text-slate-700">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleSubmit}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                        ${overallStatus === 'Critical' 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
                    >
                      <Send className="w-5 h-5" />
                      {overallStatus === 'Critical' ? 'Submit & Trigger Alert' : 'Verify & Submit Results'}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
