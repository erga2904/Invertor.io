import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getRequestRole, hasPermission } from '@/lib/rbac';

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const role = getRequestRole(_);
    if (!hasPermission(role, 'stores:delete')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menghapus toko' }, { status: 403 });
    }

    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection('stores').deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Toko berhasil dihapus' });
  } catch (error) {
    console.error('Stores DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus toko' }, { status: 500 });
  }
}
