import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Plus, FlaskConical, Beaker, 
  Clock, DollarSign, Activity, Filter,
  RefreshCw, Save, X, MoreVertical,
  ClipboardList, AlertCircle
} from 'lucide-react'

export default function LaboratoryCatalog() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isAdding, setIsAdding] = useState(false)
  const [newTest, setNewTest] = useState({
    test_name: '',
    category: 'Biochemistry',
    price: '',
    sample_type: 'Blood (Serum)',
    tat_hours: 4,
    parameters: ''
  })

  // Fetch catalog
  const { data: catalog, isLoading } = useQuery({
    queryKey: ['lab-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lab_catalog').select('*')
      if (error) throw error
      return data || []
    }
  })

  // Mutation: Register New Test
  const registerMutation = useMutation({
    mutationFn: async (test) => {
      const { error } = await supabase.from('lab_catalog').insert([{ 
        ...test, 
        price: Number(test.price), 
        status: 'active' 
      }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-catalog'])
      setIsAdding(false)
      setNewTest({ test_name: '', category: 'Biochemistry', price: '', sample_type: 'Blood (Serum)', tat_hours: 4, parameters: '' })
    }
  })

  const filtered = catalog?.filter(t => {
    const matchesSearch = t.test_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Diagnostic Catalog</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Laboratory Menu & Protocol Repository</p>
        </div>
        <div className="flex gap-2">
           <Button 
            className="h-11 px-6 bg-teal-600 hover:bg-teal-700 text-white shadow-2xl shadow-teal-600/20 font-black rounded-xl gap-2 border-0 text-[10px] uppercase tracking-widest"
            onClick={() => setIsAdding(true)}
           >
             <Plus size={16} /> Register New Analysis
           </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Search molecular assays, pathology profiles, or generic tests..." 
              className="pl-12 h-14 bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl font-bold"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <select 
          className="h-14 px-6 bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-teal-500/20"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
         >
            <option value="all">All Disciplines</option>
            <option value="Hematology">Hematology</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Microbiology">Microbiology</option>
            <option value="Immunology">Immunology</option>
         </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-64 animate-pulse bg-white border border-slate-100 rounded-[3rem]" />) :
          filtered?.map(test => (
            <Card key={test.id} className="border-0 shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white ring-1 ring-slate-100 overflow-hidden group hover:ring-teal-600/30 transition-all">
               <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                  <div className={`p-3 rounded-2xl ${test.category === 'Hematology' ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
                     <FlaskConical size={20} />
                  </div>
                  <Badge className="bg-slate-50 text-slate-400 border-0 font-black text-[9px] uppercase tracking-widest px-3">
                     {test.category}
                  </Badge>
               </CardHeader>
               <CardContent className="p-8 pt-0 text-left">
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-1 truncate">{test.test_name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">TAT: {test.tat_hours} Hours</p>
                  
                  <div className="space-y-3">
                     <div className="flex items-center gap-3 text-slate-500">
                        <Beaker size={14} className="opacity-40" />
                        <span className="text-[10px] font-black uppercase tracking-tight">{test.sample_type}</span>
                     </div>
                     <div className="flex items-start gap-3 text-slate-500">
                        <ClipboardList size={14} className="opacity-40 mt-0.5" />
                        <span className="text-[9px] font-bold uppercase leading-relaxed text-slate-400 line-clamp-2">{test.parameters}</span>
                     </div>
                  </div>
               </CardContent>
               <CardFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rate (PKR)</div>
                     <div className="text-xl font-black text-slate-900 leading-none">₨ {test.price}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-slate-300 hover:text-teal-600 hover:bg-white shadow-sm">
                     <MoreVertical size={16} />
                  </Button>
               </CardFooter>
            </Card>
          ))
        }
      </div>

      {/* Register Test Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <Card className="w-full max-w-2xl border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300 text-left">
              <CardHeader className="bg-slate-900 text-white p-10 relative">
                 <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 text-slate-400 hover:text-white"><X size={24} /></button>
                 <CardTitle className="text-3xl font-black tracking-tighter uppercase leading-none mb-1">Test Registry</CardTitle>
                 <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Enroll new molecular analysis into system</CardDescription>
              </CardHeader>
              <CardContent className="p-10 grid md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Test Designation</label>
                       <Input className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" placeholder="e.g. Thyroid Panel" value={newTest.test_name} onChange={e => setNewTest({...newTest, test_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medical Category</label>
                       <select className="w-full h-14 bg-slate-50 border-0 rounded-2xl font-bold px-4" value={newTest.category} onChange={e => setNewTest({...newTest, category: e.target.value})}>
                          <option value="Hematology">Hematology</option>
                          <option value="Biochemistry">Biochemistry</option>
                          <option value="Microbiology">Microbiology</option>
                          <option value="Immunology">Immunology</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Acquisition Sample</label>
                       <Input className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" placeholder="e.g. Blood (EDTA)" value={newTest.sample_type} onChange={e => setNewTest({...newTest, sample_type: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Price (₨)</label>
                          <Input type="number" className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" placeholder="0" value={newTest.price} onChange={e => setNewTest({...newTest, price: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TAT (Hours)</label>
                          <Input type="number" className="h-14 bg-slate-50 border-0 rounded-2xl font-bold" value={newTest.tat_hours} onChange={e => setNewTest({...newTest, tat_hours: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diagnostic Parameters</label>
                       <textarea 
                        className="w-full h-24 bg-slate-50 border-0 rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-teal-500/10 placeholder:text-slate-300" 
                        placeholder="Comma separated clinical values..."
                        value={newTest.parameters}
                        onChange={e => setNewTest({...newTest, parameters: e.target.value})}
                       />
                    </div>
                 </div>
              </CardContent>
              <CardFooter className="p-10 pt-0 flex justify-end">
                 <Button 
                  className="h-14 px-12 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl border-0 shadow-2xl shadow-teal-600/30 uppercase tracking-widest text-[10px] flex items-center gap-3"
                  onClick={() => registerMutation.mutate(newTest)}
                  disabled={registerMutation.isPending || !newTest.test_name}
                 >
                    {registerMutation.isPending ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                    Authorize Registry
                 </Button>
              </CardFooter>
           </Card>
        </div>
      )}
    </div>
  )
}
