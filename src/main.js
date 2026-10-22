import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './style.css';

// ===== Paleta CVP =====
const CVP = { rojo: '#be1e2d', marron: '#a85a28', ambar: '#ffbd47', dorado: '#d9a404', grisNo: '#8a9099' };
const BASE = import.meta.env.BASE_URL;
const $ = (id) => document.getElementById(id);
const nf = (n) => n.toLocaleString('es-CO');

// ===== Mapa =====
const map = L.map('map', { preferCanvas: true }).setView([4.57, -74.12], 11);
const osmStd = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · CVP Reasentamientos',
}).addTo(map);
const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 20, subdomains: 'abc',
  attribution: '&copy; OpenStreetMap · Humanitarian OSM Team · CVP Reasentamientos',
});

const cluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 48, disableClusteringAtZoom: 18 });
map.addLayer(cluster);

// ===== Estado =====
let ITEMS = []; // { marker, p }
const F = { cvp: 'all', Localidad: '__all__', UPL: '__all__', Barrio: '__all__', Zona: '__all__', Estrato: '__all__', q: '' };
let dimActual = 'Localidad';

// ===== Popup =====
function popup(p) {
  const si = p.es_cvp === 1;
  const badge = si ? '<span class="badge si">SÍ — PREDIO CVP</span>' : '<span class="badge no">No identificado</span>';
  let reas = '';
  if (si) {
    reas = `
      <div class="popup-row"><span class="k">Identificado por:</span> ${p.match_por || '—'}</div>
      <div class="popup-row"><span class="k">Estado proceso:</span> ${p.R_EstadoProceso || '—'}</div>
      <div class="popup-row"><span class="k">ID Reasentamiento:</span> ${p.R_Identificador || '—'}</div>`;
  }
  return `
    <div class="popup-title">Cuenta ${p.Cuenta_Contrato ?? '—'} &nbsp;${badge}</div>
    <div class="popup-row"><span class="k">Dirección:</span> ${p.Direccion || '—'}</div>
    <div class="popup-row"><span class="k">CHIP (SAP):</span> ${p.CHIP_SAP || '—'}</div>
    <div class="popup-row"><span class="k">Localidad:</span> ${p.Localidad || '—'} &nbsp;·&nbsp; <span class="k">Zona:</span> ${p.Zona ?? '—'}</div>
    <div class="popup-row"><span class="k">UPL:</span> ${p.UPL || '—'} (${p.UPL_codigo || '—'})</div>
    <div class="popup-row"><span class="k">Barrio:</span> ${p.Barrio || '—'}</div>
    <div class="popup-row"><span class="k">Estrato:</span> ${p.Estrato ?? '—'} &nbsp;·&nbsp; <span class="k">Facturable:</span> ${p.FACTURABLE || '—'}</div>
    ${reas}`;
}

// ===== Carga =====
fetch(`${BASE}data/predios.geojson`)
  .then((r) => r.json())
  .then((gj) => {
    gj.features.forEach((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const p = f.properties;
      const si = p.es_cvp === 1;
      const marker = L.circleMarker([lat, lng], {
        radius: si ? 5 : 4,
        color: '#fff', weight: 1,
        fillColor: si ? CVP.rojo : CVP.grisNo,
        fillOpacity: si ? 0.95 : 0.7,
      }).bindPopup(() => popup(p));
      ITEMS.push({ marker, p });
    });
    poblarSelect('Localidad', 'f-localidad');
    poblarSelect('UPL', 'f-upl');
    poblarSelect('Barrio', 'f-barrio');
    poblarSelect('Zona', 'f-zona', true);
    poblarSelect('Estrato', 'f-estrato', true);
    conectarControles();
    legend.addTo(map);
    aplicar(true);
  })
  .catch((e) => { console.error(e); $('stats').innerHTML = '<b>Error</b> al cargar los datos'; });

// ===== Selects =====
function poblarSelect(campo, id, numerico) {
  const vals = [...new Set(ITEMS.map((it) => it.p[campo]).filter((v) => v !== null && v !== undefined && v !== ''))];
  vals.sort((a, b) => (numerico ? a - b : String(a).localeCompare(String(b), 'es')));
  const sel = $(id);
  for (const v of vals) {
    const o = document.createElement('option');
    o.value = String(v); o.textContent = v;
    sel.appendChild(o);
  }
}

