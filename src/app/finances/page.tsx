'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { CircleDollarSign, Plus, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { buildClientAuthHeaders, getClientUser } from '@/lib/client-auth';
import { hasPermission } from '@/lib/rbac';

type Transaction = {
   _id: string;
   type: 'income' | 'expense';
   amount: number;
   note?: string;
   createdAt: string;
};

function formatCurrencyIDR(amount: number) {
   return `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
}

function getAdaptiveAmountClass(amount: number) {
   const length = formatCurrencyIDR(amount).length;

   if (length >= 19) return 'text-xl';
   if (length >= 16) return 'text-2xl';
   if (length >= 13) return 'text-3xl';
   return 'text-4xl';
}

export default function FinancesPage() {
   const { isReady, isAuthenticated } = useAuthRedirect();
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [loading, setLoading] = useState(true);
   const [showForm, setShowForm] = useState(false);
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState('');
   const [form, setForm] = useState({
      type: 'income',
      amount: 0,
      note: '',
   });

   const userRole = getClientUser().role;
   const canCreateTransaction = hasPermission(userRole, 'transactions:create');
   const canDeleteTransaction = hasPermission(userRole, 'transactions:delete');

   const loadTransactions = async () => {
      setLoading(true);
      try {
         const response = await fetch('/api/transactions');
         const data = await response.json();
         setTransactions(data.transactions || []);
      } catch {
         setError('Gagal memuat data finansial');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadTransactions();
   }, []);

   const totals = useMemo(() => {
      const income = transactions
         .filter((trx) => trx.type === 'income')
         .reduce((sum, trx) => sum + Number(trx.amount || 0), 0);
      const expense = transactions
         .filter((trx) => trx.type === 'expense')
         .reduce((sum, trx) => sum + Number(trx.amount || 0), 0);
      return {
         income,
         expense,
         profit: income - expense,
         balance: income - expense,
      };
   }, [transactions]);

   const handleCreate = async (event: React.FormEvent) => {
      event.preventDefault();
      setError('');
      setSubmitting(true);

      try {
         if (!canCreateTransaction) {
            setError('Role Anda tidak memiliki izin menambahkan transaksi.');
            return;
         }

         const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: buildClientAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(form),
         });
         const data = await response.json();

         if (!response.ok) {
            setError(data.error || 'Gagal menambahkan transaksi');
            return;
         }

         setForm({ type: 'income', amount: 0, note: '' });
         setShowForm(false);
         await loadTransactions();
      } catch {
         setError('Terjadi kesalahan saat menyimpan transaksi');
      } finally {
         setSubmitting(false);
      }
   };

   const handleDelete = async (id: string) => {
      if (!canDeleteTransaction) {
         setError('Role Anda tidak memiliki izin menghapus transaksi.');
         return;
      }

      try {
         await fetch(`/api/transactions/${id}`, {
            method: 'DELETE',
            headers: buildClientAuthHeaders(),
         });
         await loadTransactions();
      } catch {
         setError('Gagal menghapus transaksi');
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
            <div className="flex items-center justify-between mb-10">
              <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Keuangan</h1>
                        <p className="text-slate-400 font-medium mt-1">Catat pemasukan dan pengeluaran bisnis Anda</p>
              </div>
                     {canCreateTransaction ? (
                        <button
                           onClick={() => setShowForm((prev) => !prev)}
                           className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-100 active:scale-95"
                        >
                           <Plus size={20} />
                           {showForm ? 'Tutup Form' : 'Tambah Transaksi Baru'}
                        </button>
                     ) : (
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">
                           Akses terbatas ({userRole})
                        </span>
                     )}
            </div>

                           {showForm && canCreateTransaction && (
                     <form onSubmit={handleCreate} className="mb-8 bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                           <select
                              value={form.type}
                              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                              className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                           >
                              <option value="income">Pemasukan</option>
                              <option value="expense">Pengeluaran</option>
                           </select>
                           <input
                              required
                              type="number"
                              min={1}
                              placeholder="Nominal"
                              value={form.amount}
                              onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                              className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                           />
                           <input
                              placeholder="Catatan"
                              value={form.note}
                              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                              className="px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500"
                           />
                        </div>
                        <button
                           type="submit"
                           disabled={submitting}
                           className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold px-5 py-2.5 rounded-xl"
                        >
                           {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </button>
                     </form>
                  )}

                  {error && (
                     <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 font-semibold text-sm">
                        {error}
                     </div>
                  )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
               <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                        <ArrowUpRight size={20} />
                     </div>
                     <span className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">Total Pemasukan</span>
                  </div>
                  <p className={`${getAdaptiveAmountClass(totals.income)} font-black text-slate-800 leading-tight tracking-tight whitespace-nowrap`}>
                     {formatCurrencyIDR(totals.income)}
                  </p>
               </div>
               <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white">
                        <ArrowDownRight size={20} />
                     </div>
                     <span className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">Total Pengeluaran</span>
                  </div>
                  <p className={`${getAdaptiveAmountClass(totals.expense)} font-black text-slate-800 leading-tight tracking-tight whitespace-nowrap`}>
                     {formatCurrencyIDR(totals.expense)}
                  </p>
               </div>
               <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                        <CircleDollarSign size={20} />
                     </div>
                     <span className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">Laba Bersih</span>
                  </div>
                  <p className={`${getAdaptiveAmountClass(totals.profit)} font-black text-slate-800 leading-tight tracking-tight whitespace-nowrap`}>
                     {formatCurrencyIDR(totals.profit)}
                  </p>
               </div>
               <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                        <CircleDollarSign size={20} />
                     </div>
                     <span className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">Saldo Kas</span>
                  </div>
                           <p className={`${getAdaptiveAmountClass(totals.balance)} font-black text-slate-800 leading-tight tracking-tight whitespace-nowrap`}>
                              {formatCurrencyIDR(totals.balance)}
                           </p>
               </div>
            </div>

                  {loading ? (
                     <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                     </div>
                  ) : transactions.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                              <CircleDollarSign className="text-slate-200" size={32} />
                         </div>
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada catatan keuangan</p>
                         <p className="text-slate-400 text-sm mt-1">Tambahkan transaksi pertama Anda</p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {transactions.map((trx) => (
                           <div key={trx._id} className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                              <div>
                                 <p className="text-sm font-bold text-slate-700">{trx.note || 'Tanpa catatan'}</p>
                                 <p className="text-xs text-slate-400 mt-1">{new Date(trx.createdAt).toLocaleString('id-ID')}</p>
                              </div>
                              <div className="flex items-center gap-6">
                                 <p className={`font-black ${trx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                    {trx.type === 'income' ? '+' : '-'} Rp {Number(trx.amount).toLocaleString('id-ID')}
                                 </p>
                                 {canDeleteTransaction && (
                                    <button
                                       onClick={() => handleDelete(trx._id)}
                                       className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                                       aria-label="Hapus transaksi"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
          </div>
        </div>
      </main>
    </div>
  );
}
