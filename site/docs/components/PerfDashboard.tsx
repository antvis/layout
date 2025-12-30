import { useEffect, useMemo, useState } from 'react';

type PerfReportEntry = {
  min?: number;
  max?: number;
  median?: number;
  avg?: number;
  variance?: number;
  reliable?: boolean;
  key?: string;
};

type PerfReport = {
  version?: string;
  device?: {
    os?: { distro?: string; arch?: string; serial?: string };
    cpu?: {
      manufacturer?: string;
      brand?: string;
      speed?: number;
      cores?: number;
    };
    memory?: { total?: number; free?: number };
    gpu?: { vendor?: string; model?: string; cores?: string };
  };
  repo?: string;
  client?: string;
  reports?: Record<
    string,
    {
      time?: PerfReportEntry[];
      status?: string;
    }
  >;
};

type MetricKey = 'median' | 'avg' | 'min' | 'max';

function formatMs(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value >= 100) return `${value.toFixed(0)} ms`;
  if (value >= 10) return `${value.toFixed(1)} ms`;
  return `${value.toFixed(2)} ms`;
}

function formatPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function deviceSignature(report: PerfReport | null) {
  if (!report?.device) return null;
  const cpu = report.device.cpu;
  const os = report.device.os;
  const gpu = report.device.gpu;
  const parts = [
    cpu?.brand
      ? `${cpu.brand}${cpu.cores ? ` (${cpu.cores} cores)` : ''}`
      : null,
    os?.distro ? `${os.distro}${os.arch ? `/${os.arch}` : ''}` : null,
    gpu?.model ? gpu.model : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' | ') : null;
}

type ParsedKey = {
  algorithm: string;
  library: string;
  version: string;
  implementation: string;
  size: string;
  detail: string;
};

function parseKey(full: string): ParsedKey {
  const match = full.match(/(.+?)\s*\((.*?):\s*(.*?)\)/);
  const name = match ? match[1].trim() : full.trim();
  const parts = name.split('-');
  const algorithm = parts[0] || 'unknown';
  const library = parts[1] || 'unknown';
  const version = parts[2] || 'unknown';
  const implementation = parts[3] || 'unknown';
  const size = match ? match[2] : 'unknown';
  const detail = match ? match[3] : '';
  return {
    algorithm,
    library,
    version,
    implementation,
    size,
    detail,
  };
}

function normalizeVersion(version: string) {
  if (version === 'dev') return '2.0';
  return '1.0';
}

type Row = {
  size: string;
  detail: string;
  preferred: boolean;
  baselineValue: number | null;
  compareValue: number | null;
  deltaMs: number | null;
  deltaPct: number | null;
  status: 'missing' | 'same' | 'regressed' | 'improved';
  baselineReliable: boolean | null;
  compareReliable: boolean | null;
};

type LayoutMeta = {
  id:
    | 'force-atlas2'
    | 'force'
    | 'fruchterman'
    | 'd3-force'
    | 'd3-force-3d'
    | 'dagre'
    | 'antv-dagre'
    | 'circular'
    | 'concentric'
    | 'radial'
    | 'grid'
    | 'random'
    | 'mds'
    | 'combo-combined';
  title: string;
  apiSlug: string;
  categoryId:
    | 'force-iterative'
    | 'hierarchy'
    | 'radial'
    | 'regular'
    | 'others'
    | 'combo';
};

type CategoryMeta = {
  id: LayoutMeta['categoryId'];
  label: string;
};

const CATEGORIES: CategoryMeta[] = [
  { id: 'force-iterative', label: '力导向（迭代）' },
  { id: 'hierarchy', label: '层次/流程图' },
  { id: 'radial', label: '环形/辐射' },
  { id: 'regular', label: '规则/初始化' },
  { id: 'others', label: '其他' },
  { id: 'combo', label: '复合/Combo' },
];