// ===== Filtro =====
function pasa(p) {
  if (F.cvp !== 'all' && String(p.es_cvp) !== F.cvp) return false;
  if (F.Localidad !== '__all__' && String(p.Localidad) !== F.Localidad) return false;
  if (F.UPL !== '__all__' && String(p.UPL) !== F.UPL) return false;
  if (F.Barrio !== '__all__' && String(p.Barrio) !== F.Barrio) return false;
  if (F.Zona !== '__all__' && String(p.Zona) !== F.Zona) return false;
  if (F.Estrato !== '__all__' && String(p.Estrato) !== F.Estrato) return false;
  if (F.q) {
    const q = F.q.toLowerCase();
    const hay = `${p.Cuenta_Contrato} ${p.Direccion || ''} ${p.CHIP_SAP || ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function aplicar(fit) {
  const vis = ITEMS.filter((it) => pasa(it.p));
  cluster.clearLayers();
  cluster.addLayers(vis.map((it) => it.marker));
  renderKPIs(vis);
  renderBreakdown(vis);
  const nCvp = vis.filter((it) => it.p.es_cvp === 1).length;
  $('stats').innerHTML = `<b>${nf(vis.length)}</b> predios visibles · <b>${nf(nCvp)}</b> CVP`;
  if (fit && vis.length) {
    const g = L.featureGroup(vis.map((it) => it.marker));
    if (g.getBounds().isValid()) map.fitBounds(g.getBounds(), { padding: [30, 30], maxZoom: 16 });
  }
}

// ===== KPIs =====
function renderKPIs(vis) {
  const tot = vis.length;
  const cvp = vis.filter((it) => it.p.es_cvp === 1).length;
  const no = tot - cvp;
  const pct = tot ? Math.round((1000 * cvp) / tot) / 10 : 0;
  $('kpis').innerHTML = `
    <div class="kpi tot"><div class="v">${nf(tot)}</div><div class="l">Predios</div></div>
    <div class="kpi cvp"><div class="v">${nf(cvp)}</div><div class="l">Propiedad CVP</div></div>
    <div class="kpi no"><div class="v">${nf(no)}</div><div class="l">No identificados</div></div>
    <div class="kpi pct"><div class="v">${pct}%</div><div class="l">% CVP</div></div>`;
}

// ===== Desglose por territorio =====
function renderBreakdown(vis) {
  const campo = dimActual;
  const map2 = new Map();
  for (const it of vis) {
    const k = it.p[campo] ?? '(sin dato)';
    const o = map2.get(k) || { n: 0, cvp: 0 };
    o.n++; if (it.p.es_cvp === 1) o.cvp++;
    map2.set(k, o);
  }
  const rows = [...map2.entries()].sort((a, b) => b[1].n - a[1].n);
  const max = rows.length ? rows[0][1].n : 1;
  const selVal = F[campo];
  const html = rows.map(([k, o]) => {
    const wCvp = (100 * o.cvp) / max;
    const wNo = (100 * (o.n - o.cvp)) / max;
    const sel = selVal !== '__all__' && String(k) === String(selVal) ? ' sel' : '';
    return `<div class="bd-row${sel}" data-k="${String(k).replace(/"/g, '&quot;')}">
      <div class="bd-head"><span class="bd-name" title="${k}">${k}</span><span class="bd-count">${nf(o.n)}</span></div>
      <div class="bd-bar"><div class="cvp" style="width:${wCvp}%"></div><div class="no" style="width:${wNo}%"></div></div>
      <div class="bd-sub">${nf(o.cvp)} CVP · ${nf(o.n - o.cvp)} no identif.</div>
    </div>`;
  }).join('');
  const bd = $('breakdown');
  bd.innerHTML = html || '<p class="note">Sin registros para el filtro actual.</p>';
  // solo las dimensiones filtrables por select directo
  if (['Localidad', 'UPL', 'Barrio', 'Zona'].includes(campo)) {
    bd.querySelectorAll('.bd-row').forEach((el) => {
      el.addEventListener('click', () => {
        const k = el.getAttribute('data-k');
        if (k === '(sin dato)') return;
        F[campo] = F[campo] === k ? '__all__' : k;
        syncSelect(campo);
        aplicar(true);
      });
    });
  }
}

function syncSelect(campo) {
  const id = { Localidad: 'f-localidad', UPL: 'f-upl', Barrio: 'f-barrio', Zona: 'f-zona' }[campo];
  if (id) $(id).value = F[campo];
}

// ===== Controles =====
function conectarControles() {
  // segmented propiedad
  $('seg-cvp').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      $('seg-cvp').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      F.cvp = b.getAttribute('data-v');
      aplicar(false);
    });
  });
  // selects
  const bind = (id, campo) => $(id).addEventListener('change', (e) => { F[campo] = e.target.value; aplicar(true); });
  bind('f-localidad', 'Localidad');
  bind('f-upl', 'UPL');
  bind('f-barrio', 'Barrio');
  bind('f-zona', 'Zona');
  bind('f-estrato', 'Estrato');
  // busqueda
  let t;
  $('f-buscar').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { F.q = e.target.value.trim(); aplicar(false); }, 250);
  });
  // tabs desglose
  $('tabs').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      $('tabs').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      dimActual = b.getAttribute('data-dim');
      renderBreakdown(ITEMS.filter((it) => pasa(it.p)));
    });
  });
  // reset
  $('reset').addEventListener('click', () => {
    Object.assign(F, { cvp: 'all', Localidad: '__all__', UPL: '__all__', Barrio: '__all__', Zona: '__all__', Estrato: '__all__', q: '' });
    ['f-localidad', 'f-upl', 'f-barrio', 'f-zona', 'f-estrato'].forEach((id) => ($(id).value = '__all__'));
    $('f-buscar').value = '';
    $('seg-cvp').querySelectorAll('button').forEach((x, i) => x.classList.toggle('on', i === 0));
    aplicar(true);
  });
  // control de capas base
  L.control.layers({ OpenStreetMap: osmStd, 'OSM Humanitario': osmHOT }, {}, { collapsed: true }).addTo(map);
  // menu movil
  const btn = document.createElement('button');
  btn.id = 'menu-toggle'; btn.type = 'button'; btn.innerHTML = '☰'; btn.title = 'Filtros';
  btn.addEventListener('click', () => $('sidebar').classList.toggle('open'));
  document.querySelector('.brand').before(btn);
}

// ===== Leyenda =====
const legend = L.control({ position: 'bottomright' });
legend.onAdd = () => {
  const d = L.DomUtil.create('div', 'legend');
  d.innerHTML = `
    <div><span class="dot" style="background:${CVP.rojo}"></span> Predio CVP (identificado)</div>
    <div><span class="dot" style="background:${CVP.grisNo}"></span> No identificado</div>`;
  return d;
};
