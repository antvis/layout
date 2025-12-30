import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_REPORT_FILENAME = 'c593cabd_2025-12-16_22-31-41.json';

const sourceDir = path.resolve(__dirname, '../../perf/reports');
// Rspress serves static assets from `${userDocRoot}/public` where `userDocRoot = site/docs`.
// See: @rspress/core server.publicDir = join(userDocRoot, 'public')
const targetDir = path.resolve(__dirname, '../docs/public/perf/reports');
const manifestPath = path.resolve(__dirname, '../docs/public/perf/manifest.json');

function tryParseTimestampFromFilename(filename) {
  // e.g. c593cabd_2025-12-16_22-31-41.json
  const match = filename.match(/_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.json$/);
  if (!match) return null;
  const [date, time] = [match[1], match[2].replaceAll('-', ':')];
  const iso = `${date}T${time}`;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

async function ensureEmptyDir(dir) {
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => fs.unlink(path.join(dir, e.name))),
  );
}

async function main() {
  const files = (await fs.readdir(sourceDir))
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => {
      const ta = tryParseTimestampFromFilename(a) ?? 0;
      const tb = tryParseTimestampFromFilename(b) ?? 0;
      if (ta !== tb) return tb - ta;
      return b.localeCompare(a);
    });

  await ensureEmptyDir(targetDir);
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });

  const reports = [];
  for (const file of files) {
    const fullPath = path.join(sourceDir, file);
    const raw = await fs.readFile(fullPath, 'utf8');
    const json = JSON.parse(raw);

    const timestampMs = tryParseTimestampFromFilename(file);
    const repo = typeof json?.repo === 'string' ? json.repo : null;
    const cpu = json?.device?.cpu;
    const os = json?.device?.os;
    const deviceLabel =
      cpu?.brand && cpu?.cores ? `${cpu.brand} (${cpu.cores} cores)` : null;
    const osLabel = os?.distro ? `${os.distro}` : null;

    reports.push({
      file,
      repo,
      repoShort: repo ? repo.slice(0, 7) : null,
      timestampMs,
      benchmarks: json?.reports ? Object.keys(json.reports).length : null,
      deviceLabel,
      osLabel,
    });

    await fs.copyFile(fullPath, path.join(targetDir, file));
  }

  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceDir: path.relative(process.cwd(), sourceDir),
        defaultReport: files.includes(DEFAULT_REPORT_FILENAME) ? DEFAULT_REPORT_FILENAME : null,
        reports,
      },
      null,
      2,
    ),
    'utf8',
  );

  process.stdout.write(
    `[perf] synced ${files.length} report(s) -> ${path.relative(process.cwd(), targetDir)}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
