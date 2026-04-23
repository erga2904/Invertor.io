import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type UserContext = {
  email: string;
  name: string;
  role: string;
};

function sanitizeKeyPart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
}

function resolveUserContext(request: Request): UserContext {
  return {
    email: (request.headers.get('x-user-email') || '').trim(),
    name: (request.headers.get('x-user-name') || '').trim(),
    role: (request.headers.get('x-user-role') || '').trim(),
  };
}

function buildSettingsKey(user: UserContext) {
  if (!user.email) return 'app';
  return `app:${sanitizeKeyPart(user.email)}`;
}

function buildDefaultSettings(user: UserContext) {
  return {
    storeName: 'Inventor.io',
    ownerName: user.name || 'Pengguna',
    email: user.email || 'owner@inventorio.local',
    notifications: true,
    role: user.role || 'owner',
  };
}

export async function GET(request: Request) {
  try {
    const user = resolveUserContext(request);
    const settingsKey = buildSettingsKey(user);
    const defaultSettings = buildDefaultSettings(user);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    let settings = await db.collection('settings').findOne({ key: settingsKey });

    // Backward compatibility: old data stored as global key `app`.
    // Only owner can inherit global settings, so admin/karyawan keep profile-specific defaults.
    if (!settings && settingsKey !== 'app' && user.role === 'owner') {
      settings = await db.collection('settings').findOne({ key: 'app' });
    }

    return NextResponse.json(
      {
        settings: settings?.value || defaultSettings,
        key: settings?.key || settingsKey,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengaturan' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const user = resolveUserContext(request);
    const settingsKey = buildSettingsKey(user);
    const defaultSettings = buildDefaultSettings(user);

    const value = {
      storeName: payload?.storeName || defaultSettings.storeName,
      ownerName: payload?.ownerName || defaultSettings.ownerName,
      email: payload?.email || defaultSettings.email,
      notifications: Boolean(payload?.notifications),
      role: payload?.role || defaultSettings.role,
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection('settings').updateOne(
      { key: settingsKey },
      {
        $set: {
          key: settingsKey,
          value,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Pengaturan berhasil disimpan', settings: value });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}
