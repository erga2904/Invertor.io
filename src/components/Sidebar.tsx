'use client';

import { 
  Home, 
  Package, 
  LayoutGrid, 
  Store, 
  CircleDollarSign, 
  Settings, 
  PlusCircle, 
  LogOut 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: Home, label: 'Beranda', href: '/' },
  { icon: Package, label: 'Produk', href: '/products' },
  { icon: LayoutGrid, label: 'Kategori', href: '/categories' },
  { icon: Store, label: 'Toko', href: '/stores' },
  { icon: CircleDollarSign, label: 'Keuangan', href: '/finances' },
  { icon: Settings, label: 'Pengaturan', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuth');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const handleStartTour = () => {
    // Custom event to trigger tour
    const event = new CustomEvent('start-app-tour');
    window.dispatchEvent(event);
  };

  return (
    <aside className="w-64 bg-green-600 text-white flex flex-col h-screen fixed left-0 top-0 rounded-r-[40px] shadow-xl z-20">
      <div className="p-8 sidebar-logo">
        <h1 className="text-2xl font-bold tracking-tight">Inventor. io</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group",
                isActive 
                  ? "bg-white/20 font-medium" 
                  : "hover:bg-white/10"
              )}
            >
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-white/70")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 mb-8">
        <button 
          onClick={handleStartTour}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/10 w-full text-left transition-all group play-guide-tour"
        >
          <PlusCircle size={20} className="text-white/70 group-hover:scale-110" />
          <span>Putar Panduan Lagi</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/10 w-full text-left transition-all group"
        >
          <LogOut size={20} className="text-white/70 group-hover:scale-110" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
