let chart = null;
let currentReport = null;
let REPORT_LIST = [];

const LAYOUT_STATUS = {
  'antv-dagre': { refactored: false },
  'combo-combined': { refactored: false },
  'd3-force-3d': { refactored: true },
  'd3-force': { refactored: true },
  'force-altas2': { refactored: false },
  circular: { refactored: true },
  concentric: { refactored: true },
  dagre: { refactored: true },
  force: { refactored: false },
  force2: { refactored: false },
  fruchterman: { refactored: true },
  grid: { refactored: true },
  mds: { refactored: true },
  radial: { refactored: true },
  random: { refactored: true },
};

function getLayoutStatus(algorithm) {
  const status = LAYOUT_STATUS[algorithm];
  if (!status) return null;
  return {
    ...status,
    className: status.refactored ? 'refactored' : 'not-refactored',
    color: status.refactored ? '#52c41a' : '#8c8c8c',
  };
}

init();

async function init() {
  // 自动获取 reports 目录下的所有文件
  await loadReportList();

  const select = document.getElementById('reportSelect');
  if (REPORT_LIST.length === 0) {
    select.innerHTML = '<option value="">无可用报告</option>';
    document.getElementById('deviceDetails').textContent = '未找到报告文件';
    return;
  }

  select.innerHTML = REPORT_LIST.map(
    (f) => `<option value="${f}">${f}</option>`,
  ).join('');
  select.addEventListener('change', () => loadReport(select.value));
  document.getElementById('metricSelect').addEventListener('change', render);
  loadReport(REPORT_LIST[0]);
}

async function loadReportList() {
  try {
    // 尝试获取目录列表 - 需要服务器支持
    const res = await fetch('./reports/');
    const text = await res.text();

    // 从 HTML 响应中提取 .json 文件
    const matches = text.matchAll(/href="([^"]+\.json)"/g);
    REPORT_LIST = Array.from(matches)
      .map((m) => m[1])
      .filter((f) => !f.includes('/'));

    // 按文件名排序（最新的在前）
    REPORT_LIST.sort().reverse();

    if (REPORT_LIST.length === 0) {
      throw new Error('未找到 JSON 文件');
    }
  } catch (e) {
    REPORT_LIST = [];
  }
}

