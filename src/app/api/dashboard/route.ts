import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Ambil data statistik dari koleksi MongoDB
    const stats = await db.collection('stats').find({}).toArray();
    const salesSeed = await db.collection('sales').find({}).toArray();
    const stocks = await db.collection('stocks').find({}).toArray();
    const stores = await db.collection('stores').find({}).toArray();
    const products = await db.collection('products').find({}, { projection: { category: 1 } }).toArray();
    const transactions = await db
      .collection('transactions')
      .find({}, { projection: { type: 1, amount: 1, createdAt: 1 } })
      .toArray();

    const dayMap = [
      { jsDay: 1, label: 'Sen' },
      { jsDay: 2, label: 'Sel' },
      { jsDay: 3, label: 'Rab' },
      { jsDay: 4, label: 'Kam' },
      { jsDay: 5, label: 'Jum' },
      { jsDay: 6, label: 'Sab' },
      { jsDay: 0, label: 'Min' },
    ];

    const incomeByDay = dayMap.reduce((acc: Record<number, number>, item) => {
      acc[item.jsDay] = 0;
      return acc;
    }, {});

    const incomeTransactions = transactions.filter((trx: any) => trx?.type === 'income');
    incomeTransactions.forEach((trx: any) => {
      const createdAt = trx?.createdAt ? new Date(trx.createdAt) : new Date();
      const day = createdAt.getDay();
      incomeByDay[day] = (incomeByDay[day] || 0) + Number(trx?.amount || 0);
    });

    const maxIncome = Math.max(
      1,
      ...dayMap.map((item) => incomeByDay[item.jsDay] || 0)
    );

    const salesFromTransactions = dayMap.map((item, index) => {
      const amount = incomeByDay[item.jsDay] || 0;
      return {
        label: item.label,
        amount,
        percentage: amount > 0 ? Math.max(8, Math.round((amount / maxIncome) * 100)) : 0,
        color: ['#22c55e', '#16a34a', '#10b981', '#84cc16', '#15803d', '#059669', '#65a30d'][index % 7],
      };
    });

    const hasIncomeData = salesFromTransactions.some((item) => item.amount > 0);
    const sales = hasIncomeData
      ? salesFromTransactions
      : salesSeed.map((item: any, index: number) => ({
          label: item?.label || `Hari ${index + 1}`,
          amount: Number(item?.amount || 0),
          percentage: Number(item?.percentage || 0),
          color: ['#22c55e', '#16a34a', '#10b981', '#84cc16', '#15803d', '#059669', '#65a30d'][index % 7],
        }));

    const categoryCountMap = products.reduce((acc: Record<string, number>, product: any) => {
      const category = (product?.category || '').trim();
      if (!category) return acc;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const totalProducts = products.length || 1;
    const topCategories = Object.entries(categoryCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / totalProducts) * 100),
      }));

    return NextResponse.json({
      stats: stats.length ? stats : [],
      sales: sales.length ? sales : [],
      salesSource: hasIncomeData ? 'transactions' : 'seed',
      stocks: stocks.length ? stocks : [],
      stores: stores.length ? stores : [],
      topCategories,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
