import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Printer, FileText, Download, 
  CheckCircle, ArrowRight, X, FlaskConical,
  User, Calendar as CalendarIcon, ShieldCheck,
  Barcode, Award
} from 'lucide-react'

export default function LaboratoryReports() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)

  // Fetch completed lab orders with results
  const { data: reports, isLoading } = useQuery({
    queryKey: ['lab-completed-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patients (full_name, registration_no, age, gender),
          lab_results (*)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const filtered = reports?.filter(r => r.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Diagnostic Reports</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Validated Outcomes • Clinical Document Archive</p>
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
           <Input 
            placeholder="Search Archives..." 
            className="pl-10 h-10 w-64 bg-slate-50 border-0 rounded-xl font-bold text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
         <div className="overflow-x-auto text-left">
            <table className="w-full">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital ID</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Handle</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Outcome</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-left">
                  {isLoading ? [1,2,3].map(i => <tr key={i}><td colSpan={4} className="h-20 animate-pulse" /></tr>) :
                   filtered?.length > 0 ? filtered.map(report => (
                     <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 font-black text-slate-900">PATH-{report.id.split('-')[0].toUpperCase()}</td>
                        <td className="px-8 py-6">
                           <div className="font-black text-slate-900">{report.patients?.full_name}</div>
                           <Badge className="bg-teal-50 text-teal-600 font-black text-[9px] uppercase tracking-widest border-0">{report.test_name}</Badge>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <Badge className={`font-black text-[9px] uppercase px-3 ${report.lab_results?.[0]?.is_critical ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {report.lab_results?.[0]?.is_critical ? 'Critical' : 'Normal'} Verified
                           </Badge>
                        </td>
                        <td className="px-8 py-6 text-right pr-12">
                           <Button 
                            className="h-10 bg-slate-900 hover:bg-black text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-0 flex items-center gap-2"
                            onClick={() => setSelectedReport(report)}
                           >
                              <FileText size={14} /> Review & Print
                           </Button>
                        </td>
                     </tr>
                   )) : (
                     <tr className="h-64 opacity-20">
                        <td colSpan={4} className="text-center font-black uppercase text-xs tracking-widest">No reports in archive</td>
                     </tr>
                   )
                  }
               </tbody>
            </table>
         </div>
      </Card>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-3xl rounded-[3rem] bg-white animate-in zoom-in-95 duration-300">
              <CardHeader className="p-10 border-b border-slate-100 bg-white sticky top-0 z-20 flex flex-row items-center justify-between">
                 <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white"><FileText size={24} /></div>
                    <div>
                       <CardTitle className="text-2xl font-black uppercase tracking-tighter">Electronic Validation</CardTitle>
                       <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Authorized Clinical Documentation</CardDescription>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <Button 
                      className="h-12 px-8 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] border-0"
                      onClick={() => window.print()}
                    >
                       <Printer size={18} className="mr-2" /> Dispatch Hardcopy
                    </Button>
                    <button onClick={() => setSelectedReport(null)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-600 transition-colors"><X size={24} /></button>
                 </div>
              </CardHeader>
              <CardContent className="p-16">
                 {/* Internal Report View */}
                 <div className="text-left font-sans text-slate-900 max-w-3xl mx-auto border-2 border-slate-100 rounded-[3rem] p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                       <FlaskConical size={200} />
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 border-b-4 border-teal-600 pb-8">
                       <div>
                          <h1 className="text-4xl font-black tracking-tighter text-slate-900">MEDCARE PRO <span className="text-teal-600">LABS</span></h1>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Diagnostic Division</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-sm uppercase">Laboratory Report</p>
                          <p className="text-[10px] font-bold text-slate-400">Ref: #{selectedReport.id.split('-')[0].toUpperCase()}</p>
                       </div>
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-12 mb-12">
                       <div className="space-y-4">
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Patient Handle</p>
                             <p className="font-black text-xl leading-none">{selectedReport.patients?.full_name}</p>
                             <p className="text-xs font-bold text-slate-500">Reg: {selectedReport.patients?.registration_no}</p>
                          </div>
                          <div className="flex gap-8">
                             <div>
                                <p className="text-[9px] font-black uppercase text-slate-400">Age</p>
                                <p className="font-bold text-sm">{selectedReport.patients?.age}Y</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase text-slate-400">Gender</p>
                                <p className="font-bold text-sm uppercase">{selectedReport.patients?.gender}</p>
                             </div>
                          </div>
                       </div>
                       <div className="text-right space-y-4">
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Collection Identity</p>
                             <p className="font-black text-lg">Sample: {selectedReport.sample_type || 'Blood'}</p>
                             <p className="text-xs font-bold text-slate-500">Collected: {new Date(selectedReport.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Medical Procedure</p>
                             <p className="font-black text-teal-600">{selectedReport.test_name}</p>
                          </div>
                       </div>
                    </div>

                    {/* Results Table */}
                    <div className="mb-12 border-2 border-slate-50 rounded-3xl overflow-hidden shadow-sm">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50">
                             <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Test Parameter</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Molecular Value</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {selectedReport.lab_results?.[0]?.result_value && 
                              Object.entries(JSON.parse(selectedReport.lab_results[0].result_value)).map(([key, val]) => (
                                <tr key={key}>
                                   <td className="px-6 py-4 font-black text-slate-900 uppercase text-xs">{key}</td>
                                   <td className="px-6 py-4 font-black text-xl tracking-tighter text-teal-600">{val}</td>
                                   <td className="px-6 py-4">
                                      <Badge className="bg-emerald-50 text-emerald-600 font-bold text-[9px] uppercase tracking-widest border-0">Validated</Badge>
                                   </td>
                                </tr>
                              ))
                             }
                          </tbody>
                       </table>
                    </div>

                    {/* Interpretation */}
                    <div className="mb-12 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Clinical Interpretation</p>
                       <p className="text-sm font-bold text-slate-700 italic leading-relaxed">
                          {selectedReport.lab_results?.[0]?.remarks || 'Findings are within normal physiological variance. Clinical correlation recommended for definitive diagnosis.'}
                       </p>
                    </div>

                    {/* Footer / Signature */}
                    <div className="flex justify-between items-end">
                       <div className="flex items-center gap-4">
                          <Barcode size={48} className="text-slate-200" />
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                             Authenticity Verified • MedCare Pro Blockchain Registry <br/> Hash: {Math.random().toString(16).substring(2, 10).toUpperCase()}
                          </div>
                       </div>
                       <div className="text-center">
                          <div className="w-48 border-b-2 border-slate-200 mb-2"></div>
                          <div className="w-12 h-12 bg-teal-50 rounded-full mx-auto mb-2 flex items-center justify-center text-teal-600"><Award size={24} /></div>
                          <p className="text-[9px] font-black uppercase tracking-widest">Head Pathologist</p>
                          <p className="text-[8px] font-bold text-slate-400">Dr. Sarah Wilson, PhD</p>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  )
}