async function loadReport(filename) {
  try {
    const res = await fetch(`./reports/${filename}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    currentReport = await res.json();
    render();
  } catch (e) {
    console.error('加载报告失败:', e);

    // 更新 UI 显示错误
    document.getElementById('deviceDetails').textContent =
      '加载失败，请使用本地服务器';
    document.getElementById('statsCards').innerHTML =
      '<p style="padding: 20px; color: #f5222d;">⚠️ 请使用本地 HTTP 服务器访问此页面</p>';
  }
}

function render() {
  updateDeviceInfo();
  // renderStatsCards();
  // renderChart();
  renderComparisons();
}

function updateDeviceInfo() {
  if (!currentReport?.device) return;
  const d = currentReport.device;
  document.getElementById('deviceDetails').textContent = `${d.cpu.brand} (${d.cpu.cores}核) | 内存 ${d.memory.total}MB | ${d.gpu.model} | ${d.os.distro}`;
}

function parseKey(full) {
  const match = full.match(/(.+?)\s*\((.*?):\s*(.*?)\)/);
  const name = match ? match[1].trim() : full;
  const parts = name.split('-');

  return {
    name: name,
    algorithm: parts[0] || 'unknown',
    library: parts[1] || 'unknown',
    version: parts[2] || 'unknown',
    implementation: parts[3] || 'unknown',
    size: match ? match[2] : 'unknown',
    detail: match ? match[3] : '',
  };
}

function getEntries() {
  const metric = document.getElementById('metricSelect').value;
  return Object.values(currentReport.reports)
    .map((r) => r.time?.[0])
    .filter(Boolean)
    .map((e) => ({ ...parseKey(e.key), value: e[metric] }));
}

function renderStatsCards() {
  if (!currentReport || !currentReport.reports) {
    document.getElementById('statsCards').innerHTML =
      '<p style="padding: 20px; color: #8c8c8c;">等待加载报告...</p>';
    return;
  }

  const entries = getEntries();

  if (!entries || entries.length === 0) {
    document.getElementById('statsCards').innerHTML =
      '<p style="padding: 20px; color: #8c8c8c;">报告中没有数据</p>';
    return;
  }

  // 计算统计数据
  const oldEntries = entries.filter(
    (e) =>
      e.version &&
      (e.version.includes('1.2.14') || e.version.includes('beta')),
  );
  const newEntries = entries.filter((e) => e.version === 'dev');

  if (oldEntries.length === 0 || newEntries.length === 0) {
    document.getElementById('statsCards').innerHTML =
      '<p style="padding: 20px; color: #8c8c8c;">没有可对比的数据（需要同时有旧版本和 dev 版本）</p>';
    return;
  }

  const avgOld =
    oldEntries.reduce((sum, e) => sum + (e.value || 0), 0) / oldEntries.length;
  const avgNew =
    newEntries.reduce((sum, e) => sum + (e.value || 0), 0) / newEntries.length;
  const avgImprovement = avgOld > 0 ? ((avgOld - avgNew) / avgOld) * 100 : 0;
  const avgSpeedup = avgNew > 0 ? avgOld / avgNew : 0;

  const maxOld = Math.max(...oldEntries.map((e) => e.value));
  const maxNew = Math.max(...newEntries.map((e) => e.value));
  const maxImprovement = ((maxOld - maxNew) / maxOld) * 100;

  const minOld = Math.min(...oldEntries.map((e) => e.value));
  const minNew = Math.min(...newEntries.map((e) => e.value));
  const minImprovement = ((minOld - minNew) / minOld) * 100;

  const html = `
    <div class="stat-card">
      <div class="label">平均性能提升</div>
      <div class="value">${avgImprovement.toFixed(1)}%</div>
      <div class="sub">↓ ${(avgOld - avgNew).toFixed(2)} ms</div>
    </div>
    <div class="stat-card">
      <div class="label">平均加速比</div>
      <div class="value">${avgSpeedup.toFixed(2)}x</div>
      <div class="sub">${avgOld.toFixed(1)} → ${avgNew.toFixed(1)} ms</div>
    </div>
    <div class="stat-card ${maxImprovement < 20 ? 'warning' : ''}">
      <div class="label">最大耗时优化</div>
      <div class="value">${maxImprovement.toFixed(1)}%</div>
      <div class="sub">↓ ${(maxOld - maxNew).toFixed(2)} ms</div>
    </div>
    <div class="stat-card">
      <div class="label">最小耗时优化</div>
      <div class="value">${minImprovement.toFixed(1)}%</div>
      <div class="sub">↓ ${(minOld - minNew).toFixed(2)} ms</div>
    </div>
  `;

  document.getElementById('statsCards').innerHTML = html;
}

function renderChart() {
  if (!currentReport || !currentReport.reports) {
    return;
  }

  const metric = document.getElementById('metricSelect').value;
  const entries = getEntries();

  if (!entries || entries.length === 0) {
    return;
  }

  const sizeOrder = ['tiny', 'small', 'medium', 'large', 'xlarge'];
  const sizes = [...new Set(entries.map((e) => e.size))].sort((a, b) => {
    const ai = sizeOrder.indexOf(a);
    const bi = sizeOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // 分组：旧版本 vs 新版本
  const oldVersions = [
    ...new Set(
      entries
        .filter(
          (e) => e.version.includes('1.2.14') || e.version.includes('beta'),
        )
        .map((e) => e.name),
    ),
  ];

  const newVersions = [
    ...new Set(entries.filter((e) => e.version === 'dev').map((e) => e.name)),
  ];

  const series = [];

  // 旧版本系列
  oldVersions.forEach((ver) => {
    series.push({
      name: ver + ' (旧)',
      type: 'line',
      data: sizes.map((size) => {
        const found = entries.find((e) => e.name === ver && e.size === size);
        return found ? found.value : null;
      }),
      lineStyle: { type: 'dashed', width: 2 },
      itemStyle: { color: '#ff7875' },
      symbol: 'circle',
      symbolSize: 6,
    });
  });

  // 新版本系列
  newVersions.forEach((ver) => {
    series.push({
      name: ver + ' (新)',
      type: 'line',
      data: sizes.map((size) => {
        const found = entries.find((e) => e.name === ver && e.size === size);
        return found ? found.value : null;
      }),
      lineStyle: { width: 3 },
      itemStyle: { color: '#52c41a' },
      symbol: 'circle',
      symbolSize: 8,
    });
  });

  if (!chart) chart = echarts.init(document.getElementById('mainChart'));

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ddd',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: function (params) {
        let html = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach((p) => {
          if (p.value !== null) {
            html += `${p.marker} ${p.seriesName}: <strong>${p.value.toFixed(
              2,
            )} ms</strong><br/>`;
          }
        });
        return html;
      },
    },
    legend: {
      data: series.map((s) => s.name),
      top: 0,
      type: 'scroll',
      textStyle: { fontSize: 12 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 50,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sizes.map((s) => {
        const e = entries.find((x) => x.size === s);
        return e ? `${s}\n${e.detail}` : s;
      }),
      axisLabel: {
        interval: 0,
        fontSize: 11,
        color: '#666',
      },
      axisLine: { lineStyle: { color: '#ddd' } },
    },
    yAxis: {
      type: 'value',
      name: '耗时 (ms)',
      nameTextStyle: { color: '#666', fontSize: 12 },
      axisLabel: { color: '#666' },
      axisLine: { lineStyle: { color: '#ddd' } },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: series,
  });
}

function renderComparisons() {
  if (!currentReport || !currentReport.reports) {
    document.getElementById('comparisonGrid').innerHTML =
      '<p style="padding: 20px; color: #8c8c8c;">等待加载报告...</p>';
    return;
  }

  const metric = document.getElementById('metricSelect').value;
  const items = getEntries();

  if (!items || items.length === 0) {
    document.getElementById('comparisonGrid').innerHTML =
      '<p style="padding: 20px; color: #8c8c8c;">报告中没有数据</p>';
    return;
  }

  const grouped = {};
  items.forEach((item) => {
    const key = `${item.algorithm}-${item.implementation}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  let html = '';

  for (const groupKey in grouped) {
    const group = grouped[groupKey];
    const hasOld = group.some(
      (g) => g.version.includes('1.2.14') || g.version.includes('beta'),
    );
    const hasNew = group.some((g) => g.version === 'dev');

    if (!hasOld || !hasNew) continue;

    const [algo, impl] = groupKey.split('-');

    // 获取布局状态
    const status = getLayoutStatus(algo);
    const statusTag = status
      ? `<span class="status-tag ${status.className}">${status.refactored ? '✅' : '🚧'
      }</span>`
      : '';

    const sizeOrder = ['tiny', 'small', 'medium', 'large', 'xlarge'];
    const sizes = [...new Set(group.map((g) => g.size))].sort((a, b) => {
      const ai = sizeOrder.indexOf(a);
      const bi = sizeOrder.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    html += `<div class="comparison-card">
      <h3>${algo} - ${impl.toUpperCase()}${statusTag}</h3>`;

    sizes.forEach((size) => {
      const sizeItems = group.filter((g) => g.size === size);
      const oldV = sizeItems.find(
        (g) => g.version.includes('1.2.14') || g.version.includes('beta'),
      );
      const newV = sizeItems.find((g) => g.version === 'dev');

      if (!oldV || !newV) return;

      const oldVal = oldV.value || 0;
      const newVal = newV.value || 0;
      const diff = oldVal - newVal;
      const percent = oldVal > 0 ? (diff / oldVal) * 100 : 0;
      const speed = newVal > 0 ? oldVal / newVal : 0;
      const isPositive = diff > 0;

      html += `
        <div class="comparison-item">
          <div class="comparison-label">
            <strong>${size}</strong> (${oldV.detail})
          </div>
          <div class="comparison-values">
            <span class="old-value">${(oldV.value || 0).toFixed(1)}</span>
            <span class="new-value">${(newV.value || 0).toFixed(1)} ms</span>
            <span class="improvement ${isPositive ? 'positive' : 'negative'}">
              ${isPositive ? '↓' : '↑'} ${Math.abs(percent).toFixed(1)}%
            </span>
            <span class="speedup-badge">${speed.toFixed(2)}x</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  document.getElementById('comparisonGrid').innerHTML =
    html || '<p>没有可对比的数据</p>';
}
