import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Store, Mail, Lock, Eye, EyeOff, ShieldAlert, Sparkles, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect path after logging in
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Missing credentials', {
        description: 'Please fill in both email and password.'
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome to Lumina POS', {
        description: 'Login successful!'
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error('Authentication failed', {
        description: err.message || 'Invalid email or password. Try using the Demo buttons below.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'cashier') => {
    setIsLoading(true);
    try {
      await login('', '', true, role);
      toast.success(`Logged in as Demo ${role.toUpperCase()}`, {
        description: `Welcome to Lumina POS! Running in local demo mode.`
      });
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Demo Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative">
          
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4 ring-4 ring-indigo-500/10">
              <Store size={28} />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Lumina<span className="text-indigo-400">POS</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 text-center">
              Next-generation retail & dining point-of-sale system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-slate-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-11 pr-11 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-slate-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign In to Register'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-700/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-3 py-0.5 rounded-full text-slate-400 font-semibold tracking-wider flex items-center gap-1 border border-slate-700">
                <Sparkles size={12} className="text-indigo-400 animate-pulse" /> Try Demo Accounts
              </span>
            </div>
          </div>

          {/* Demo Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-200 transition-all text-xs font-semibold gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={18} className="text-indigo-400" />
              </div>
              <span>Lumina Manager</span>
              <span className="text-[10px] text-slate-500 font-normal">Full privileges</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('cashier')}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 border border-slate-700 hover:border-slate-600 text-slate-200 transition-all text-xs font-semibold gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User size={18} className="text-slate-400" />
              </div>
              <span>Cashier John</span>
              <span className="text-[10px] text-slate-500 font-normal">Sales access only</span>
            </button>
          </div>

          <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-500/10 rounded-2xl p-3 mt-6 text-[11px] text-amber-200/80">
            <ShieldAlert size={14} className="flex-shrink-0 mt-0.5 text-amber-400" />
            <p>
              In Production, link this database to Firebase Auth from console. Click demo logins above to check permissions.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
