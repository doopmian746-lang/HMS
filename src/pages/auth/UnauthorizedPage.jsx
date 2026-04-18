import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/10 ring-8 ring-white">
            <ShieldAlert size={48} className="text-red-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
            <span className="text-red-600 font-black text-xs">!</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Access Denied</h1>
          <p className="text-slate-500 font-medium px-4">
            You don't have the required administrative permissions to access this department or file.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Incident logged for security audit</div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate(-1)} 
              className="w-full gap-2 h-12 bg-slate-900 shadow-xl shadow-slate-900/10 font-bold"
            >
              <ArrowLeft size={18} />
              Return to Previous Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')} 
              className="w-full h-12 bg-white border-slate-200 text-slate-700 font-bold"
            >
              Back to Login
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-medium">
          Error Code: 403_ACCESS_FORBIDDEN • Protocol: HMS-SECURE-V1
        </p>
      </div>
    </div>
  )
}
