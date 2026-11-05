/* Lab: MEMORY BANDWIDTH PER GPU */
import {$} from 'osl/core/ui.js';
export function init(){
const BW=[['H100 · HBM3 · 2022',3.35],['H200 · HBM3E · 2024',4.8],['B200 · HBM3E · 2025',8],['Rubin · HBM4 · 2026',22]];
$('#bwBars').innerHTML=BW.map(([n,v],i)=>`<div class="bar"><span>${n}</span><div class="track"><div class="fill${i===3?' hot':''}" style="width:${v/25*100}%"></div><span class="val">${v} TB/s</span></div></div>`).join('');
}
