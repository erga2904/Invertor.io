'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { Settings, User, Shield, Bell, Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

type LocalUserContext = {
  email: string;
  name: string;
  role: string;
};

function getLocalUserContext(): LocalUserContext {
  if (typeof window === 'undefined') {
    return { email: '', name: '', role: '' };
  }

  const fallbackEmail = localStorage.getItem('userEmail') || '';

  try {
    const rawUser = localStorage.getItem('user');
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    return {
      email: parsedUser?.email || fallbackEmail,
      name: parsedUser?.name || '',
      role: parsedUser?.role || '',
    };
  } catch {
    return { email: fallbackEmail, name: '', role: '' };
  }
}

function buildUserHeaders() {
  const user = getLocalUserContext();
  const headers: Record<string, string> = {};

  if (user.email) headers['x-user-email'] = user.email;
  if (user.name) headers['x-user-name'] = user.name;
  if (user.role) headers['x-user-role'] = user.role;

  return headers;
}

export default function SettingsPage() {
  const { isReady, isAuthenticated } = useAuthRedirect();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    storeName: 'Inventor.io',
    ownerName: 'Pemilik',
    email: 'owner@inventorio.local',
    notifications: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const user = getLocalUserContext();
        const response = await fetch('/api/settings', {
          cache: 'no-store',
          headers: buildUserHeaders(),
        });
        const data = await response.json();
        if (data.settings) {
          setForm({
            storeName: data.settings.storeName || 'Inventor.io',
            ownerName: data.settings.ownerName || user.name || 'Pengguna',
            email: data.settings.email || user.email || 'owner@inventorio.local',
            notifications: Boolean(data.settings.notifications),
          });
        }
      } catch {
        setMessage('Gagal memuat pengaturan.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...buildUserHeaders(),
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Gagal menyimpan pengaturan.');
        return;
      }

      if (data.settings) {
        setForm({
          storeName: data.settings.storeName || 'Inventor.io',
          ownerName: data.settings.ownerName || 'Pemilik',
          email: data.settings.email || 'owner@inventorio.local',
          notifications: Boolean(data.settings.notifications),
        });
      }

      setMessage('Pengaturan berhasil disimpan.');
    } catch {
      setMessage('Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-10">
          <Navbar />
          
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-50">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-100">
                <Settings size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pengaturan Sistem</h1>
                <p className="text-slate-400 font-medium">Atur dashboard Inventor.io dan preferensi bisnis Anda</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100/50 space-y-4">
                    <div className="flex items-center gap-3 text-slate-700 font-black">
                      <User size={20} />
                      Pengaturan Profil
                    </div>
                    <input
                      value={form.storeName}
                      onChange={(e) => setForm((prev) => ({ ...prev, storeName: e.target.value }))}
                      placeholder="Nama toko"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                    />
                    <input
                      value={form.ownerName}
                      onChange={(e) => setForm((prev) => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="Nama pemilik"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                    />
                    <input
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                    />
                  </div>

                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100/50 space-y-4">
                    <div className="flex items-center gap-3 text-slate-700 font-black">
                      <Shield size={20} />
                      Keamanan & Notifikasi
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-3 text-slate-600 font-semibold">
                        <Bell size={18} />
                        Notifikasi sistem
                      </div>
                      <input
                        type="checkbox"
                        checked={form.notifications}
                        onChange={(e) => setForm((prev) => ({ ...prev, notifications: e.target.checked }))}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      Fitur reset kata sandi dan manajemen peran siap diintegrasikan dengan modul manajemen pengguna.
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 flex items-start gap-3">
                      <Database size={16} className="mt-0.5" />
                      Database aktif: MongoDB Atlas ({process.env.NEXT_PUBLIC_DB_NAME || 'inventorio'})
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">{message}</p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-black px-8 py-3 rounded-2xl shadow-sm"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-12 p-10 bg-green-50 rounded-[32px] border border-green-100 flex items-center justify-between">
               <div>
              <h3 className="font-bold text-green-800 text-lg mb-1">Log Audit Sistem</h3>
              <p className="text-green-600 font-medium text-sm">Setiap perubahan sistem dicatat otomatis di changelog.txt.</p>
               </div>
               <button className="bg-white text-green-700 font-black px-8 py-3 rounded-2xl shadow-sm hover:bg-green-100 transition-colors">
              LIHAT LOG
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
