#!/usr/bin/env node
/**
 * Verificatiescript voor de token-gated share-flow.
 * Draait met de publieke anon-sleutel (dus als anonieme bezoeker).
 *
 *   node scripts/verify-share-security.mjs <geldig-token>
 *
 * Verwacht:
 *  - anonieme select op shared_results  -> 0 rijen (RLS)
 *  - anonieme select op test_results    -> 0 rijen (RLS)
 *  - rpc get_shared_result(geldig)      -> data
 *  - rpc get_shared_result(fout)        -> null
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const validToken = process.argv[2];

if (!url || !key) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ontbreken.');
  process.exit(1);
}

const supabase = createClient(url, key);
let failed = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
};

const { data: shares } = await supabase.from('shared_results').select('*');
check('anon kan shared_results niet uitlezen', !shares || shares.length === 0, `${shares?.length ?? 0} rijen`);

const { data: tests } = await supabase.from('test_results').select('*');
check('anon kan test_results niet uitlezen', !tests || tests.length === 0, `${tests?.length ?? 0} rijen`);

const { data: bogus } = await supabase.rpc('get_shared_result', { p_token: 'niet-bestaand-token' });
check('foute token geeft null', bogus == null);

if (validToken) {
  const { data: valid, error } = await supabase.rpc('get_shared_result', { p_token: validToken });
  check('geldige token geeft data', !error && !!valid && !!valid.athlete_name, error?.message);
} else {
  console.log('SKIP  geldige token (geef er een mee als argument)');
}

process.exit(failed ? 1 : 0);
