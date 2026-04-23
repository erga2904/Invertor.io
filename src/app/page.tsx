'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/Dashboard';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function Home() {
  const { isReady, isAuthenticated } = useAuthRedirect();

  // Tampilkan loading sebentar saat mengecek autentikasi
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Jika tidak terautentikasi, jangan rendernya (sudah redirect di useEffect)
  if (!isAuthenticated) return null;

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-10">
          <Navbar />
          <Dashboard />
        </div>
      </main>
    </div>
  );
}