const LAYOUTS: LayoutMeta[] = [
  {
    id: 'force-atlas2',
    title: 'ForceAtlas2',
    apiSlug: 'force-atlas2',
    categoryId: 'force-iterative',
  },
  {
    id: 'force',
    title: 'Force',
    apiSlug: 'force',
    categoryId: 'force-iterative',
  },
  {
    id: 'fruchterman',
    title: 'Fruchterman',
    apiSlug: 'fruchterman',
    categoryId: 'force-iterative',
  },
  {
    id: 'd3-force',
    title: 'D3Force',
    apiSlug: 'd3-force',
    categoryId: 'force-iterative',
  },
  {
    id: 'd3-force-3d',
    title: 'D3Force3D',
    apiSlug: 'd3-force-3d',
    categoryId: 'force-iterative',
  },
  {
    id: 'dagre',
    title: 'Dagre',
    apiSlug: 'dagre',
    categoryId: 'hierarchy',
  },
  {
    id: 'antv-dagre',
    title: 'AntVDagre',
    apiSlug: 'antv-dagre',
    categoryId: 'hierarchy',
  },
  {
    id: 'circular',
    title: 'Circular',
    apiSlug: 'circular',
    categoryId: 'radial',
  },
  {
    id: 'concentric',
    title: 'Concentric',
    apiSlug: 'concentric',
    categoryId: 'radial',
  },
  {
    id: 'radial',
    title: 'Radial',
    apiSlug: 'radial',
    categoryId: 'radial',
  },
  {
    id: 'grid',
    title: 'Grid',
    apiSlug: 'grid',
    categoryId: 'regular',
  },
  {
    id: 'random',
    title: 'Random',
    apiSlug: 'random',
    categoryId: 'regular',
  },
  {
    id: 'mds',
    title: 'MDS',
    apiSlug: 'mds',
    categoryId: 'others',
  },
  {
    id: 'combo-combined',
    title: 'ComboCombined',
    apiSlug: 'combo-combined',
    categoryId: 'combo',
  },
];

const SIZE_ORDER = ['tiny', 'small', 'medium', 'large', 'xlarge'];

function shouldHideLibImpl(library: string, implementation: string) {
  return library === 'antv' && implementation === 'js';
}

function normalizeAlgorithmToLayoutId(
  algorithm: string,
): LayoutMeta['id'] | null {
  const v = (algorithm || '').trim();
  const map: Record<string, LayoutMeta['id']> = {
    forceAtlas2: 'force-atlas2',
    force: 'force',
    fruchterman: 'fruchterman',
    d3force: 'd3-force',
    d3force3d: 'd3-force-3d',
    dagre: 'dagre',
    'antv-dagre': 'antv-dagre',
    antvDagre: 'antv-dagre',
    circular: 'circular',
    concentric: 'concentric',
    radial: 'radial',
    grid: 'grid',
    random: 'random',
    mds: 'mds',
    'combo-combined': 'combo-combined',
    comboCombined: 'combo-combined',
  };
  return map[v] || null;
}

