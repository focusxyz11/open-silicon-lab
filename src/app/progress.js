/* Progress that other views show without loading the lab itself. The RISC-V lab saves its stars
   in this browser; the Workshop and Challenges views read them from here. */
const RISCV_KEY = 'osl-riscv-v1', LEVELS = [1, 2, 3, 4, 5, 6, 7];
function riscvSaved() {
  try { const j = JSON.parse(localStorage.getItem(RISCV_KEY) || localStorage.getItem('osq-v1') || 'null'); return j && j.stars && typeof j.stars === 'object' ? j.stars : {}; } catch (e) { return {}; }
}
export const levelStars = id => Math.max(0, Math.min(3, +riscvSaved()[id] || 0));
export const riscvStars = () => LEVELS.reduce((t, id) => t + levelStars(id), 0);
