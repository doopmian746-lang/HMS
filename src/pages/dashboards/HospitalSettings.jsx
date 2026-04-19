import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { 
  Building2, Globe, Phone, Mail, MapPin, 
  Upload, Save, RefreshCcw, ShieldCheck, 
  Image as ImageIcon, BedDouble, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'

export default function HospitalSettings() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)

  // Fetch current settings
    queryFn: async () => {
      const { data } = await supabase
        .from('hospital_settings')
        .select('*')
        .eq('id', 1)
        .single()
      return data || { name: 'MedCare HMS Pro', currency: '₨' }
    }
  })

  // Fetch Beds
  const { data: beds } = useQuery({
    queryKey: ['bed-management'],
    queryFn: async () => {
      const { data } = await supabase.from('bed_management').select('*')
      return data || []
    }
  })

  // Bed status mutation
  const updateBedStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('bed_management')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bed-management'])
    }
  })

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // State handles for local editing (optional enhancement, here we simplify with direct form data)
  const [formData, setFormData] = useState(null)

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (updatedData) => {
      const { error } = await supabase
        .from('hospital_settings')
        .update(updatedData)
        .eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hospital-settings'])
      setIsEditing(false)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const updates = {
      name:    data.get('name'),
      email:   data.get('email'),
      phone:   data.get('phone'),
      address: data.get('address'),
    }
    updateSettings.mutate(updates)
  }

  if (isLoading) return <div className="space-y-6 animate-pulse">
    <div className="h-64 bg-slate-100 rounded-xl" />
    <div className="h-64 bg-slate-100 rounded-xl" />
  </div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Configuration</h2>
          <p className="text-sm text-slate-500 font-medium">Global settings for identity, contact, and system branding.</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Edit Settings
          </Button>
        ) : (
          <div className="flex gap-2">
             <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
             <Button form="settings-form" className="gap-2 shadow-lg shadow-teal-600/20">
               <Save className="w-4 h-4" />
               Save Changes
             </Button>
          </div>
        )}
      </div>

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Identity & Branding */}
          <div className="md:col-span-1 space-y-4">
Card className="border-slate-200/60 shadow-sm overflow-hidden">
               <div className="aspect-square bg-slate-50 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,_white_0%,_#f8fafc_100%)]">
                 {(logoPreview || settings?.logo_url) ? (
                   <img src={logoPreview || settings.logo_url} alt="Logo" className="w-24 h-24 object-contain mb-4" />
                 ) : (
                   <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-teal-200 mb-4 transition-all hover:scale-105">
                     <ImageIcon className="w-8 h-8 text-teal-600" />
                   </div>
                 )}
                 <h4 className="text-sm font-bold text-slate-800">Hospital Logo</h4>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Square 512x512 recommended</p>
                 {isEditing && (
                   <div className="mt-4">
                     <input 
                       type="file" 
                       id="logo-upload" 
                       className="hidden" 
                       accept="image/*"
                       onChange={handleLogoUpload}
                     />
                     <Button 
                       type="button"
                       variant="outline" 
                       size="sm" 
                       className="gap-2 text-xs bg-white"
                       onClick={() => document.getElementById('logo-upload').click()}
                     >
                       <Upload className="w-3 h-3" />
                       Upload New
                     </Button>
                   </div>
                 )}
               </div>
            </Card>
            
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
               <div className="flex items-center gap-2 mb-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" />
                 <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Compliance</span>
               </div>
               <p className="text-[11px] text-emerald-600/80 leading-relaxed font-medium">
                 Changes here will be reflected on all patient registration cards and auto-generated medical reports.
               </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">General Information</CardTitle>
                <CardDescription>Official hospital details used for all communications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Institution Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input 
                      name="name"
                      disabled={!isEditing}
                      defaultValue={settings?.name}
                      className="pl-10 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Office Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input 
                        name="phone"
                        disabled={!isEditing}
                        defaultValue={settings?.phone || '+92 000 000 000'}
                        className="pl-10 bg-slate-50/50"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Official Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input 
                        name="email"
                        disabled={!isEditing}
                        defaultValue={settings?.email || 'admin@medcare.pro'}
                        className="pl-10 bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Physical Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input 
                      name="address"
                      disabled={!isEditing}
                      defaultValue={settings?.address || 'Street 1, Main Blvd, Islamabad'}
                      className="pl-10 bg-slate-50/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Technical & Finance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Currency Symbol</label>
                    <Input 
                      disabled={!isEditing}
                      defaultValue={settings?.currency || '₨'}
                      className="bg-slate-50/50 font-bold text-teal-600"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input 
                        disabled={!isEditing}
                        defaultValue="https://medcare.pro"
                        className="pl-10 bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Bed Management Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bed Management</h2>
          <p className="text-sm text-slate-500 font-medium">Monitor and update facility occupancy status across wards.</p>
        </div>

        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Ward</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Bed #</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Patient / Details</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beds?.length > 0 ? beds.map((bed) => (
                <TableRow key={bed.id} className="group transition-colors hover:bg-slate-50/50">
                  <TableCell className="font-extrabold text-slate-900">{bed.ward}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{bed.bed_number}</Badge>
                  </TableCell>
                  <TableCell>
                    {bed.status === 'occupied' ? (
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs uppercase tracking-tighter">
                        <AlertTriangle className="w-3 h-3" /> Occupied
                      </div>
                    ) : bed.status === 'available' ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-tighter">
                        <CheckCircle2 className="w-3 h-3" /> Available
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tighter">
                        <XCircle className="w-3 h-3" /> Maintenance
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 font-medium">
                    {bed.patient_id ? (
                      <span className="text-slate-900">Patient ID: {bed.patient_id} <br/><span className="text-[10px] text-slate-400">Admitted: {bed.admitted_date}</span></span>
                    ) : bed.status === 'maintenance' ? (
                      <span className="italic">Scheduled for deep cleaning</span>
                    ) : (
                      <span className="opacity-30">— Available —</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {bed.status === 'maintenance' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] h-7 font-black border-teal-200 text-teal-700 hover:bg-teal-50"
                        onClick={() => updateBedStatus.mutate({ id: bed.id, status: 'available' })}
                      >
                        Mark Available
                      </Button>
                    )}
                    {bed.status === 'available' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] h-7 font-black border-slate-200 text-slate-500 hover:bg-slate-50"
                        onClick={() => updateBedStatus.mutate({ id: bed.id, status: 'maintenance' })}
                      >
                        Mark Maint.
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <p className="text-slate-400 text-sm font-bold uppercase">No beds configured found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
