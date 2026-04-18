import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { FlaskConical, Calendar, User, Search, FileText } from 'lucide-react'

export default function DoctorLabResults() {
  const { profile } = useAuth()

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
            patients (
              full_name,
              registration_no
            )
          )
        `)
        .eq('lab_orders.doctor_id', profile.id)
        .order('result_date', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Reports</h2>
        <p className="text-sm text-slate-500 font-medium">Review and interpret lab results for your active patients.</p>
      </div>

      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Search Filters</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-bold py-4">Patient</TableHead>
                <TableHead className="font-bold py-4">Test Name</TableHead>
                <TableHead className="font-bold py-4 text-center">Result Date</TableHead>
                <TableHead className="font-bold py-4">Interpretation</TableHead>
                <TableHead className="font-bold py-4 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5} className="h-16 animate-pulse" /></TableRow>)
              ) : results?.length > 0 ? results.map((result) => (
                <TableRow key={result.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                        {result.lab_orders?.patients?.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{result.lab_orders?.patients?.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-tight">{result.lab_orders?.patients?.registration_no}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-indigo-900 bg-indigo-50/50 px-2 py-1 rounded inline-block text-xs uppercase">
                      {result.lab_orders?.test_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-500 text-sm">
                    {result.result_date}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-black text-rose-600">
                        {result.result_value} <span className="text-[10px] text-slate-300 ml-1 font-bold">NORMAL: {result.reference_range}</span>
                      </div>
                      <p className="text-xs text-slate-500 italic max-w-xs">{result.remarks}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <FileText size={18} />
                    </button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <FlaskConical size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-slate-400 font-medium">No diagnostic reports found under your name.</p>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
