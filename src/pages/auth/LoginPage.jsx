import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import {
  Activity, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle
} from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const { user, profile, loading: authLoading, error: authError, signIn, getDashboardPath } = useAuth()

  // Reactively navigate when profile is loaded
  useEffect(() => {
    if (user && profile) {
      const path = getDashboardPath(profile.role)
      navigate(path, { replace: true })
    }
  }, [user, profile, navigate, getDashboardPath])

  // Sync authError from context to local error state
  useEffect(() => {
    if (authError) {
      setError(authError)
      setLoading(false)
    }
  }, [authError])

  // Safety check: If logged in but profile is missing after loading finishes
  useEffect(() => {
    if (user && !authLoading && !profile && !authError && loading) {
      setLoading(false)
      setError('Staff profile record not found. Please ensure you have run the profile synchronization SQL in the Supabase Editor.')
    }
  }, [user, authLoading, profile, authError, loading])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      // Navigation will be handled by the useEffect once profile is fetched
    } catch (err) {
      setLoading(false)
      setError(err.message || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* ── Left Branding ── */}
      <div className="hidden lg:flex flex-col justify-center px-12 bg-teal-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-700 rounded-full blur-3xl -ml-32 -mb-32 opacity-50" />
        
        <div className="relative z-10 max-w-md">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl">
            <Activity className="text-teal-600 w-10 h-10" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight leading-tight">
            MedCare <br /> <span className="text-teal-200">HMS Pro</span>
          </h1>
          <p className="text-lg text-teal-50 mb-8 leading-relaxed">
            A secure, role-based platform for modern healthcare institutions. 
            Streamline workflows across all departments — from clinical care to financial management.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-teal-700/40 p-4 rounded-xl border border-teal-500/30">
              <ShieldCheck className="w-6 h-6 text-teal-200 mb-2" />
              <div className="font-bold text-sm">Hi-Security</div>
              <div className="text-xs text-teal-100/70">Role-based Access Control</div>
            </div>
            <div className="bg-teal-700/40 p-4 rounded-xl border border-teal-500/30">
              <Activity className="w-6 h-6 text-teal-200 mb-2" />
              <div className="font-bold text-sm">Real-time</div>
              <div className="text-xs text-teal-100/70">Instant Patient Updates</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Login ── */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl lg:shadow-none bg-white lg:bg-transparent">
            <CardHeader className="space-y-2 pb-8">
              <div className="lg:hidden flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Activity className="text-white w-6 h-6" />
                </div>
                <span className="font-bold text-xl text-teal-600">MedCare HMS</span>
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold tracking-tight">Staff Login</CardTitle>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Demo Mode</Badge>
              </div>
              <CardDescription className="text-slate-500">
                Frontend-Only Dashboard. Use <strong>admin@test.com</strong> to enter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="name@hospital.com"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">Password</label>
                    <a href="#" className="text-xs text-teal-600 hover:underline font-medium">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-transform"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    'Log Into Portal'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col pt-8">
              <div className="w-full flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Quick Demo Login</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { role: 'Admin', email: 'admin@test.com' },
                  { role: 'Doctor', email: 'doctor@test.com' },
                  { role: 'Nurse', email: 'nurse@test.com' },
                  { role: 'Reception', email: 'receptionist@test.com' },
                  { role: 'Pharmacy', email: 'pharmacy@test.com' },
                  { role: 'Lab', email: 'lab@test.com' },
                  { role: 'Accounts', email: 'account@test.com' }
                ].map((demo) => (
                  <button 
                    key={demo.role}
                    type="button"
                    onClick={(e) => {
                      setEmail(demo.email);
                      setPassword('password123');
                      // Wait for state to update then submit
                      setTimeout(() => handleLogin(e), 50);
                    }}
                    className="text-[10px] font-bold px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 uppercase tracking-tighter hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors active:scale-95"
                  >
                    {demo.role}
                  </button>
                ))}
              </div>
              <p className="mt-8 text-xs text-center text-slate-400 leading-relaxed">
                Internal hospital portal. Unauthorized access attempts <br /> are monitored and logged.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
