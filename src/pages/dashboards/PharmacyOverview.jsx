import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { 
  Activity, RotateCcw, Calendar, Plus, Save, X, Search,
  RefreshCw, ShieldCheck
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function PharmacyOverview() {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchaseItem, setPurchaseItem] = useState({ medicine_name: '', quantity: 100, unit_price: 10 })

  // Fetch statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['pharmacy-overview-stats'],
    queryFn: async () => {
      const { data: prescriptions } = await supabase.from('prescriptions').select('status')
      const { data: inventory } = await supabase.from('pharmacy_inventory').select('*')

      const pendingCount = prescriptions?.filter(p => p.status === 'pending').length || 0
      const lowStockCount = inventory?.filter(i => i.quantity_in_stock <= i.reorder_level).length || 0
      
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(today.getDate() + 30)

      const nearExpiry = inventory?.filter(i => {
        const expiry = new Date(i.expiry_date)
        return expiry <= thirtyDaysFromNow && expiry >= today
      }).length || 0

      return [
        { label: 'Pending Queue', value: pendingCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Prescriptions awaiting dispense' },
        { label: 'Stock Alerts', value: lowStockCount, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Items below reorder level' },
        { label: 'Near Expiry', value: nearExpiry, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Expiring within 30 days' },
        { label: 'Inventory Count', value: inventory?.length || 0, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Total registered SKUs' },
      ]
    }
  })

  const addStockMutation = useMutation({
    mutationFn: async (payload) => {
      // Find item or error out for simplicity
      const { data: existing } = await supabase.from('pharmacy_inventory').select('*').eq('medicine_name', payload.medicine_name).single()
      if (existing) {
        await supabase.from('pharmacy_inventory').update({ quantity_in_stock: Number(existing.quantity_in_stock) + Number(payload.quantity) }).eq('id', existing.id)
      } else {
        await supabase.from('pharmacy_inventory').insert([payload])
      }
    },
    onSuccess: () => {
      setShowPurchaseModal(false)
      alert("Stock replenished successfully.")
    }
  })

  // Fetch critical low stock items
  const { data: criticalItems } = useQuery({
    queryKey: ['pharmacy-critical-stock'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pharmacy_inventory')
        .select('*')
        .order('quantity_in_stock', { ascending: true })
        .limit(5)
      return data || []
    }
  })

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pharmacy Intelligence</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Resource Management • Stock Flow Control</p>
        </div>
        <div className="flex gap-2">
           <Button 
             className="h-11 px-6 bg-slate-900 hover:bg-black text-white shadow-2xl shadow-slate-900/20 font-black rounded-xl gap-2 border-0 text-[10px] uppercase tracking-widest"
             onClick={() => setShowPurchaseModal(true)}
           >
             <Plus size={16} />
             New Stock Intake
           </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-40 bg-white border border-slate-100 animate-pulse rounded-[2rem]" />) :
          stats?.map((stat, i) => (
            <Card key={i} className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</CardTitle>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{stat.value}</div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stat.desc}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Low Stock Watchlist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               <Activity className="text-rose-500 w-6 h-6" />
               Critical Stock Watchlist
            </h3>
            <Link to="inventory">
              <Button variant="ghost" size="sm" className="text-indigo-600 font-black gap-2 hover:bg-indigo-50 px-4 rounded-xl">
                Open Full Registry <ChevronRight size={16} />
              </Button>
            </Link>
          </div>
          
          <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden divide-y divide-slate-50">
            {criticalItems && criticalItems.length > 0 ? criticalItems.map((item) => {
              const stockRatio = (item.quantity_in_stock / item.reorder_level) * 100
              return (
                <div key={item.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-xl shadow-slate-200/50 group-hover:scale-105 transition-transform">
                      <Pill size={24} className={item.quantity_in_stock <= item.reorder_level ? 'text-rose-500' : 'text-emerald-500'} />
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-lg tracking-tight">{item.medicine_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category} • {item.unit}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="w-32 hidden md:block">
                       <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1.5">
                          <span>Usage</span>
                          <span className={item.quantity_in_stock <= item.reorder_level ? 'text-rose-500' : 'text-slate-900'}>{item.quantity_in_stock} Units</span>
                       </div>
                       <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${item.quantity_in_stock <= item.reorder_level ? 'bg-rose-500' : 'bg-teal-500'}`}
                            style={{ width: `${Math.min(100, Math.max(10, stockRatio))}%` }}
                          />
                       </div>
                    </div>
                    <Link to="inventory">
                      <Button size="sm" className="bg-slate-900 hover:bg-black text-white px-6 rounded-xl font-black text-[10px] uppercase h-10 border-0 shadow-xl shadow-slate-900/20">
                        Top Up
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            }) : (
              <div className="p-20 text-center text-slate-400">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-10 text-emerald-500" />
                <p className="font-black uppercase tracking-widest text-xs">All Inventory Items Stable</p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Pharmacy Actions */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Operational Terminal</h3>
            <div className="grid gap-4">
              <Link to="dispense">
                <Button className="w-full justify-start gap-5 h-20 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/20 border-0 rounded-[2rem] p-6 group transition-all">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black tracking-tight leading-none mb-1">Dispense Terminal</div>
                    <div className="text-[10px] font-bold text-emerald-100/70 uppercase tracking-widest">Fulfill Doctor Orders</div>
                  </div>
                </Button>
              </Link>
              <Link to="inventory">
                <Button className="w-full justify-start gap-5 h-20 bg-white border-2 border-slate-100 text-slate-900 hover:border-indigo-600 hover:bg-indigo-50/10 transition-all rounded-[2rem] p-6 group">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black tracking-tight leading-none mb-1 text-slate-900">Digital Registry</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Stock Control</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>

          <Card className="bg-slate-900 text-white p-10 shadow-3xl shadow-slate-900/40 rounded-[2.5rem] border-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
               <TrendingUp size={120} />
            </div>
            <h4 className="text-2xl font-black mb-2 tracking-tight">Stock Trend</h4>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">
              Medical inventory turnover is currently stable. Ensure all **Cold Chain** items are cross-verified for temperature compliance.
            </p>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 font-black shadow-2xl shadow-indigo-600/30 h-14 rounded-2xl uppercase tracking-widest text-[11px] px-8">
              Analyze Resource Flow
            </Button>
          </Card>
        </div>
      </div>
      {/* Stock Intake Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-slate-900 text-white p-10 relative">
              <button 
                onClick={() => setShowPurchaseModal(false)}
                className="absolute top-10 right-10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Package className="text-white w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black tracking-tight uppercase leading-none mb-1">Stock Intake</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Inventory Management Registry</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
               <div className="space-y-4 text-left">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Medicine Name / SKU</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="e.g. Paracetamol 500mg..."
                      className="h-14 pl-12 bg-slate-50 border-0 rounded-2xl font-bold"
                      value={purchaseItem.medicine_name}
                      onChange={e => setPurchaseItem({...purchaseItem, medicine_name: e.target.value})}
                    />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-6 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Quantity</label>
                    <Input 
                      type="number"
                      className="h-14 bg-slate-50 border-0 rounded-2xl font-black text-emerald-600"
                      value={purchaseItem.quantity}
                      onChange={e => setPurchaseItem({...purchaseItem, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Unit Price (₨)</label>
                    <Input 
                      type="number"
                      className="h-14 bg-slate-50 border-0 rounded-2xl font-bold"
                      value={purchaseItem.unit_price}
                      onChange={e => setPurchaseItem({...purchaseItem, unit_price: Number(e.target.value)})}
                    />
                  </div>
               </div>
            </CardContent>
            <CardFooter className="p-10 pt-0 flex gap-3">
               <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => setShowPurchaseModal(false)}>Cancel</Button>
               <Button 
                 className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 border-0"
                 onClick={() => addStockMutation.mutate(purchaseItem)}
                 disabled={!purchaseItem.medicine_name}
               >
                 {addStockMutation.isPending ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={18} />}
                 Authorize Intake
               </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