export default function PerfDashboard() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const reportFilename = 'c593cabd_2025-12-16_22-31-41.json';

  const [report, setReport] = useState<PerfReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>('avg');
  const [primaryVersion, setPrimaryVersion] = useState<'1.0' | '2.0'>('2.0');
  const baselineVersion: '1.0' | '2.0' =
    primaryVersion === '2.0' ? '1.0' : '2.0';
  const isZh =
    typeof window !== 'undefined'
      ? window.location.pathname.includes('/zh/')
      : false;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setReportError(null);
        const res = await fetch(`${baseUrl}perf/reports/${reportFilename}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = (await res.json()) as PerfReport;
        if (cancelled) return;
        setReport(data);
      } catch (e: any) {
        if (cancelled) return;
        setReportError(e?.message || String(e));
        setReport(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  const compareVersion = primaryVersion;

  const layoutData = useMemo(() => {
    if (!report?.reports) {
      return {
        rowsByLayout: new Map<LayoutMeta['id'], Row[]>(),
      };
    }

    const entries = Object.values(report.reports)
      .map((r) => r.time?.[0])
      .filter(Boolean)
      .map((t) => {
        const parsed = parseKey(t!.key || '');
        const layoutId = normalizeAlgorithmToLayoutId(parsed.algorithm);
        return {
          parsed,
          layoutId,
          normalizedVersion: normalizeVersion(parsed.version),
          metricValue:
            typeof (t as any)?.[metric] === 'number'
              ? (t as any)[metric]
              : null,
          reliable: typeof t!.reliable === 'boolean' ? t!.reliable : null,
          rawKey: t!.key || '',
        };
      })
      .filter((e) => e.layoutId && e.parsed.version !== 'unknown');

    // Prefer antv/js if multiple impls exist.
    const byGroup = new Map<string, typeof entries>();
    entries.forEach((e) => {
      const size = (e.parsed.size || 'unknown').toLowerCase();
      const gk = `${e.layoutId}|${size}|${e.parsed.detail}|${e.parsed.library}|${e.parsed.implementation}`;
      const list = byGroup.get(gk) || [];
      list.push(e);
      byGroup.set(gk, list);
    });

    const rowsByLayout = new Map<LayoutMeta['id'], Row[]>();

    for (const [groupKey, group] of byGroup) {
      const baseline =
        group.find((g: any) => g.normalizedVersion === baselineVersion) || null;
      const compare =
        group.find((g: any) => g.normalizedVersion === compareVersion) || null;

      const baselineValue = baseline?.metricValue ?? null;
      const compareValue = compare?.metricValue ?? null;

      const comparable = baselineValue != null && compareValue != null;
      const deltaMs = comparable ? compareValue - baselineValue : null;
      const deltaPct =
        comparable && baselineValue > 0
          ? (deltaMs! / baselineValue) * 100
          : null;

      const epsilon = 1e-6;
      const status: Row['status'] = !comparable
        ? 'missing'
        : deltaMs! > epsilon
        ? 'regressed'
        : deltaMs! < -epsilon
        ? 'improved'
        : 'same';

      const any = baseline || compare;
      if (!any?.layoutId) continue;

      const size = (any.parsed.size || 'unknown').toLowerCase();
      const detail = any.parsed.detail || '';

      const row: Row = {
        size,
        detail,
        preferred: shouldHideLibImpl(
          any.parsed.library,
          any.parsed.implementation,
        ),
        baselineValue,
        compareValue,
        deltaMs,
        deltaPct,
        status,
        baselineReliable: baseline?.reliable ?? null,
        compareReliable: compare?.reliable ?? null,
      };

      const list = rowsByLayout.get(any.layoutId) || [];
      list.push(row);
      rowsByLayout.set(any.layoutId, list);
    }

    // Condense rows per layout by picking the best candidate per size.
    for (const [layoutId, list] of rowsByLayout) {
      const bySize = new Map<string, Row[]>();
      list.forEach((r) => {
        const s = r.size;
        const group = bySize.get(s) || [];
        group.push(r);
        bySize.set(s, group);
      });

      const condensed: Row[] = [];
      for (const [size, rows] of bySize) {
        // Prefer rows that have both baseline and compare and are marked stable.
        rows.sort((a, b) => {
          const aPref = a.preferred ? 1 : 0;
          const bPref = b.preferred ? 1 : 0;
          if (aPref !== bPref) return bPref - aPref;
          const aHas =
            a.baselineValue != null && a.compareValue != null ? 1 : 0;
          const bHas =
            b.baselineValue != null && b.compareValue != null ? 1 : 0;
          if (aHas !== bHas) return bHas - aHas;
          const aStable =
            a.baselineReliable !== false && a.compareReliable !== false ? 1 : 0;
          const bStable =
            b.baselineReliable !== false && b.compareReliable !== false ? 1 : 0;
          if (aStable !== bStable) return bStable - aStable;
          return 0;
        });
        condensed.push(rows[0]);
      }

      condensed.sort((a, b) => {
        const ai = SIZE_ORDER.indexOf(a.size);
        const bi = SIZE_ORDER.indexOf(b.size);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

      rowsByLayout.set(layoutId, condensed);
    }

    return { rowsByLayout };
  }, [baselineVersion, compareVersion, metric, report]);

  const deviceLabel = deviceSignature(report);
  const badgeDevice = deviceLabel ? deviceLabel.split('|')[0]?.trim() : null;

  function apiHref(slug: string) {
    // Perf page is at `/perf/reports/` or `/zh/perf/reports/`.
    // API docs are under `/guide/api/*` (with optional `/zh/` prefix).
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const hasZh = path.includes('/zh/');
    const prefix = hasZh ? 'zh/' : '';
    return `${baseUrl}${prefix}guide/api/${slug}`;
  }

  if (reportError) {
    return (
      <div className="perfCard">
        <div className="perfTitle">Perf 报告未就绪</div>
        <div className="perfMuted">
          无法加载 <code>{`${baseUrl}perf/reports/${reportFilename}`}</code>：
          {reportError}
        </div>
        <div className="perfMuted">
          先在仓库根目录执行 <code>npm --prefix site run sync:perf</code>
          （或直接 <code>npm --prefix site run dev</code>）。
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="perfCard">
        <div className="perfTitle">加载中…</div>
      </div>
    );
  }

  return (
    <div className="perfRoot">
      <div className="perfTopbar perfTopbar--sticky">
        <div className="perfTopbarLeft">
          <div className="perfTitle">Performance</div>
          <div className="perfMeta">
            <div className="perfMuted">
              {isZh
                ? '数据在服务端（Node.js）环境采集，每个用例重复运行 20 次；默认展示 avg（20 次算术平均耗时，单位 ms）。'
                : 'Data is collected in a server (Node.js) runtime. Each case runs 20 times; default metric is avg (arithmetic mean in ms).'}
            </div>
            <div className="perfMuted">
              {isZh
                ? '采用服务端运行以减少浏览器端噪声（UI 线程/渲染管线、标签页后台节流、扩展注入、浏览器实现差异等）的影响，使结果更聚焦于布局计算耗时。'
                : 'Running outside the browser reduces noise from UI thread & rendering pipeline, background tab throttling, extensions, and browser implementation differences, keeping results focused on layout compute time.'}
            </div>
            <div className="perfMuted">
              {isZh
                ? '计时仅覆盖布局算法计算阶段，不包含 DOM/Canvas 渲染与回流/重绘等图形开销。'
                : 'Timing covers layout computation only; it excludes DOM/Canvas rendering and other graphics costs.'}
            </div>
            <div className="perfMuted">
              {isZh
                ? '建议优先关注同一份报告内 shown 相对 baseline 的变化；结果仍可能受 CPU 频率调节、系统调度、GC 抖动影响。'
                : 'Prefer within-report comparisons between shown and baseline; results may still vary due to CPU scaling, OS scheduling, and GC.'}
            </div>
          </div>
        </div>

        <div className="perfTopbarRight">
          <label className="perfControl perfControl--inline">
            Metric
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
            >
              <option value="avg">avg</option>
              <option value="median">median</option>
              <option value="min">min</option>
              <option value="max">max</option>
            </select>
          </label>

          <label className="perfControl perfControl--inline">
            {isZh ? '展示版本' : 'Shown'}
            <select
              value={primaryVersion}
              onChange={(e) =>
                setPrimaryVersion(e.target.value as '1.0' | '2.0')
              }
            >
              <option value="1.0">1.0</option>
              <option value="2.0">2.0</option>
            </select>
          </label>
        </div>

        {badgeDevice ? (
          <div className="perfDeviceBadge">{badgeDevice}</div>
        ) : null}
      </div>

      <div className="perfPageMeta">
        <span className="perfTag perfTag--baseline">
          {isZh ? 'baseline' : 'baseline'} {baselineVersion}
        </span>
        <span className="perfTag perfTag--compare">
          {isZh ? 'shown' : 'shown'} {primaryVersion}
        </span>
        <span className="perfMuted">
          report <code>{reportFilename}</code>
        </span>
      </div>

      {CATEGORIES.map((cat) => {
        const layouts = LAYOUTS.filter((l) => l.categoryId === cat.id);
        return (
          <section key={cat.id} className="perfCategory">
            <div className="perfCategoryHeader">{cat.label}</div>
            <div className="perfCardsGrid">
              {layouts.map((layout) => {
                const rows = layoutData.rowsByLayout.get(layout.id) || [];
                const counts = rows.reduce(
                  (acc, r) => {
                    if (r.status === 'improved') acc.faster += 1;
                    else if (r.status === 'regressed') acc.slower += 1;
                    else if (r.status === 'missing') acc.missing += 1;
                    return acc;
                  },
                  { faster: 0, slower: 0, missing: 0 },
                );

                const comparable = rows.filter(
                  (r) => r.deltaPct != null && r.status !== 'missing',
                );
                const avgDeltaPct =
                  comparable.length === 0
                    ? null
                    : comparable.reduce(
                        (sum, r) => sum + (r.deltaPct || 0),
                        0,
                      ) / comparable.length;
                const avgStatus: Row['status'] =
                  avgDeltaPct == null
                    ? 'missing'
                    : avgDeltaPct < 0
                    ? 'improved'
                    : avgDeltaPct > 0
                    ? 'regressed'
                    : 'same';

                return (
                  <div key={layout.id} className="perfLayoutCard">
                    <div className="perfLayoutHeader">
                      <div className="perfLayoutTitle">
                        <a
                          className="perfLayoutLink"
                          href={apiHref(layout.apiSlug)}
                        >
                          {layout.title}
                        </a>
                      </div>

                      <div className="perfLayoutBadges">
                        <span className={`perfBadge perfBadge--${avgStatus}`}>
                          {avgDeltaPct == null
                            ? 'no data'
                            : avgDeltaPct < 0
                            ? `faster ${formatPct(Math.abs(avgDeltaPct))}`
                            : avgDeltaPct > 0
                            ? `slower ${formatPct(Math.abs(avgDeltaPct))}`
                            : 'no change'}
                        </span>
                        <span className="perfMiniStat">
                          faster {counts.faster} · slower {counts.slower} ·
                          missing {counts.missing}
                        </span>
                      </div>
                    </div>

                    <div className="perfLayoutTable">
                      <div className="perfLayoutRow perfLayoutRow--head">
                        <div>Graph</div>
                        <div className="perfNum">{primaryVersion}</div>
                        <div className="perfNum">Δ</div>
                      </div>

                      {rows.length ? (
                        rows.map((r) => {
                          const deltaMsText =
                            r.deltaMs == null
                              ? '—'
                              : formatMs(Math.abs(r.deltaMs));
                          const deltaPctText =
                            r.deltaPct == null
                              ? '—'
                              : formatPct(Math.abs(r.deltaPct));
                          const compareMissing =
                            r.compareValue == null ||
                            !Number.isFinite(r.compareValue);
                          const baselineMissing =
                            r.baselineValue == null ||
                            !Number.isFinite(r.baselineValue);
                          const label =
                            r.status === 'missing'
                              ? 'missing'
                              : r.status === 'improved'
                              ? `faster ${deltaPctText}`
                              : r.status === 'regressed'
                              ? `slower ${deltaPctText}`
                              : 'no change';

                          return (
                            <div
                              key={`${layout.id}-${r.size}`}
                              className="perfLayoutRow"
                            >
                              <div className="perfGraphCell">
                                <div className="perfGraphSize">{r.size}</div>
                                <div className="perfGraphDetail">
                                  {r.detail}
                                </div>
                              </div>
                              <div className="perfNum perfNum--primary">
                                <span
                                  className={`perfPill ${
                                    compareMissing
                                      ? 'perfPill--missing'
                                      : 'perfPill--compare'
                                  }`}
                                >
                                  {formatMs(r.compareValue)}
                                </span>
                              </div>
                              <div className="perfNum">
                                <span
                                  className={`perfDelta perfDelta--${r.status}`}
                                >
                                  {label}
                                  {r.status === 'missing'
                                    ? ''
                                    : ` · ${deltaMsText}`}
                                  {r.baselineReliable === false ||
                                  r.compareReliable === false
                                    ? ' *'
                                    : ''}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="perfLayoutEmpty">
                          No data in this report.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="perfMuted perfFootnote">
        * reliable=false：采样方差较大（报告里标记为不稳定）
      </div>
    </div>
  );
}
