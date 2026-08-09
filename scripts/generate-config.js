/**
 * scripts/generate-config.js — Gera supabase-config.js a partir de variáveis
 * de ambiente no momento do build (usado pelo Vercel).
 *
 * O arquivo supabase-config.js é ignorado pelo git (veja .gitignore), então
 * localmente cada dev cria o seu (veja supabase-config.example.js). Em
 * produção, a Vercel não tem esse arquivo — este script recria ele antes do
 * deploy, lendo SUPABASE_URL e SUPABASE_ANON_KEY das Environment Variables
 * do projeto (Vercel → Settings → Environment Variables).
 */
const fs = require('fs');
const path = require('path');

const url     = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    '[build] SUPABASE_URL e/ou SUPABASE_ANON_KEY não definidas. ' +
    'Configure-as em Vercel → Settings → Environment Variables.'
  );
  process.exit(1);
}

const outPath = path.join(__dirname, '..', 'supabase-config.js');
const content = `window.CHRONOS_SUPABASE = {\n  url: ${JSON.stringify(url)},\n  anonKey: ${JSON.stringify(anonKey)},\n};\n`;

fs.writeFileSync(outPath, content);
console.log('[build] supabase-config.js gerado a partir das variáveis de ambiente.');
