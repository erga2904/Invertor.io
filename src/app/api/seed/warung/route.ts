import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { resolveProductImage } from '@/lib/product-images';

const dummyCategories = [
  { name: 'Mie Instan', description: 'Mie instan sachet dan cup' },
  { name: 'Minuman', description: 'Minuman sachet, botol, dan kaleng' },
  { name: 'Snack', description: 'Makanan ringan kemasan' },
  { name: 'Sembako', description: 'Kebutuhan pokok harian' },
  { name: 'Rokok', description: 'Rokok eceran dan bungkus' },
  { name: 'Perlengkapan Mandi', description: 'Sabun, sampo, pasta gigi' },
];

const dummyProducts = [
  { name: 'Indomie Goreng', sku: 'WRG-001', category: 'Mie Instan', price: 3500, stock: 120 },
  { name: 'Mie Sedaap Soto', sku: 'WRG-002', category: 'Mie Instan', price: 3400, stock: 85 },
  { name: 'Pop Mie Ayam', sku: 'WRG-003', category: 'Mie Instan', price: 6500, stock: 32 },
  { name: 'Aqua 600ml', sku: 'WRG-004', category: 'Minuman', price: 3000, stock: 96 },
  { name: 'Teh Pucuk 350ml', sku: 'WRG-005', category: 'Minuman', price: 4500, stock: 60 },
  { name: 'Kopi Kapal Api Sachet', sku: 'WRG-006', category: 'Minuman', price: 2200, stock: 140 },
  { name: 'Roma Kelapa', sku: 'WRG-007', category: 'Snack', price: 2200, stock: 75 },
  { name: 'Qtela Singkong', sku: 'WRG-008', category: 'Snack', price: 8500, stock: 25 },
  { name: 'Chitato Sapi Panggang', sku: 'WRG-009', category: 'Snack', price: 12000, stock: 18 },
  { name: 'Beras Premium 5kg', sku: 'WRG-010', category: 'Sembako', price: 76000, stock: 14 },
  { name: 'Gula Pasir 1kg', sku: 'WRG-011', category: 'Sembako', price: 17500, stock: 40 },
  { name: 'Minyak Goreng 1L', sku: 'WRG-012', category: 'Sembako', price: 21000, stock: 28 },
  { name: 'Rokok Gudang Garam 12', sku: 'WRG-013', category: 'Rokok', price: 24000, stock: 22 },
  { name: 'Rokok Surya 16', sku: 'WRG-014', category: 'Rokok', price: 33000, stock: 16 },
  { name: 'Sabun Lifebuoy', sku: 'WRG-015', category: 'Perlengkapan Mandi', price: 4200, stock: 48 },
  { name: 'Sampo Sunsilk Sachet', sku: 'WRG-016', category: 'Perlengkapan Mandi', price: 1000, stock: 160 },
];

const dummyStores = [
  { name: 'Warung Berkah', location: 'Jl. Melati No. 12', manager: 'Pak Jaya', employees: 2, items: 420, orders: 37 },
  { name: 'Warung Maju Jaya', location: 'Jl. Kenanga No. 8', manager: 'Bu Rini', employees: 3, items: 510, orders: 52 },
  { name: 'Warung Sumber Rejeki', location: 'Jl. Cendana No. 5', manager: 'Pak Darto', employees: 2, items: 398, orders: 31 },
];

const dummyTransactions = [
  { type: 'income', amount: 1250000, note: 'Penjualan harian pagi' },
  { type: 'income', amount: 980000, note: 'Penjualan harian sore' },
  { type: 'expense', amount: 450000, note: 'Belanja restok mie instan' },
  { type: 'expense', amount: 320000, note: 'Belanja restok minuman' },
  { type: 'expense', amount: 150000, note: 'Biaya listrik dan air' },
];

const dummyStats = [
  { label: 'Produk Aktif', value: '16', sub: 'Jenis' },
  { label: 'Transaksi Hari Ini', value: '58', sub: 'Transaksi' },
  { label: 'Pelanggan Harian', value: '132', sub: 'Orang' },
  { label: 'Omzet Mingguan', value: '7.8 Jt', sub: 'Rupiah' },
  { label: 'Barang Hampir Habis', value: '4', sub: 'Item' },
];

const dummySales = [
  { label: 'Sen', percentage: 55, color: 'bg-green-500' },
  { label: 'Sel', percentage: 72, color: 'bg-green-600' },
  { label: 'Rab', percentage: 68, color: 'bg-emerald-500' },
  { label: 'Kam', percentage: 80, color: 'bg-lime-500' },
  { label: 'Jum', percentage: 90, color: 'bg-green-700' },
  { label: 'Sab', percentage: 76, color: 'bg-emerald-600' },
  { label: 'Min', percentage: 61, color: 'bg-lime-600' },
];

const dummyStocks = [
  { label: 'Indomie Goreng', value: 120, isWarning: false },
  { label: 'Aqua 600ml', value: 96, isWarning: false },
  { label: 'Beras Premium 5kg', value: 14, isWarning: true },
  { label: 'Chitato Sapi Panggang', value: 18, isWarning: true },
  { label: 'Rokok Surya 16', value: 16, isWarning: true },
];

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    for (const category of dummyCategories) {
      await db.collection('categories').updateOne(
        { name: category.name },
        {
          $set: { ...category, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }

    for (const product of dummyProducts) {
      const resolvedImage = await resolveProductImage(product.name, product.category, product.sku);
      const seededProduct = {
        ...product,
        imageUrl: resolvedImage.imageUrl,
        imageSource: resolvedImage.imageSource,
        imageAttribution: resolvedImage.imageAttribution || '',
      };

      await db.collection('products').updateOne(
        { sku: product.sku },
        {
          $set: { ...seededProduct, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }

    for (const store of dummyStores) {
      await db.collection('stores').updateOne(
        { name: store.name },
        {
          $set: { ...store, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }

    const existingTransactions = await db.collection('transactions').countDocuments();
    if (existingTransactions === 0) {
      await db.collection('transactions').insertMany(
        dummyTransactions.map((item) => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    for (const stat of dummyStats) {
      await db.collection('stats').updateOne(
        { label: stat.label },
        {
          $set: { ...stat, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }

    for (const sale of dummySales) {
      await db.collection('sales').updateOne(
        { label: sale.label },
        {
          $set: { ...sale, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }

    for (const stock of dummyStocks) {
      await db.collection('stocks').updateOne(
        { label: stock.label },
        {
          $set: { ...stock, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }

    const existingAppSettings = await db.collection('settings').findOne({ key: 'app' });
    if (!existingAppSettings) {
      await db.collection('settings').insertOne({
        key: 'app',
        value: {
          storeName: 'Warung Berkah',
          ownerName: 'Pak Jaya',
          email: 'warungberkah@example.com',
          notifications: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const summary = {
      categories: await db.collection('categories').countDocuments(),
      products: await db.collection('products').countDocuments(),
      stores: await db.collection('stores').countDocuments(),
      transactions: await db.collection('transactions').countDocuments(),
      stats: await db.collection('stats').countDocuments(),
      sales: await db.collection('sales').countDocuments(),
      stocks: await db.collection('stocks').countDocuments(),
    };

    return NextResponse.json({
      message: 'Data dummy warung berhasil diisi',
      summary,
    });
  } catch (error) {
    console.error('Seed warung error:', error);
    return NextResponse.json({ error: 'Gagal mengisi data dummy warung' }, { status: 500 });
  }
}
