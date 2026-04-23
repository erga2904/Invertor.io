'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

function formatCompactIDR(value: number) {
  const number = Number(value || 0);
  if (number >= 1_000_000_000) return `Rp ${(number / 1_000_000_000).toFixed(1)} M`;
  if (number >= 1_000_000) return `Rp ${(number / 1_000_000).toFixed(1)} Jt`;
  if (number >= 1_000) return `Rp ${(number / 1_000).toFixed(0)} K`;
  return `Rp ${number}`;
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { stats, sales, salesSource, stocks, stores, topCategories } = data || { stats: [], sales: [], salesSource: 'seed', stocks: [], stores: [], topCategories: [] };
  
  const safeStats = Array.isArray(stats) ? stats : [];
  const safeSales = Array.isArray(sales) ? sales : [];
  const safeStocks = Array.isArray(stocks) ? stocks : [];
  const safeStores = Array.isArray(stores) ? stores : [];
  const safeTopCategories = Array.isArray(topCategories) ? topCategories : [];

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800">Aktivitas Terbaru</h2>
        <div className="flex gap-4">
          <button className="p-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors shadow-sm">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <button className="p-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors shadow-sm">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 stats-grid-tour">
        {safeStats.length > 0 ? (
          safeStats.map((stat: any, i: number) => (
            <motion.div
              key={stat.label || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-50 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-[0.02] transition-opacity" />
              <div className="text-4xl font-black text-slate-800 mb-1 leading-none tracking-tight">
                {stat.value}
              </div>
              <div className="text-slate-400 text-sm font-semibold mb-6 uppercase tracking-widest">{stat.sub || 'Jumlah'}</div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-auto border-t border-slate-50 pt-4 leading-none">{stat.label}</div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-5 text-center text-slate-400 py-8 bg-white rounded-3xl border border-dashed">Data statistik belum tersedia di MongoDB</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8 sales-chart-tour">
        <div className="col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-slate-50 hover:shadow-lg transition-all">
          <h3 className="text-xl font-bold mb-10 text-slate-800">Penjualan</h3>
          <div className="flex items-end justify-between h-56 px-10 border-b border-slate-100 pb-12 relative overflow-hidden">
             {safeSales.length > 0 ? (
                safeSales.map((item: any, i: number) => (
                  <div key={item.label || i} className="flex flex-col items-center gap-3 flex-1 max-w-[120px]">
                    <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                      {formatCompactIDR(item.amount || 0)}
                    </span>
                    <motion.div 
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      style={{
                        height: `${Math.max(6, Number(item.percentage || 0))}%`,
                        backgroundColor: item.color || '#22c55e',
                      }}
                      className="w-5 rounded-full origin-bottom shadow-lg shadow-green-100 transition-transform hover:scale-x-125 cursor-pointer"
                    />
                    <span className="text-slate-400 text-sm font-semibold whitespace-nowrap">{item.label}</span>
                  </div>
                ))
             ) : (
               <div className="flex-1 text-center text-slate-400">Data belum cukup untuk menampilkan grafik.</div>
             )}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 leading-relaxed">
            {salesSource === 'transactions'
              ? 'Sumber grafik: transaksi pemasukan dari menu Keuangan.'
              : 'Sumber grafik sementara: data seed. Untuk data nyata, tambahkan transaksi pemasukan di menu Keuangan.'}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-50 hover:shadow-lg transition-all relative group overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold text-slate-800">Kategori Produk Teratas</h3>
            <button className="text-slate-400 hover:text-green-600 text-xs font-bold uppercase tracking-wider transition-colors">Data Langsung</button>
          </div>
          {safeTopCategories.length > 0 ? (
            <div className="space-y-4">
              {safeTopCategories.map((item: any, index: number) => (
                <motion.div
                  key={item.label || index}
                  whileHover={{ scale: 1.01 }}
                  className="bg-slate-50 rounded-2xl border border-slate-100 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-slate-700 text-sm uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">{item.count} produk</p>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.max(6, item.percentage || 0)}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Belum ada data kategori. Tambahkan produk untuk melihat kategori teratas.
            </div>
          )}
           <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
             <button className="p-4 bg-green-600 text-white rounded-full shadow-2xl shadow-green-500/50">
                <ChevronRight size={24} />
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-50">
          <h3 className="text-xl font-bold mb-8 text-slate-800 tracking-tight">Ringkasan Stok</h3>
          <div className="space-y-6">
            {safeStocks.length > 0 ? (
              safeStocks.map((stock: any, i: number) => (
                <div key={stock.label || i} className="flex justify-between items-center group cursor-pointer border-t border-slate-50 pt-4 first:border-t-0 first:pt-0">
                  <span className={`${stock.isWarning ? 'text-green-600 font-bold' : 'text-slate-500 font-semibold'} tracking-tight group-hover:pl-2 transition-all`}>{stock.label}</span>
                  <span className="text-slate-500 font-bold bg-slate-50 px-4 py-1.5 rounded-full">{stock.value}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 italic">Data stok belum tersedia di MongoDB</div>
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Daftar Toko</h3>
            <button className="text-slate-400 hover:text-green-600 text-xs font-bold uppercase tracking-wider transition-colors">Lihat Semua</button>
          </div>
          <div className="space-y-6">
             {safeStores.length > 0 ? (
               safeStores.map((store: any, i: number) => (
                 <div key={store.name || i} className="flex items-center justify-between text-sm group cursor-pointer transition-all hover:bg-slate-50 -mx-4 px-4 py-2 rounded-2xl">
                    <span className="font-bold text-slate-700 flex-1">{store.location}</span>
                    <span className="text-slate-400 font-medium px-4">{store.employees} karyawan</span>
                    <span className="text-slate-400 font-medium px-4">{store.items} produk</span>
                    <span className="text-green-600 font-bold text-xs uppercase tracking-tighter">{store.orders} pesanan</span>
                 </div>
               ))
             ) : (
               <div className="text-center text-slate-400 italic">Data toko belum tersedia di MongoDB</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
