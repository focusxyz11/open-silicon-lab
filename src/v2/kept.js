/* What this browser keeps from one view for another to read: your switch, invented and kept at the switch level
   (src/v2/labs/switch.js), that a machine's block can be made of (src/v2/machines.js). A convenience of this browser:
   kept apart from the lab, so the reading pages that read it do not load the lab and its words. */
const KEEP_KEY = 'osl-switch-v1';
export const keptSwitch = () => { try { const o = JSON.parse(localStorage.getItem(KEEP_KEY) || 'null'); return o && typeof o.sw === 'string' ? o.sw : null; } catch (e) { return null; } };
export const keepSwitch = sw => { try { localStorage.setItem(KEEP_KEY, JSON.stringify({ sw })); return true; } catch (e) { return false; } };
