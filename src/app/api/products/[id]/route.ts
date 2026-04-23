import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { buildFallbackImageUrl, resolveProductImage } from '@/lib/product-images';
import { getRequestRole, hasPermission } from '@/lib/rbac';

function isValidManualImageUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const role = getRequestRole(request);
    if (!hasPermission(role, 'products:edit')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin mengubah produk' }, { status: 403 });
    }

    const { id } = await context.params;
    const payload = await request.json();
    const { name, sku, category, price, stock, manualImageUrl } = payload;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const existingProduct = await db.collection('products').findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const nextName = typeof name === 'string' && name.trim() ? name.trim() : existingProduct.name;
    const nextSku = typeof sku === 'string' && sku.trim() ? sku.trim() : existingProduct.sku;
    const nextCategory =
      typeof category === 'string' && category.trim() ? category.trim() : existingProduct.category;
    const nextPrice = Number.isFinite(Number(price)) ? Number(price) : Number(existingProduct.price || 0);
    const nextStock = Number.isFinite(Number(stock)) ? Number(stock) : Number(existingProduct.stock || 0);

    if (!nextName || !nextSku || !nextCategory) {
      return NextResponse.json({ error: 'Data produk tidak lengkap' }, { status: 400 });
    }

    if (nextSku !== existingProduct.sku) {
      const duplicateSku = await db.collection('products').findOne({
        sku: nextSku,
        _id: { $ne: new ObjectId(id) },
      });

      if (duplicateSku) {
        return NextResponse.json({ error: 'SKU sudah digunakan' }, { status: 400 });
      }
    }

    const shouldUseManualImage =
      typeof manualImageUrl === 'string' && manualImageUrl.trim().length > 0;

    const updatePayload: Record<string, unknown> = {
      name: nextName,
      sku: nextSku,
      category: nextCategory,
      price: nextPrice,
      stock: nextStock,
      updatedAt: new Date(),
    };

    if (shouldUseManualImage) {
      if (!isValidManualImageUrl(manualImageUrl)) {
        return NextResponse.json(
          { error: 'URL gambar tidak valid. Gunakan http/https atau data:image.' },
          { status: 400 }
        );
      }

      updatePayload.imageUrl = manualImageUrl.trim();
      updatePayload.imageSource = 'Manual URL';
      updatePayload.imageAttribution = 'manual-update';
    } else {
      const isCurrentManualImage = String(existingProduct.imageSource || '').startsWith('Manual');
      const hasIdentityChanged =
        nextName !== existingProduct.name ||
        nextCategory !== existingProduct.category ||
        nextSku !== existingProduct.sku;

      if (hasIdentityChanged && !isCurrentManualImage) {
        const resolvedImage = await resolveProductImage(nextName, nextCategory, nextSku);
        updatePayload.imageUrl =
          resolvedImage.imageUrl || buildFallbackImageUrl(nextName, nextCategory, nextSku);
        updatePayload.imageSource = resolvedImage.imageSource;
        updatePayload.imageAttribution = resolvedImage.imageAttribution || '';
      }
    }

    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (!result.matchedCount) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Produk berhasil diperbarui' });
  } catch (error) {
    console.error('Products PATCH error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const role = getRequestRole(_);
    if (!hasPermission(role, 'products:delete')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menghapus produk' }, { status: 403 });
    }

    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection('products').deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
