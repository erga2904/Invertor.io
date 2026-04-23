'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ChevronRight, 
  Package2,
  CheckCircle2,
  Users,
  Building2,
  Settings2,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

type Role = 'owner' | 'employee' | 'admin';

interface RoleOption {
  id: Role;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const roles: RoleOption[] = [
  {
    id: 'owner',
    title: 'Pemilik',
    description: 'Akses penuh ke semua fitur, laporan keuangan, manajemen toko, dan hak untuk menghapus data.',
    icon: Building2,
    color: 'bg-green-500'
  },
  {
    id: 'employee',
    title: 'Karyawan',
    description: 'Akses terbatas untuk menginput data stok, memproses transaksi, dan melihat inventaris harian.',
    icon: Users,
    color: 'bg-blue-500'
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Mengelola pengguna, sistem konfigurasi, sinkronisasi database, dan bantuan teknis aplikasi.',
    icon: Settings2,
    color: 'bg-purple-500'
  }
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleNextStep = () => {
    if (step === 1 && !selectedRole) return;
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi konfirmasi tidak cocok');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registrasi berhasil! Silakan login.');
        router.push('/login');
      } else {
        // Tampilkan pesan error debug jika tersedia
        const errorMessage = data.debug 
          ? `${data.error} (Detail: ${data.debug})` 
          : (data.error || 'Terjadi kesalahan saat registrasi');
        setError(errorMessage);
        console.error('Registration failed payload:', data);
      }
    } catch (err: any) {
      console.error('Full catch error:', err);
      setError(`Gagal menghubungkan ke server: ${err.message || 'Koneksi terputus'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 p-10 border border-slate-100 overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200 mb-6">
              <Package2 size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">Buat Akun Baru</h1>
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step === 1 ? 'bg-green-500' : 'bg-green-100'}`} />
              <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step === 2 ? 'bg-green-500' : 'bg-green-100'}`} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-slate-700">Pilih Peran Anda</h2>
                  <p className="text-sm text-slate-400 font-medium">Setiap peran memiliki hak akses yang berbeda</p>
                </div>

                <div className="grid gap-4">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex items-center gap-6 p-6 rounded-3xl border-2 text-left transition-all relative group ${
                        selectedRole === role.id 
                          ? 'border-green-500 bg-green-50/50' 
                          : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${role.color} shadow-lg shrink-0`}>
                        <role.icon size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-800 text-lg">{role.title}</h3>
                          {selectedRole === role.id && (
                            <CheckCircle2 className="text-green-500" size={20} />
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{role.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextStep}
                  disabled={!selectedRole}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-200 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-3 active:scale-95 group mt-8"
                >
                  LANJUT KE PENDAFTARAN
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-400 hover:text-green-600 font-bold text-sm mb-8 transition-colors"
                >
                  <ArrowLeft size={16} /> Kembali pilih peran
                </button>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-800"
                            placeholder="Contoh: Budi Santoso"
                          />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-800"
                            placeholder="budi@email.com"
                          />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Kata Sandi</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-800"
                            placeholder="••••••••"
                          />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Konfirmasi Sandi</label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-800"
                            placeholder="••••••••"
                          />
                        </div>
                     </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                     <div className={`p-2 rounded-lg ${roles.find(r => r.id === selectedRole)?.color} text-white`}>
                        {(() => {
                          const Icon = roles.find(r => r.id === selectedRole)?.icon || User;
                          return <Icon size={16} />;
                        })()}
                     </div>
                     <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Peran Terpilih</p>
                        <p className="font-bold text-slate-700">{roles.find(r => r.id === selectedRole)?.title}</p>
                     </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'DAFTAR SEKARANG'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center pt-8 border-t border-slate-50">
             <p className="text-slate-400 text-sm font-medium">Sudah punya akun? <Link href="/login" className="text-green-600 font-bold hover:underline">Masuk di sini</Link></p>
          </div>
        </motion.div>
        
        <p className="text-center text-slate-400 text-xs font-bold mt-8 uppercase tracking-widest">Inventor.io Sistem Inventaris &copy; 2024</p>
      </div>
    </div>
  );
}
