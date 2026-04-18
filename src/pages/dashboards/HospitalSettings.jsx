import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { 
  Building2, Globe, Phone, Mail, MapPin, 
  Upload, Save, RefreshCcw, ShieldCheck, 
  Image as ImageIcon
} from 'lucide-react'

export default function HospitalSettings() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['hospital-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hospital_settings')
        .select('*')
        .eq('id', 1)
        .single()
      return data || { name: 'MedCare HMS Pro', currency: '₨' }
    }
  })

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
            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
               <div className="aspect-square bg-slate-50 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,_white_0%,_#f8fafc_100%)]">
                 {settings?.logo_url ? (
                   <img src={settings.logo_url} alt="Logo" className="w-24 h-24 object-contain mb-4" />
                 ) : (
                   <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-teal-200 mb-4 transition-all hover:scale-105">
                     <ImageIcon className="w-8 h-8 text-teal-600" />
                   </div>
                 )}
                 <h4 className="text-sm font-bold text-slate-800">Hospital Logo</h4>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Square 512x512 recommended</p>
                 {isEditing && (
                   <Button variant="outline" size="sm" className="mt-4 gap-2 text-xs bg-white">
                     <Upload className="w-3 h-3" />
                     Upload New
                   </Button>
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
    </div>
  )
}
