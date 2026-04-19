import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { 
  Search, Calendar, Filter, Download, 
  History, User, Database, Info
} from 'lucide-react'

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tableFilter, setTableFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', tableFilter],
    queryFn: async () => {
      let query = supabase.from('audit_logs').select(`*, profiles(full_name, role)`)
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter)
      const { data } = await query.order('timestamp', { ascending: false }).limit(100)
      return data || []
    }
  })

  // Get unique tables for filtering
  const tables = [...new Set(logs?.map(l => l.table_name) || [])]

  const filteredLogs = logs?.filter(l => {
    const matchesSearch = l.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.id?.includes(searchTerm)
    
    const matchesAction = actionFilter === 'all' || l.action === actionFilter
    
    const logDate = new Date(l.timestamp)
    const matchesFrom = !dateFrom || logDate >= new Date(dateFrom)
    const matchesTo = !dateTo || logDate <= new Date(dateTo)
    
    return matchesSearch && matchesAction && matchesFrom && matchesTo
  })

  // Export functionality
  const exportToCSV = () => {
    if (!filteredLogs?.length) return
    
    const headers = ['Timestamp', 'User ID', 'Full Name', 'Action', 'Table', 'Details']
    const rows = filteredLogs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.user_id,
      l.profiles?.full_name || 'System',
      l.action,
      l.table_name,
      l.record_id || 'N/A'
    ])
    
    const csvContent = [headers, ...rows]
      .map(e => e.join(","))
      .join("\n")
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `audit_log_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'DELETE': return 'bg-red-50 text-red-700 border-red-100'
      default: return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit logs</h2>
          <p className="text-sm text-slate-500 font-medium">Tracking all database modifications for security and compliance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button variant="dark" className="gap-2 shadow-lg shadow-slate-900/20" onClick={exportToCSV}>
            <Download className="w-4 h-4" />
            Export Logs (CSV)
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="border-slate-200 shadow-xl shadow-slate-200/40 animate-in slide-in-from-top-4 duration-300">
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Type</label>
              <select 
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-bold appearance-none cursor-pointer"
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-slate-50" />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                variant="ghost" 
                className="flex-1 text-[10px] font-black uppercase text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  setActionFilter('all')
                  setDateFrom('')
                  setDateTo('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by user or action..." 
                className="pl-10 bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={tableFilter}
                onChange={e => setTableFilter(e.target.value)}
              >
                <option value="all">All Tables</option>
                {tables.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Timestamp</TableHead>
                <TableHead className="font-bold py-4">User</TableHead>
                <TableHead className="font-bold py-4 text-center">Action</TableHead>
                <TableHead className="font-bold py-4">Target Table</TableHead>
                <TableHead className="font-bold py-4 text-right">Record ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-14 animate-pulse bg-slate-50/20" />
                  </TableRow>
                ))
              ) : filteredLogs?.length > 0 ? filteredLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-slate-50/50">
                  <TableCell className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{log.profiles?.full_name || 'System Auto'}</div>
                        <div className="text-[10px] text-teal-600 font-bold uppercase tracking-tighter">{log.profiles?.role || 'Service'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-[10px] font-bold border ${getActionColor(log.action)}`}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      {log.table_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 text-xs font-mono text-slate-400 bg-slate-50 py-1 px-2 rounded-md inline-flex ml-auto group-hover:bg-slate-100 transition-colors">
                      <Info className="w-3 h-3" />
                      {log.record_id?.split('-')[0]}...
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <History className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-400 font-medium">No audit logs found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-slate-400 italic flex items-center gap-2">
        <Info className="w-3 h-3" />
        Logs are retained for 90 days for HIPAA compliance and security auditing.
      </p>
    </div>
  )
}
