import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { 
  FlaskConical, Calendar, User, Search, FileText, 
  CheckCircle2, AlertTriangle, ArrowRight,
  Filter, MoreVertical, X, Printer, ShieldCheck,
  RefreshCw, TrendingUp, Info
} from 'lucide-react'

export default function DoctorLabResults() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [selectedReport, setSelectedReport] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: results, isLoading } = useQuery({
    queryKey: ['doctor-lab-results', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lab_results')
        .select(`
          *,
          lab_orders!inner (
            test_name,
            ordered_date,
            doctor_id,
            final_status,
            patients (
              full_name,
              registration_no,
              gender,
              age
            )
          )
        `)
        .eq('lab_orders.doctor_id', profile.id)
        .order('result_date', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id
  })

  const markReviewed = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('lab_results')
        .update({ reviewed_by_doctor: true, reviewed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['doctor-lab-results'])
    }
  })

  const filteredResults = results?.filter(r => 
    r.lab_orders?.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.lab_orders?.test_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ReportModal = ({ report, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
       <Card className="w-full max-w-3xl rounded-[3rem] shadow-3xl bg-white overflow-hidden animate-in zoom-in-95 duration-300">
          <CardHeader className="bg-slate-900 text-white p-10 relative">
             <button onClick={onClose} className="absolute top-10 right-10 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
             </button>
             <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-teal-600 rounded-2xl">
                   <FlaskConical size={24} />
                </div>
                <div>
                   <CardTitle className="text-2xl font-black uppercase tracking-tight">Diagnostic validation</CardTitle>
                   <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Verified Clinical Outcome</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
             <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subject Identity</label>
                   <p className="text-lg font-black text-slate-900 leading-none">{report.lab_orders?.patients?.full_name}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">#{report.lab_orders?.patients?.registration_no}</p>
                </div>
                <div className="text-right">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Prescribed Analysis</label>
                   <p className="text-lg font-black text-teal-600 uppercase leading-none">{report.lab_orders?.test_name}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{report.result_date}</p>
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Measured Bio-Parameters</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="p-6 rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Observed Value</p>
                         <p className="text-2xl font-black text-slate-900">{report.result_value}</p>
                      </div>
                      <Badge className={`${report.status === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'} font-black text-[10px] uppercase border-0 px-3`}>
                         {report.status}
                      </Badge>
                   </div>
                   <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Biological Reference Range</p>
                      <p className="text-lg font-black text-slate-600 leading-none">{report.reference_range}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Commentary</label>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 italic text-sm font-bold text-slate-600">
                   " {report.remarks || "No supplementary clinical comments provided by the technician."} "
                </div>
             </div>
          </CardContent>
          <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-4">
             <Button variant="ghost" className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest" onClick={onClose}>
                Dismiss
             </Button>
             {!report.reviewed_by_doctor && (
                <Button 
                   className="flex-1 rounded-2xl h-14 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/20 border-0 flex items-center justify-center gap-3"
                   onClick={() => { markReviewed.mutate(report.id); onClose(); }}
                   disabled={markReviewed.isPending}
                >
                   {markReviewed.isPending ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={18} />}
                   Acknowledge & Save to File
                </Button>
             )}
             <Button className="flex-1 rounded-2xl h-14 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest border-0" onClick={() => window.print()}>
                <Printer size={18} className="mr-3" /> Technical PDF
             </Button>
          </div>
       </Card>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Diagnostic Inbox</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <FlaskConical className="text-indigo-600 w-4 h-4" /> Comprehensive Result Registry • Clinical Review Terminal
          </p>
        </div>
        <div className="flex items-center gap-4">
           {results?.filter(r => r.status === 'Critical' && !r.reviewed_by_doctor).length > 0 && (
              <Badge className="bg-rose-50 text-rose-600 border border-rose-100 px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce">
                 <AlertTriangle size={14} />
                 <span className="font-black text-[10px] uppercase tracking-widest">{results?.filter(r => r.status === 'Critical' && !r.reviewed_by_doctor).length} Urgent Reviews</span>
              </Badge>
           )}
           <div className="relative w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                placeholder="Search report archive..." 
                className="w-full h-12 pl-12 pr-6 bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      <Card className="border-0 shadow-3xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-black py-8 pl-10 text-[10px] uppercase tracking-widest text-slate-400 leading-none">Diagnostic Subject</TableHead>
                <TableHead className="font-black py-8 text-[10px] uppercase tracking-widest text-slate-400 leading-none">Analysis Spec</TableHead>
                <TableHead className="font-black py-8 text-[10px] uppercase tracking-widest text-slate-400 leading-none text-center">Observation</TableHead>
                <TableHead className="font-black py-8 text-[10px] uppercase tracking-widest text-slate-400 leading-none text-center">Protocol Status</TableHead>
                <TableHead className="font-black py-8 text-[10px] uppercase tracking-widest text-slate-400 leading-none text-right pr-12">Action Handle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-24 animate-pulse bg-slate-50/10 border-b border-slate-50" /></TableRow>)
              ) : filteredResults?.length > 0 ? filteredResults.map((result) => (
                <TableRow key={result.id} className={`group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0 ${result.status === 'Critical' ? 'bg-rose-50/20' : ''}`}>
                  <TableCell className="pl-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl transition-transform group-hover:scale-110 ${result.status === 'Critical' ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-white border border-slate-100 text-slate-400 shadow-slate-200/50'}`}>
                        {result.lab_orders?.patients?.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1.5">{result.lab_orders?.patients?.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                           <span className="bg-slate-100 px-2 py-0.5 rounded shadow-sm">#{result.lab_orders?.patients?.registration_no}</span>
                           <span>{result.lab_orders?.patients?.gender} • {result.lab_orders?.patients?.age}Y</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-3 bg-indigo-50/50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100/50">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-black text-[11px] uppercase tracking-widest whitespace-nowrap">{result.lab_orders?.test_name}</span>
                    </div>
                    <div className="text-[10px] font-black text-slate-300 uppercase mt-2 px-1 tracking-tighter">Result Date: {result.result_date}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className={`text-xl font-black tracking-tighter ${result.status === 'Critical' ? 'text-rose-600' : result.status === 'Abnormal' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {result.result_value}
                      </div>
                      <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Normal: {result.reference_range}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-2">
                       <Badge className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 border-0 rounded-lg min-w-[80px] justify-center ${
                          result.status === 'Critical' ? 'bg-rose-500 text-white animate-pulse' : 
                          result.status === 'Abnormal' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                       }`}>
                          {result.status}
                       </Badge>
                       {result.reviewed_by_doctor && (
                          <div className="flex items-center gap-1 text-emerald-600">
                             <CheckCircle2 size={12} />
                             <span className="text-[8px] font-black uppercase tracking-widest">Validated</span>
                          </div>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-12">
                     <div className="flex items-center justify-end gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-12 w-12 rounded-2xl text-slate-300 hover:text-slate-900 bg-white border border-slate-100 shadow-sm"
                          onClick={() => setSelectedReport(result)}
                        >
                           <FileText size={20} />
                        </Button>
                        <Button 
                           className={`h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest border-0 shadow-lg transition-all ${result.reviewed_by_doctor ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'}`}
                           onClick={() => setSelectedReport(result)}
                        >
                           {result.reviewed_by_doctor ? 'Review Complete' : 'Take Action'}
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center bg-slate-50/20">
                      <div className="flex flex-col items-center justify-center opacity-10">
                        <FlaskConical size={100} className="mb-6" />
                        <p className="font-black uppercase tracking-widest text-sm">Diagnostic registry is empty</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
    </div>
  )
}
