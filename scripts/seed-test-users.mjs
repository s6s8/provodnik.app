import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

const dotenvPath = process.argv[2];
if (!dotenvPath) { console.error('usage: node seed-test-users.mjs <path-to-orch-.env>'); process.exit(2); }

const env = Object.fromEntries(
  readFileSync(dotenvPath, 'utf-8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).replace(/^"|"$/g, '').trim()]; })
);

const url = env.PROVODNIK_SUPABASE_URL;
const key = env.PROVODNIK_SUPABASE_SECRET_KEY;
if (!url || !key) { console.error('missing PROVODNIK_SUPABASE_URL / PROVODNIK_SUPABASE_SECRET_KEY'); process.exit(2); }

const supa = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const accounts = [
  { role: 'admin',    email: 'qa-admin@example.com',    fullName: 'QA Admin' },
  { role: 'guide',    email: 'qa-guide@example.com',    fullName: 'QA Guide' },
  { role: 'traveler', email: 'qa-traveler@example.com', fullName: 'QA Traveler' }
];

async function findUserByEmail(email) {
  const { data, error } = await supa.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

const results = [];
for (const acct of accounts) {
  const password = randomBytes(18).toString('base64url');
  const existing = await findUserByEmail(acct.email);
  let userId;
  if (existing) {
    const { data, error } = await supa.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) throw new Error(`updateUserById ${acct.role}: ${error.message}`);
    userId = data.user.id;
    console.error(`[${acct.role}] reset password for existing ${acct.email}`);
  } else {
    const { data, error } = await supa.auth.admin.createUser({ email: acct.email, password, email_confirm: true });
    if (error) throw new Error(`createUser ${acct.role}: ${error.message}`);
    userId = data.user.id;
    console.error(`[${acct.role}] created ${acct.email}`);
  }

  const { error: profErr } = await supa.from('profiles').upsert({
    id: userId,
    email: acct.email,
    full_name: acct.fullName,
    role: acct.role
  }, { onConflict: 'id' });
  if (profErr) throw new Error(`profile upsert ${acct.role}: ${profErr.message}`);

  const { error: roleMetaErr } = await supa.auth.admin.updateUserById(userId, {
    app_metadata: { role: acct.role },
  });
  if (roleMetaErr) throw new Error(`app_metadata ${acct.role}: ${roleMetaErr.message}`);

  if (acct.role === 'guide') {
    const { error: gpErr } = await supa.from('guide_profiles').upsert({
      user_id: userId,
      display_name: 'QA Guide Test',
      base_city: 'Москва'
    }, { onConflict: 'user_id' });
    if (gpErr) throw new Error(`guide_profiles upsert: ${gpErr.message}`);

    await supa.from('guide_licenses').delete().eq('guide_id', userId);

    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
    const future = new Date(Date.now() + 365 * 86400_000).toISOString().slice(0, 10);
    const { error: licErr } = await supa.from('guide_licenses').insert([
      { guide_id: userId, license_type: 'Аттестация экскурсовода', license_number: 'QA-LIC-001', issued_by: 'Минэк Москвы',    scope_mode: 'all',      valid_until: future    },
      { guide_id: userId, license_type: 'Гид-переводчик',           license_number: 'QA-LIC-002', issued_by: 'Ростуризм',        scope_mode: 'selected', valid_until: null       },
      { guide_id: userId, license_type: 'Региональная лицензия',    license_number: 'QA-LIC-003', issued_by: 'Минтуризм РТ',     scope_mode: 'selected', valid_until: yesterday  }
    ]);
    if (licErr) throw new Error(`guide_licenses insert: ${licErr.message}`);
    console.error(`[guide] seeded guide_profiles + 3 licenses`);
  }

  results.push({ role: acct.role, email: acct.email, password, userId });
}

console.log(JSON.stringify(results, null, 2));
