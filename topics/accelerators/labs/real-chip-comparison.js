/* Lab: REAL CHIP COMPARISON */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
import {chips} from 'osl/data/chips.js';
export function init(){
(function rc(){
const RC=chips(['rubin','mi455x','maia200','ironwood','trainium3','cerebras','groq3']).map(c=>[c.n,c.kind+' · '+c.when,{pf:c.top&&c.top.slice(0,2),cap:[c.gb,c.mem],bw:[c.bw,c.bwNote||c.mem]}]);
const DOM={pf:[1,1000,'PFLOPS'],cap:[0.1,1000,'GB'],bw:[1,100000,'TB/s']};let k='pf';
$('#rcSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{k=b.dataset.k;show();}));
function show(){$('#rcSeg').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===k?'true':'false'));const [lo,hi,u]=DOM[k];
 $('#rcBars').innerHTML=RC.map(([n,t,d])=>{const v=d[k];const wd=v?Math.max(2,(Math.log10(v[0])-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*100):0;return '<div class="bar rc"><span>'+n+'<small>'+t+'</small></span><div class="track">'+(v?'<div class="fill'+(t.startsWith('GPU')?' hot':'')+'" style="width:'+wd.toFixed(1)+'%"></div><span class="val">'+(v[0]>=1000?v[0].toLocaleString('en-US'):v[0])+' '+u+' · '+v[1]+'</span>':'<span class="val">not published</span>')+'</div></div>';}).join('');}
show();
})();
}
