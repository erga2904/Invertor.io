import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getRequestRole, hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const stores = await db.collection('stores').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Stores GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data toko' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const role = getRequestRole(request);
    if (!hasPermission(role, 'stores:create')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menambahkan toko' }, { status: 403 });
    }

    const { name, location, manager } = await request.json();

    if (!name || !location) {
      return NextResponse.json({ error: 'Nama toko dan lokasi wajib diisi' }, { status: 400 });
    }

    const store = {
      name,
      location,
      manager: manager || 'Belum diisi',
      employees: 0,
      items: 0,
      orders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection('stores').insertOne(store);

    return NextResponse.json({
      message: 'Toko berhasil ditambahkan',
      store: { ...store, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Stores POST error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan toko' }, { status: 500 });
  }
}
