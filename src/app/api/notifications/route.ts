import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning';
  createdAt: string;
  href: string;
};

type UserContext = {
  email: string;
  role: string;
};

function sanitizeKeyPart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
}

function resolveUserContext(request: Request): UserContext {
  return {
    email: (request.headers.get('x-user-email') || '').trim(),
    role: (request.headers.get('x-user-role') || '').trim(),
  };
}

function buildSettingsKey(user: UserContext) {
  if (!user.email) return 'app';
  return `app:${sanitizeKeyPart(user.email)}`;
}

export async function GET(request: Request) {
  try {
    const user = resolveUserContext(request);
    const settingsKey = buildSettingsKey(user);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    let settingsDoc = await db.collection('settings').findOne({ key: settingsKey });

    // Backward compatibility for old global setting, owner only.
    if (!settingsDoc && settingsKey !== 'app' && user.role === 'owner') {
      settingsDoc = await db.collection('settings').findOne({ key: 'app' });
    }

    const notificationsEnabled = settingsDoc?.value?.notifications !== false;

    if (!notificationsEnabled) {
      return NextResponse.json({
        notifications: [],
        disabled: true,
      });
    }

    const [lowStockProducts, latestTransactions] = await Promise.all([
      db
        .collection('products')
        .find(
          { stock: { $lte: 5 } },
          { projection: { name: 1, stock: 1, updatedAt: 1, createdAt: 1 } }
        )
        .sort({ stock: 1, updatedAt: -1 })
        .limit(6)
        .toArray(),
      db
        .collection('transactions')
        .find({}, { projection: { type: 1, amount: 1, note: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray(),
    ]);

    const stockNotifications: NotificationItem[] = lowStockProducts.map((item: any) => {
      const stock = Number(item?.stock || 0);
      return {
        id: `low-stock-${String(item?._id)}`,
        title: 'Stok Menipis',
        message: `${item?.name || 'Produk'} tinggal ${stock} unit. Segera lakukan restok.`,
        level: 'warning',
        createdAt: new Date(item?.updatedAt || item?.createdAt || Date.now()).toISOString(),
        href: '/products',
      };
    });

    const transactionNotifications: NotificationItem[] = latestTransactions.map((trx: any) => {
      const amount = Number(trx?.amount || 0).toLocaleString('id-ID');
      const typeLabel = trx?.type === 'expense' ? 'Pengeluaran' : 'Pemasukan';
      return {
        id: `trx-${String(trx?._id)}`,
        title: `Transaksi ${typeLabel}`,
        message: `${typeLabel} sebesar Rp ${amount}${trx?.note ? ` - ${trx.note}` : ''}`,
        level: 'info',
        createdAt: new Date(trx?.createdAt || Date.now()).toISOString(),
        href: '/finances',
      };
    });

    const allNotifications = [...stockNotifications, ...transactionNotifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    return NextResponse.json({
      notifications: allNotifications,
      disabled: false,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 });
  }
}
