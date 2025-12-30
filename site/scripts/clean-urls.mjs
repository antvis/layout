import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve(process.cwd(), 'doc_build');

function rewriteInternalHtmlLinks(html) {
  return (
    html
      // Prefer directory-style URLs.
      .replace(/(href|content)="\/index\.html"/g, '$1="/"')
      .replace(/(href|content)='\/index\.html'/g, "$1='/'")
      .replace(
        /(href|content)="((?:\/|\.{1,2}\/)[^"]*?)\/index\.html"/g,
        '$1="$2/"',
      )
      .replace(
        /(href|content)='((?:\/|\.{1,2}\/)[^']*?)\/index\.html'/g,
        "$1='$2/'",
      )
      .replace(
        /(href|content)="((?:\/|\.{1,2}\/)[^"]*?)\.html"/g,
        '$1="$2/"',
      )
      .replace(
        /(href|content)='((?:\/|\.{1,2}\/)[^']*?)\.html'/g,
        "$1='$2/'",
      )
  );
}

function rewriteInternalTextLinks(text) {
  // Replace internal `.html` URLs inside JS/JSON bundles to avoid exposing `.html` in the UI.
  return text
    .replace(/(["'])\/index\.html\1/g, '$1/$1')
    .replace(/(["'])((?:\/|\.{1,2}\/)[^"']*?)\/index\.html\1/g, '$1$2/$1')
    .replace(/(["'])((?:\/|\.{1,2}\/)[^"']*?)\.html\1/g, '$1$2/$1');
}

function redirectHtml(target) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${target}" />
    <title>Redirecting…</title>
  </head>
  <body>
    <script>
      location.replace(${JSON.stringify(target)});
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0; url=${target}" />
      <a href="${target}">Continue</a>
    </noscript>
  </body>
</html>
`;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(fullPath)));
      continue;
    }
    results.push(fullPath);
  }
  return results;
}

async function main() {
  const files = await walk(outDir);
  const htmlFiles = files.filter((filePath) => filePath.endsWith('.html'));

  for (const filePath of htmlFiles) {
    const baseName = path.basename(filePath);
    const originalHtml = await fs.readFile(filePath, 'utf8');
    const rewrittenHtml = rewriteInternalHtmlLinks(originalHtml);
    const relative = path
      .relative(outDir, filePath)
      .split(path.sep)
      .join('/');

    // Hard redirect `/zh` and `/zh/index.html` to the docs entry.
    if (relative === 'zh/index.html') {
      await fs.writeFile(filePath, redirectHtml('./guide/introduction/'));
      continue;
    }

    // Keep `index.html` and `404.html` as-is (but rewrite internal links).
    if (baseName === 'index.html' || baseName === '404.html') {
      if (rewrittenHtml !== originalHtml) {
        await fs.writeFile(filePath, rewrittenHtml);
      }
      continue;
    }

    const nameWithoutExt = baseName.slice(0, -'.html'.length);
    const cleanDir = path.join(path.dirname(filePath), nameWithoutExt);
    await fs.mkdir(cleanDir, { recursive: true });
    await fs.writeFile(path.join(cleanDir, 'index.html'), rewrittenHtml);

    await fs.writeFile(filePath, redirectHtml(`./${nameWithoutExt}/`));
  }

  // Rewrite internal `.html` URLs embedded in bundles (JS + search index JSON).
  const textFiles = files.filter(
    (filePath) => filePath.endsWith('.js') || filePath.endsWith('.json'),
  );

  for (const filePath of textFiles) {
    const originalText = await fs.readFile(filePath, 'utf8');
    const rewrittenText = rewriteInternalTextLinks(originalText);
    if (rewrittenText !== originalText) {
      await fs.writeFile(filePath, rewrittenText);
    }
  }
}

main().catch((error) => {
  console.error('[clean-urls] failed:', error);
  process.exitCode = 1;
});
