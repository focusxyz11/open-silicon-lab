/* Lab: MEMORY BANDWIDTH PER GPU */
import {$} from 'osl/core/ui.js';
import {chips} from 'osl/data/chips.js';
export function init(){
const BW=chips(['h100','h200','b200','rubin']).map(c=>[c.short+' · '+c.mem+' · '+c.when.slice(-4),c.bw]);
$('#bwBars').innerHTML=BW.map(([n,v],i)=>`<div class="bar"><span>${n}</span><div class="track"><div class="fill${i===3?' hot':''}" style="width:${v/25*100}%"></div><span class="val">${v} TB/s</span></div></div>`).join('');
}
