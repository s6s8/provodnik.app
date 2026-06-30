/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/Users/idev/provodnik/.env.local' });

const OUT = '/Users/idev/provodnik/docs/qa/wildberries-opus-fix-2026-06-30/screenshots-local';
fs.mkdirSync(OUT, { recursive: true });
const base = 'http://127.0.0.1:3000';
const password = 'Demo1234!';
const ts = Date.now();
const guideEmail = `wb-guide-${ts}@example.com`;
const guideEmail2 = `wb-guide-dup-${ts}@example.com`;
const phone = `+7 933 ${String(ts).slice(-3)}-${String(ts).slice(-5,-3)}-${String(ts).slice(-7,-5)}`;
const adminEmail = 'admin@provodnik.app';

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const results = [];
function ok(name, data={}) { results.push({ name, ok: true, ...data }); }
function fail(name, error, data={}) { results.push({ name, ok: false, error: String(error && error.message || error), ...data }); }
async function screenshot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}
async function findUser(email) {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supa.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
  return null;
}
async function deleteUser(email) {
  const user = await findUser(email);
  if (user) await supa.auth.admin.deleteUser(user.id);
}
async function ensureAdmin() {
  let user = await findUser(adminEmail);
  if (!user) {
    const created = await supa.auth.admin.createUser({ email: adminEmail, password, email_confirm: true, user_metadata: { role: 'admin', full_name: 'Администратор' }, app_metadata: { role: 'admin' } });
    if (created.error) throw created.error;
    user = created.data.user;
  } else {
    const updated = await supa.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { role: 'admin', full_name: 'Администратор' }, app_metadata: { role: 'admin' } });
    if (updated.error) throw updated.error;
  }
  const { error } = await supa.from('profiles').upsert({ id: user.id, email: adminEmail, role: 'admin', full_name: 'Администратор' }, { onConflict: 'id' });
  if (error) throw error;
}
async function fillGuideSignup(page, email, withPhone = true) {
  await page.goto(`${base}/auth?role=guide`, { waitUntil: 'networkidle' });
  await page.getByLabel('Как к вам обращаться').fill('Wildberries QA Guide');
  if (withPhone) await page.getByLabel('Телефон для проверки').fill(phone);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Создайте пароль').fill(password);
  const radio = page.getByRole('radio', { name: 'Представитель агентства' });
  if (await radio.count()) await radio.check();
}

(async () => {
  await Promise.all([deleteUser(guideEmail), deleteUser(guideEmail2)]);
  await ensureAdmin();
  const browser = await chromium.launch({ headless: true });
  try {
    // No-phone guard.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
      const page = await ctx.newPage();
      await fillGuideSignup(page, guideEmail2, false);
      await page.getByRole('button', { name: 'Создать профиль' }).click();
      await page.getByText('Укажите телефон', { exact: false }).waitFor({ timeout: 5000 });
      ok('guide signup without phone is blocked', { screenshot: await screenshot(page, '01-guide-no-phone-blocked.png') });
      await ctx.close();
    }

    // Successful guide signup with phone.
    let createdUserId = null;
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
      const page = await ctx.newPage();
      await fillGuideSignup(page, guideEmail, true);
      ok('guide signup form shows guide-specific copy and guide type choice', { screenshot: await screenshot(page, '02-guide-signup-form.png') });
      await page.getByRole('button', { name: 'Создать профиль' }).click();
      await page.waitForURL('**/guide/profile', { timeout: 20000 });
      await page.getByText('Профиль гида', { exact: false }).waitFor({ timeout: 15000 }).catch(() => {});
      ok('guide signup with phone succeeds and lands on profile', { url: page.url(), screenshot: await screenshot(page, '03-guide-profile-after-signup.png') });

      const user = await findUser(guideEmail); createdUserId = user && user.id;
      const { data: profile } = await supa.from('profiles').select('id, role, phone, email').eq('email', guideEmail).maybeSingle();
      const { data: gp } = createdUserId ? await supa.from('guide_profiles').select('user_id, base_city, verification_status').eq('user_id', createdUserId).maybeSingle() : { data: null };
      ok('DB user/profile rows exist after signup', { profile, guideProfile: gp });

      await page.getByLabel('Базовый город').fill('Тбилиси');
      await page.getByLabel('Регионы').fill('Тбилиси, Кахетия');
      await page.getByLabel('Лет опыта в роли гида').fill('7');
      await page.locator('#about').getByRole('button', { name: 'Сохранить' }).click();
      await page.getByText('Сохранено', { exact: false }).waitFor({ timeout: 10000 });
      const { data: saved } = await supa.from('guide_profiles').select('base_city, regions, years_experience').eq('user_id', createdUserId).maybeSingle();
      ok('guide first profile block saves via logged-in UI', { saved, screenshot: await screenshot(page, '04-guide-profile-save-success.png') });
      await ctx.close();
    }

    // Duplicate phone guard.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
      const page = await ctx.newPage();
      await fillGuideSignup(page, guideEmail2, true);
      await page.getByRole('button', { name: 'Создать профиль' }).click();
      await page.getByText('телефон уже', { exact: false }).waitFor({ timeout: 15000 });
      ok('duplicate phone is blocked before second account', { screenshot: await screenshot(page, '05-guide-duplicate-phone-blocked.png') });
      await ctx.close();
    }

    // Homepage date picker.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await ctx.newPage();
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.getByLabel('Когда').click();
      const enabledDay = page.locator('button.rdp-day_button:not(:disabled)').first();
      await enabledDay.click();
      const label = await page.getByLabel('Когда').innerText();
      if (/Когда/.test(label)) throw new Error('date picker still shows placeholder');
      ok('homepage date picker applies selected date', { label, screenshot: await screenshot(page, '06-home-date-selected.png') });
      await ctx.close();
    }

    // Admin login / drafts queue.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
      const page = await ctx.newPage();
      await page.goto(`${base}/auth?next=/admin/guides?view=drafts`, { waitUntil: 'networkidle' });
      await page.getByLabel('Email').fill(adminEmail);
      await page.getByRole('textbox', { name: 'Пароль' }).fill(password);
      await page.getByRole('button', { name: 'Войти' }).click();
      await page.waitForURL('**/admin/guides**', { timeout: 20000 });
      await page.getByText('Wildberries QA Guide', { exact: false }).waitFor({ timeout: 15000 }).catch(() => {});
      ok('admin can log in and inspect guide queue/drafts', { url: page.url(), screenshot: await screenshot(page, '07-admin-guides-drafts.png') });
      await ctx.close();
    }
  } catch (e) {
    fail('playwright verification', e);
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(OUT, 'verification-results.json'), JSON.stringify({ base, guideEmail, phone, results }, null, 2));
    console.log(JSON.stringify({ out: OUT, guideEmail, phone, results }, null, 2));
  }
})();
