/* Lab: DATAFLOW & WAFER-SCALE. Keep a model's weights in the tiles that use them, or fetch them from DRAM. */
import { $, T, fit, watch, rgba } from '../core/ui.js';
import { dataflowEnergy } from '../engines/paradigms.js';

const MB_PER_TILE = 2;
export function init() {
  const cv = $('#dfCv'); if (!cv) return;
  const lI = $('#dfL'), mI = $('#dfM'), tI = $('#dfT');
  [lI, mI, tI].forEach(el => el.addEventListener('input', draw));
  let S = null;
  const fmt = uj => uj >= 1000 ? (uj / 1000).toPrecision(3) + ' mJ' : uj.toPrecision(3) + ' µJ';
  function draw() {
    const layers = +lI.value, mb = +mI.value, tiles = +tI.value;
    $('#dfLO').textContent = layers; $('#dfMO').textContent = mb + ' MB'; $('#dfTO').textContent = tiles + ' (' + tiles * MB_PER_TILE + ' MB of SRAM)';
    const vn = dataflowEnergy({ layers, mbPerLayer: mb, tiles, mbPerTile: MB_PER_TILE, mode: 'vn' });
    const sp = dataflowEnergy({ layers, mbPerLayer: mb, tiles, mbPerTile: MB_PER_TILE, mode: 'spatial' });
    S = { layers, mb, tiles, fit: sp.fit };
    $('#dfFit').textContent = Math.round(sp.fit * 100) + '%'; $('#dfE1').textContent = fmt(vn.uj); $('#dfE2').textContent = fmt(sp.uj); $('#dfSave').textContent = (vn.uj / sp.uj).toFixed(1) + '× less energy';
    $('#dfTag').textContent = layers * mb + ' MB model on ' + tiles * MB_PER_TILE + ' MB of SRAM';
    $('#dfTxt').textContent = sp.fit >= 1 ? 'The whole model fits on chip: every weight is read from SRAM right beside its tile, about 58 times cheaper per bit than DRAM. This is why wafer-scale and SRAM inference chips are so fast for one user at a time.' : 'Only ' + Math.round(sp.fit * 100) + '% of the model fits. The rest must stream in from DRAM, and the advantage shrinks fast. Real systems split big models across many chips, or batch many users so each weight fetched is used many times.';
    paint();
  }
  function paint() {
    if (!S) return; const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const n = S.tiles, cols = Math.ceil(Math.sqrt(n * (w / h))), rows = Math.ceil(n / cols);
    const sz = Math.min((w - 20) / cols, (h - 30) / rows), ox = (w - cols * sz) / 2, oy = 6;
    const need = S.layers * S.mb, cap = n * MB_PER_TILE; const filled = Math.min(n, Math.ceil(need / MB_PER_TILE));
    for (let k = 0; k < n; k++) {
      const x = ox + (k % cols) * sz, y = oy + Math.floor(k / cols) * sz;
      const layer = Math.floor(k * MB_PER_TILE / S.mb);
      c.fillStyle = k < filled ? rgba(T.violet, 0.25 + 0.5 * ((layer % 4) / 4)) : rgba(T.muted, 0.12);
      c.fillRect(x + 1.5, y + 1.5, sz - 3, sz - 3);
    }
    c.font = '11px IBM Plex Sans, sans-serif'; c.fillStyle = T.muted; c.textAlign = 'left'; c.textBaseline = 'bottom';
    c.fillText(need > cap ? 'Tiles full: ' + (need - cap) + ' MB of weights left in DRAM' : 'Colored tiles hold the model; shade shows which layer', ox, h - 4);
  }
  watch(cv, paint);
  draw();
}
