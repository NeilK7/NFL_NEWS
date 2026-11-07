import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getEnvFromRuminate } from '@/lib/fireworks';
import { UserPreferences } from '@/types';

export const dynamic = 'force-dynamic';

const LOCAL_PREFS_FILE = path.join(process.cwd(), '.gridiron-user-preferences.json');
const CLOUD_EMAIL = 'gridiron_apex_command_vault@ruminate.app';

function getSupabaseAdminCreds() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    getEnvFromRuminate('SUPABASE_URL') ||
    getEnvFromRuminate('NEXT_PUBLIC_SUPABASE_URL');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getEnvFromRuminate('SUPABASE_SERVICE_ROLE_KEY');
  return { url, key };
}

function readLocalServerPrefs(): UserPreferences | null {
  try {
    if (fs.existsSync(LOCAL_PREFS_FILE)) {
      const raw = fs.readFileSync(LOCAL_PREFS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLocalServerPrefs(prefs: UserPreferences) {
  try {
    fs.writeFileSync(LOCAL_PREFS_FILE, JSON.stringify(prefs, null, 2), 'utf8');
  } catch {
    // ignore on read-only serverless fs
  }
}

export async function GET() {
  // 1. Check local server file first for instant response
  const localPrefs = readLocalServerPrefs();

  // 2. Also check Supabase Auth Admin metadata (Ruminate pattern)
  const { url, key } = getSupabaseAdminCreds();
  if (url && key) {
    try {
      const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=100`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const users = listData?.users || [];
        const vaultUser = users.find((u: any) => u.email === CLOUD_EMAIL);
        if (vaultUser?.user_metadata?.gridironPreferences) {
          const cloudPrefs = vaultUser.user_metadata.gridironPreferences as UserPreferences;
          writeLocalServerPrefs(cloudPrefs);
          return NextResponse.json({ preferences: cloudPrefs, source: 'supabase-cloud' });
        }
      }
    } catch {
      // fall through to localPrefs
    }
  }

  return NextResponse.json({
    preferences: localPrefs,
    source: localPrefs ? 'server-disk' : 'none',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prefs: UserPreferences = body.preferences || body;

    if (!prefs || typeof prefs !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences payload' }, { status: 400 });
    }

    // 1. Save to local server file
    writeLocalServerPrefs(prefs);

    // 2. Save to Supabase Auth Admin user_metadata (Ruminate pattern)
    const { url, key } = getSupabaseAdminCreds();
    let syncedCloud = false;

    if (url && key) {
      try {
        const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=100`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        });

        if (listRes.ok) {
          const listData = await listRes.json();
          const users = listData?.users || [];
          const existing = users.find((u: any) => u.email === CLOUD_EMAIL);

          if (existing) {
            const updateRes = await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
              method: 'PUT',
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_metadata: {
                  ...(existing.user_metadata || {}),
                  gridironPreferences: prefs,
                  updatedAt: new Date().toISOString(),
                },
              }),
              signal: AbortSignal.timeout(4000),
            });
            syncedCloud = updateRes.ok;
          } else {
            const createRes = await fetch(`${url}/auth/v1/admin/users`, {
              method: 'POST',
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: CLOUD_EMAIL,
                password: 'GridironApexVaultPassword2026!',
                email_confirm: true,
                user_metadata: {
                  gridironPreferences: prefs,
                  updatedAt: new Date().toISOString(),
                },
              }),
              signal: AbortSignal.timeout(4000),
            });
            syncedCloud = createRes.ok;
          }
        }
      } catch (e) {
        console.warn('Cloud preferences sync warning:', e);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCloud,
      preferences: prefs,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Save preferences error:', err);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
