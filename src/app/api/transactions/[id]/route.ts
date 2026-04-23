import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getRequestRole, hasPermission } from '@/lib/rbac';

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const role = getRequestRole(_);
    if (!hasPermission(role, 'transactions:delete')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menghapus transaksi' }, { status: 403 });
    }

    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection('transactions').deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('Transactions DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
