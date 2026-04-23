import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getRequestRole, hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const transactions = await db.collection('transactions').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data transaksi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const role = getRequestRole(request);
    if (!hasPermission(role, 'transactions:create')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menambahkan transaksi' }, { status: 403 });
    }

    const { type, amount, note } = await request.json();

    if (!type || !amount) {
      return NextResponse.json({ error: 'Tipe dan nominal transaksi wajib diisi' }, { status: 400 });
    }

    const transaction = {
      type,
      amount: Number(amount),
      note: note || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection('transactions').insertOne(transaction);

    return NextResponse.json({
      message: 'Transaksi berhasil ditambahkan',
      transaction: { ...transaction, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan transaksi' }, { status: 500 });
  }
}
