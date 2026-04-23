import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('inventorio');

    console.log('Attempting to register user:', email);

    // Cek apakah user sudah ada
    const existingUser = await db.collection('users').findOne({ email });  
    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Simpan user baru
    const result = await db.collection('users').insertOne({
      name,
      email,
      password,
      role,
      createdAt: new Date(),
    });

    console.log('Registration successful for:', email);
    return NextResponse.json({ message: 'Registrasi berhasil', userId: result.insertedId });
  } catch (error: any) {
    console.error('Registration error detail:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
return NextResponse.json({ 
      error: 'Gagal melakukan registrasi',
      debug: error.message 
    }, { status: 500 });
  }
}
