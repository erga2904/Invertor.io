import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Data login tidak lengkap' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('inventorio');

    console.log('Attempting login for:', email);

    // Cari user di database
    const user = await db.collection('users').findOne({ email, password });

    if (!user) {
      console.log('Login failed: Invalid credentials for', email);
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    console.log('Login successful for:', email);
    // Login Berhasil
    return NextResponse.json({
      message: 'Login Berhasil',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Login error detail:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({ 
      error: 'Gagal melakukan login',
      debug: error.message 
    }, { status: 500 });
  }
}
