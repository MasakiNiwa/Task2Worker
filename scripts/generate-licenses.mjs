// 本番依存ライブラリのライセンス情報を package-lock.json から収集し、
// - src/generated/licenses.json     (ヘルプページのクレジット表示用)
// - public/THIRD_PARTY_LICENSES.txt (公開サイトで配布する全文)
// - THIRD_PARTY_LICENSES.md         (リポジトリ管理用の一覧)
// を生成する。手作業による記載漏れを防ぐため build / dev の前に必ず実行する。
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));

// "owner/repo" や "git+https://...git" 形式のリポジトリ表記を閲覧用 URL にそろえる
function normalizeRepo(repo) {
  const url = repo
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^github:/, '');
  return /^[\w.-]+\/[\w.-]+$/.test(url) ? `https://github.com/${url}` : url;
}

const LICENSE_FILE = /^(licen[cs]e|copying)(\..*)?$/i;

const entries = [];
for (const [path, meta] of Object.entries(lock.packages ?? {})) {
  if (!path || meta.dev || meta.devOptional || meta.link) continue;
  const dir = join(root, path);
  if (!existsSync(join(dir, 'package.json'))) continue;
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const licenseFile = readdirSync(dir).find((f) => LICENSE_FILE.test(f));
  const repository =
    typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository?.url ?? '');
  entries.push({
    name: pkg.name,
    version: pkg.version,
    license: typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'UNKNOWN'),
    author: typeof pkg.author === 'string' ? pkg.author : (pkg.author?.name ?? ''),
    homepage: pkg.homepage ?? normalizeRepo(repository),
    licenseText: licenseFile ? readFileSync(join(dir, licenseFile), 'utf8').trim() : '',
  });
}

// 同一パッケージの重複(異なるバージョン)を除き名前順に並べる
const unique = [...new Map(entries.map((e) => [`${e.name}@${e.version}`, e])).values()].sort(
  (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
);

mkdirSync(join(root, 'src/generated'), { recursive: true });
writeFileSync(join(root, 'src/generated/licenses.json'), JSON.stringify(unique, null, 2));

writeFileSync(
  join(root, 'public/THIRD_PARTY_LICENSES.txt'),
  unique
    .map(
      (e) =>
        `${'='.repeat(72)}\n${e.name}@${e.version} (${e.license})\n${e.homepage}\n${'-'.repeat(72)}\n${e.licenseText || '(ライセンス本文はパッケージに同梱されていません)'}\n`,
    )
    .join('\n'),
);

writeFileSync(
  join(root, 'THIRD_PARTY_LICENSES.md'),
  [
    '# Third-Party Licenses',
    '',
    'Task2Worker が配布物に含めているサードパーティ製ライブラリの一覧です。',
    'このファイルは `npm run licenses` で自動生成されます(手で編集しないでください)。',
    'ライセンス本文は公開サイトの `THIRD_PARTY_LICENSES.txt` に収録しています。',
    '',
    '| Package | Version | License |',
    '| --- | --- | --- |',
    ...unique.map((e) => `| ${e.homepage ? `[${e.name}](${e.homepage})` : e.name} | ${e.version} | ${e.license} |`),
    '',
  ].join('\n'),
);

console.log(`licenses: ${unique.length} packages`);
