'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Step, EventData, STATUS } from 'react-joyride';
import { usePathname } from 'next/navigation';

// React-Joyride has known issues with Turbopack and dynamic imports in App Router.
// Using a more manual approach to ensure the component is resolved correctly.
const Joyride = dynamic(
  () => import('react-joyride').then((mod) => {
    return mod.Joyride || (mod as any).default;
  }),
  { 
    ssr: false,
    loading: () => null 
  }
);

export const tourSteps: Step[] = [
  {
    target: '.sidebar-logo',
    content: 'Selamat datang di Inventor.io! Ini adalah brand aplikasi inventaris Anda.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '.search-bar-tour',
    content: 'Pencarian ini bisa dipakai untuk mencari fitur (menu), produk, dan kategori.',
    placement: 'bottom',
  },
  {
    target: '.notification-tour',
    content: 'Klik ikon lonceng untuk melihat notifikasi stok menipis dan aktivitas transaksi terbaru.',
    placement: 'bottom',
  },
  {
    target: '.stats-grid-tour',
    content: 'Di sini Anda bisa melihat ringkasan statistik inventaris secara real-time.',
    placement: 'bottom',
  },
  {
    target: '.sales-chart-tour',
    content: 'Grafik ini menunjukkan tren penjualan dari transaksi pemasukan per hari.',
    placement: 'top',
  },
  {
    target: '.play-guide-tour',
    content: 'Butuh bantuan lagi? Klik tombol ini kapan saja untuk mengulang panduan ini.',
    placement: 'right',
  },
];

interface AppTourProps {
  runOnMount?: boolean;
}

function getAvailableSteps() {
  if (typeof window === 'undefined') return [] as Step[];

  return tourSteps.filter((step) => {
    if (typeof step.target !== 'string') return true;
    return Boolean(document.querySelector(step.target));
  });
}

export default function AppTour({ runOnMount = false }: AppTourProps) {
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [availableSteps, setAvailableSteps] = useState<Step[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const refreshSteps = () => {
      setAvailableSteps(getAvailableSteps());
    };

    const rafId = window.requestAnimationFrame(() => {
      refreshSteps();
    });

    const timeoutId = window.setTimeout(() => {
      refreshSteps();
    }, 150);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [mounted, pathname]);

  useEffect(() => {
    if (!mounted) return;

    // Check if the user has already seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    
    if (runOnMount && !hasSeenTour && availableSteps.length > 0) {
      setRun(true);
    }

    // Listen for custom event to trigger tour again
    const handleStartTour = () => {
      const steps = getAvailableSteps();
      setAvailableSteps(steps);

      if (steps.length > 0) {
        // Force restart from first step when user replay guide
        setRun(false);
        window.requestAnimationFrame(() => setRun(true));
      }
    };

    window.addEventListener('start-app-tour', handleStartTour);
    return () => window.removeEventListener('start-app-tour', handleStartTour);
  }, [mounted, runOnMount, availableSteps]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  if (!mounted) return null;
  if (availableSteps.length === 0) return null;

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={availableSteps}
      options={{
        buttons: ['close', 'primary', 'skip'],
        showProgress: true,
        primaryColor: '#22c55e', // Green theme
        zIndex: 1000,
      }}
    />
  );
}
