// provodnik.app/scripts/generate-specializations-proposal.ts
import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const KEYWORDS: Record<string, string[]> = {
  history: ['истори', 'историк'],
  architecture: ['архитектур', 'зодчеств'],
  nature: ['природ', 'парк', 'заповедник'],
  food: ['гастроном', 'кухн', 'дегустац', 'ресторан', 'ужин'],
  art: ['искусств', 'музе', 'галере'],
  photo: ['фотограф', 'фотопрогул'],
  kids: ['дет', 'семейн'],
  unusual: ['необычн', 'нестандартн', 'авторск'],
};

async function main() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('guide_profiles')
    .select('user_id, display_name, base_city, bio, specializations')
    .eq('verification_status', 'approved')
    .order('created_at');

  if (error) throw error;

  const rows = ['guide_id,user_id,display_name,home_base,proposed,source_keywords'];
  for (const g of data ?? []) {
    const bio = (g.bio ?? '').toLowerCase();
    const found: { spec: string; kw: string }[] = [];
    for (const [spec, kws] of Object.entries(KEYWORDS)) {
      const hit = kws.find((kw) => bio.includes(kw));
      if (hit) found.push({ spec, kw: hit });
    }
    rows.push([
      g.user_id,
      g.user_id,
      JSON.stringify(g.display_name ?? ''),
      JSON.stringify(g.base_city ?? ''),
      `"${found.map((f) => f.spec).join(',')}"`,
      `"${found.map((f) => f.kw).join('|')}"`,
    ].join(','));
  }

  await writeFile('tmp/specializations-proposal.csv', rows.join('\n'), 'utf-8');
  console.log(`Wrote ${rows.length - 1} guide proposals.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
