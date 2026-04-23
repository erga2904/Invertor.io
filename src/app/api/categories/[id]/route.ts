import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getRequestRole, hasPermission } from '@/lib/rbac';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const role = getRequestRole(request);
    if (!hasPermission(role, 'categories:edit')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin mengubah kategori' }, { status: 403 });
    }

    const { id } = await context.params;
    const { name, description } = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const existingCategory = await db.collection('categories').findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const nextName = typeof name === 'string' && name.trim() ? name.trim() : existingCategory.name;
    const nextDescription =
      typeof description === 'string' ? description.trim() : String(existingCategory.description || '');

    if (!nextName) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    if (nextName !== existingCategory.name) {
      const duplicateCategory = await db.collection('categories').findOne({
        name: nextName,
        _id: { $ne: new ObjectId(id) },
      });

      if (duplicateCategory) {
        return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 400 });
      }
    }

    const result = await db.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: nextName,
          description: nextDescription,
          updatedAt: new Date(),
        },
      }
    );

    if (!result.matchedCount) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Kategori berhasil diperbarui' });
  } catch (error) {
    console.error('Categories PATCH error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const role = getRequestRole(_);
    if (!hasPermission(role, 'categories:delete')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menghapus kategori' }, { status: 403 });
    }

    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection('categories').deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
  }
}
