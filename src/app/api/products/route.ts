import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { buildFallbackImageUrl, resolveProductImage } from '@/lib/product-images';
import { getRequestRole, hasPermission } from '@/lib/rbac';

function isValidManualImageUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed);
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
    const productsWithImage = await Promise.all(products.map(async (product) => {
      const isManualImage = String(product.imageSource || '').startsWith('Manual');
      const shouldRegenerateFallback =
        !product.imageUrl ||
        (!isManualImage && (
          product.imageSource === 'LoremFlickr' ||
          product.imageSource === 'Picsum' ||
          product.imageSource === 'Clearbit' ||
          String(product.imageUrl).includes('loremflickr.com') ||
          String(product.imageUrl).includes('picsum.photos') ||
          String(product.imageUrl).includes('logo.clearbit.com')
        ));

      if (shouldRegenerateFallback) {
        const resolved = await resolveProductImage(
          product.name || 'produk',
          product.category || '',
          product.sku || String(product._id)
        );

        return {
          ...product,
          imageUrl: resolved.imageUrl || buildFallbackImageUrl(product.name || 'produk', product.category || '', product.sku || String(product._id)),
          imageSource: resolved.imageSource,
          imageAttribution: resolved.imageAttribution || '',
        };
      }

      return {
        ...product,
        imageUrl: product.imageUrl,
        imageSource: product.imageSource || 'Brand image',
        imageAttribution: product.imageAttribution || '',
      };
    }));

    return NextResponse.json({ products: productsWithImage });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const role = getRequestRole(request);
    if (!hasPermission(role, 'products:create')) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menambahkan produk' }, { status: 403 });
    }

    const { name, sku, category, price, stock, manualImageUrl } = await request.json();

    if (!name || !sku || !category) {
      return NextResponse.json({ error: 'Data produk tidak lengkap' }, { status: 400 });
    }

    let productImage = await resolveProductImage(name, category, sku);

    if (typeof manualImageUrl === 'string' && manualImageUrl.trim()) {
      if (!isValidManualImageUrl(manualImageUrl)) {
        return NextResponse.json(
          { error: 'URL gambar manual tidak valid. Gunakan http/https atau data:image.' },
          { status: 400 }
        );
      }

      productImage = {
        imageUrl: manualImageUrl.trim(),
        imageSource: 'Manual URL',
        imageAttribution: 'manual-input',
      };
    }

    const product = {
      name,
      sku,
      category,
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      imageUrl: productImage.imageUrl,
      imageSource: productImage.imageSource,
      imageAttribution: productImage.imageAttribution || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const existing = await db.collection('products').findOne({ sku: product.sku });
    if (existing) {
      return NextResponse.json({ error: 'SKU sudah digunakan' }, { status: 400 });
    }

    const result = await db.collection('products').insertOne(product);

    return NextResponse.json({
      message: 'Produk berhasil ditambahkan',
      product: { ...product, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan produk' }, { status: 500 });
  }
}
