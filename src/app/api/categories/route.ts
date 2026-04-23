import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getRequestRole, hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const categories = await db.collection('categories').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kategori' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const role = getRequestRole(request);
    if (!hasPermission(role, 'categories:create')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menambahkan kategori' }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const existing = await db.collection('categories').findOne({ name });
    if (existing) {
      return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 400 });
    }

    const category = {
      name,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('categories').insertOne(category);

    return NextResponse.json({
      message: 'Kategori berhasil ditambahkan',
      category: { ...category, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan kategori' }, { status: 500 });
  }
}
