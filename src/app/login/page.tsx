'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ChevronRight, 
  Package2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Jika sudah login, langsung arahkan ke dashboard
  useEffect(() => {
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
      router.replace('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Simpan data user ke localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Legacy keys agar komponen lama tetap kompatibel
        localStorage.setItem('isAuth', 'true');
        localStorage.setItem('userEmail', data.user?.email || data.user?.name || 'Pengguna');
        router.push('/');
      } else {
        setError(data.error || 'Email atau password salah');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-green-100 selection:text-green-700">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 relative overflow-hidden"
        >
          {/* Subtle Background Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-60" />

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10 relative">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-200 mb-6"
            >
              <Package2 size={28} />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight text-center">
              Selamat <span className="text-green-500">Datang</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-3 uppercase tracking-widest text-center">Sistem Inventaris Modern</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold"
              >
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-wider">Email Bisnis</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="admin@bisnis.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Kata Sandi</label>
                <button type="button" className="text-[10px] font-black text-green-600 uppercase hover:underline">Lupa Sandi?</button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded-md border-slate-300 text-green-500 focus:ring-green-500" />
              <label htmlFor="remember" className="text-xs font-bold text-slate-500 cursor-pointer">Ingat saya di perangkat ini</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-200 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-3 active:scale-95 group overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center gap-3">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    MASUK KE SISTEM
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-slate-50">
             <p className="text-slate-400 text-sm font-bold">
               Baru di sini? <Link href="/register" className="text-green-600 hover:text-green-700 transition-colors">Daftar Akun Gratis</Link>
             </p>
          </div>
        </motion.div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-8 opacity-40 grayscale">
            <div className="flex items-center gap-2 font-black text-slate-400 text-[10px] tracking-tighter uppercase">
              <UserCheck size={12} />
              Terverifikasi
            </div>
            <div className="w-[1px] h-3 bg-slate-300" />
            <div className="font-black text-slate-400 text-[10px] tracking-tighter uppercase">
              Enkripsi SSL Aman
            </div>
          </div>
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">Inventor.io Sistem v1.0.2</p>
        </div>
      </div>
    </div>
  );
}
