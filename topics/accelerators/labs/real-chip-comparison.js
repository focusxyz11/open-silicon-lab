/* Lab: REAL CHIP COMPARISON */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function rc(){
const RC=[['NVIDIA Rubin','GPU · 2H 2026',{pf:[50,'FP4'],cap:[288,'HBM4'],bw:[22,'HBM4']}],['AMD MI455X','GPU · 2026',{pf:[40.3,'MXFP4'],cap:[432,'HBM4'],bw:[23.3,'HBM4']}],['Microsoft Maia 200','Custom chip · 2026',{pf:[10,'FP4'],cap:[216,'HBM3E'],bw:[7,'HBM3E']}],['Google TPU v7 Ironwood','TPU · 2025',{pf:[4.6,'FP8'],cap:[192,'HBM'],bw:[7.4,'HBM']}],['AWS Trainium3','Custom chip · 2025',{pf:[2.52,'FP8'],cap:[144,'HBM3E'],bw:[4.9,'HBM3E']}],['Cerebras WSE-3 (CS-4)','Wafer-scale · 2026',{pf:[250,'sparse FP16, rack ÷ 3'],cap:[44,'on-wafer SRAM'],bw:[43200,'on-wafer SRAM']}],['NVIDIA Groq 3 LPU','SRAM dataflow · 2H 2026',{pf:null,cap:[0.5,'on-chip SRAM'],bw:[150,'up to; 22–150 quoted']}]];
const DOM={pf:[1,1000,'PFLOPS'],cap:[0.1,1000,'GB'],bw:[1,100000,'TB/s']};let k='pf';
$('#rcSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{k=b.dataset.k;show();}));
function show(){$('#rcSeg').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===k?'true':'false'));const [lo,hi,u]=DOM[k];
 $('#rcBars').innerHTML=RC.map(([n,t,d])=>{const v=d[k];const wd=v?Math.max(2,(Math.log10(v[0])-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*100):0;return '<div class="bar rc"><span>'+n+'<small>'+t+'</small></span><div class="track">'+(v?'<div class="fill'+(t.startsWith('GPU')?' hot':'')+'" style="width:'+wd.toFixed(1)+'%"></div><span class="val">'+(v[0]>=1000?v[0].toLocaleString('en-US'):v[0])+' '+u+' · '+v[1]+'</span>':'<span class="val">not published</span>')+'</div></div>';}).join('');}
show();
})();
}
