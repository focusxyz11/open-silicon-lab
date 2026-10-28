/* Lab: MEMORY CELL LAB */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function memCells(){
const cv=$('#mcCv');if(!cv)return;
let mode='dram';const S={T:60,ref:64,layers:286,bits:3,pe:0};
const box=$('#mcCtl');
const sl=(id,lab,min,max,step,val)=>'<div class="ctl"><label for="'+id+'">'+lab+' <output id="'+id+'O">–</output></label><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"></div>';
$('#mcMode').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.m;build();}));
const BITS=[[1,'SLC',100000],[2,'MLC',10000],[3,'TLC',3000],[4,'QLC',1000],[5,'PLC',300]];
function build(){$('#mcMode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===mode?'true':'false'));
 box.innerHTML=mode==='dram'?sl('mcT','Chip temperature',25,105,1,S.T)+'<div class="ctl"><span class="lbl">Refresh every</span><div class="seg" id="mcRef">'+[16,32,64,128,256].map(r=>'<button data-r="'+r+'">'+r+' ms</button>').join('')+'</div></div>'
  :sl('mcL','Word-line layers',24,480,2,S.layers)+'<div class="ctl"><span class="lbl">Bits stored per cell</span><div class="seg" id="mcB">'+BITS.map(b=>'<button data-b="'+b[0]+'">'+b[0]+' · '+b[1]+'</button>').join('')+'</div></div>'+sl('mcPe','Wear: program/erase cycles so far',0,1,0.01,S.pe);
 box.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>{S[{mcT:'T',mcL:'layers',mcPe:'pe'}[i.id]]=+i.value;calc();}));
 const r=$('#mcRef');if(r)r.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S.ref=+b.dataset.r;calc();}));
 const bb=$('#mcB');if(bb)bb.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S.bits=+b.dataset.b;calc();}));
 calc();}
let M={};
function calc(){const set=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t;};let rows;
 if(mode==='dram'){const ret=128*Math.pow(2,(85-S.T)/10);const ok=ret>S.ref;const busy=350e-9/(S.ref*1e-3/8192);M={ret,ok};
  set('mcTO',S.T+' °C');$('#mcRef').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.r===S.ref?'true':'false'));
  rows=[['Weakest cell holds data for',ret>=1000?(ret/1000).toFixed(1)+' s':Math.round(ret)+' ms'],['Data safe?',ok?'Yes':'No: bits flip'],['Time spent refreshing',(busy*100).toFixed(1)+'%'],['Charge per cell','≈ 30,000 electrons']];
  $('#mcTag').textContent='DRAM · 1 transistor, 1 capacitor';
  $('#mcText').innerHTML='<p>Each DRAM bit is a tiny capacitor behind a transistor switch: charged means 1, empty means 0. The capacitor is a deep, narrow trench or pillar that holds only about 30,000 electrons, and they leak away within milliseconds to seconds. So the chip must read and rewrite every row before the weakest cells fade: by the JEDEC standard, every 64 ms, or 32 ms above 85 °C. Leakage roughly doubles every 10 °C, which is one reason hot AI servers need careful cooling. While a bank refreshes it can\'t serve data, so refresh costs bandwidth.</p>';
  $('#mcNote').textContent='Model: the weakest cells are assumed to retain data for about 128 ms at 85 °C, doubling for every 10 °C cooler; a refresh command is taken to occupy a bank for 350 ns out of every 1/8,192 of the refresh period. Real retention varies cell by cell.';}
 else{const b=BITS[S.bits-1];const cap=1*(S.layers/286)*(S.bits/3);const life=b[2];const used=S.pe*life*1.4;const decks=Math.ceil(S.layers/170);const height=S.layers*45/1000;M={b,used,life};
  set('mcLO',S.layers+' layers');set('mcPeO',Math.round(used).toLocaleString('en-US')+' cycles');$('#mcB').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.b===S.bits?'true':'false'));
  rows=[['Capacity per die',cap>=1?cap.toFixed(1)+' Tb':Math.round(cap*1000)+' Gb'],['Voltage levels per cell',String(Math.pow(2,S.bits))],['Rated endurance','≈ '+life.toLocaleString('en-US')+' cycles'],['Stack height',height.toFixed(0)+' µm in '+decks+(decks>1?' decks':' deck')]];
  $('#mcTag').textContent='3D NAND · '+b[1];
  $('#mcText').innerHTML='<p>Flash memory stores bits as electrons trapped in an insulating layer around a vertical channel. To pack more, makers stack word-line layers like floors of a skyscraper and etch holes straight through them: Samsung\'s 286-layer chips have been shipping since 2024, and 300- to 400-layer parts arrive through 2026. Storing more bits per cell means telling apart more voltage levels. Each extra bit doubles the levels, so the gaps between them shrink, and as the cell wears out the distributions widen until neighbours overlap and errors appear. That is why QLC is cheap and dense but wears out sooner than TLC.</p>';
  $('#mcNote').textContent='Capacity is scaled from a 1 Tb TLC die at 286 layers; layer pitch is taken as about 45 nm; holes are etched in decks of up to roughly 170 layers. Endurance figures are typical ratings, not guarantees.';}
 $('#mcOut').innerHTML=rows.map(r=>'<div><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('');draw();}
function draw(){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);c.font='11px IBM Plex Mono, monospace';
 if(mode==='dram'){/* cell */const cw=Math.min(150,w*0.3);const cx=cw/2+6;c.strokeStyle=T.ink;c.lineWidth=2;
  c.beginPath();c.moveTo(cx,20);c.lineTo(cx,70);c.stroke();c.fillStyle=T.muted;c.textAlign='center';c.fillText('bit line',cx,14);
  c.strokeStyle=T.violet;c.lineWidth=3;c.beginPath();c.moveTo(cx-22,90);c.lineTo(cx+22,90);c.stroke();c.strokeStyle=T.ink;c.lineWidth=2;c.beginPath();c.moveTo(cx-16,82);c.lineTo(cx+16,82);c.moveTo(cx,70);c.lineTo(cx,82);c.moveTo(cx,96);c.lineTo(cx,120);c.stroke();
  c.beginPath();c.moveTo(cx-30,90);c.lineTo(cx-48,90);c.stroke();c.fillStyle=T.muted;c.textAlign='right';c.fillText('word',cx-30,110);c.fillText('line',cx-30,122);
  /* capacitor as trench */const ty=130,th=h-170;c.strokeStyle=T.muted;c.strokeRect(cx-16,ty,32,th);const lvl=M.ok?0.85:0.25;c.fillStyle=rgba(T.cyan,.6);c.fillRect(cx-15,ty+th*(1-lvl),30,th*lvl);c.fillStyle=T.ink;c.textAlign='center';c.fillText('capacitor',cx,h-24);
  /* timeline */const x0=cw+30,x1=w-10,y0=20,y1=h-40;if(x1-x0<80)return;const span=300;const X=t=>x0+t/span*(x1-x0),Y=v=>y1-v*(y1-y0);
  c.strokeStyle=T.line;c.lineWidth=1;c.beginPath();c.moveTo(x0,y1);c.lineTo(x1,y1);c.moveTo(x0,y0);c.lineTo(x0,y1);c.stroke();
  c.setLineDash([4,4]);c.strokeStyle=T.bad;c.beginPath();c.moveTo(x0,Y(0.5));c.lineTo(x1,Y(0.5));c.stroke();c.setLineDash([]);c.fillStyle=T.bad;c.textAlign='right';c.fillText('read as 0 below here',x1,Y(0.5)-5);
  const tau=M.ret/Math.LN2;c.strokeStyle=T.cyan;c.lineWidth=2;c.beginPath();let lost=null;for(let t=0;t<=span;t+=0.5){const since=t%S.ref;let v=Math.exp(-since/tau);if(lost===null&&v<0.5)lost=t;if(lost!==null&&t>=lost)v=Math.min(v,0.3);const y=Y(v);t?c.lineTo(X(t),y):c.moveTo(X(t),y);}c.stroke();
  c.fillStyle=T.muted;c.textAlign='center';for(let t=S.ref;t<span;t+=S.ref){c.fillText('↑',X(t),y1+12);}c.fillText('refresh',X(Math.min(S.ref,span-20)),y1+24);
  c.textAlign='left';c.fillText('stored charge, weakest cell',x0+4,y0-6);c.textAlign='right';c.fillText(span+' ms',x1,y1+12);
  if(lost!==null){c.fillStyle=T.bad;c.textAlign='left';c.font='600 12px IBM Plex Sans, sans-serif';c.fillText('Bit lost before refresh',X(lost)+6,Y(0.42));}}
 else{const sw=Math.min(170,w*0.32);/* stack */const n=Math.min(60,Math.round(S.layers/8));const sh=h-40,lh=sh/n;const sx=20;
  for(let i=0;i<n;i++){c.fillStyle=i%2?rgba(T.muted,.35):rgba(T.violet,.35);c.fillRect(sx,20+i*lh,sw-40,Math.max(1,lh-0.5));}
  const decks=Math.ceil(S.layers/170);c.fillStyle=T.bg;for(let k=0;k<decks;k++){const top=20+k*sh/decks,bot=20+(k+1)*sh/decks;c.beginPath();c.moveTo(sx+(sw-40)/2-9,top);c.lineTo(sx+(sw-40)/2+9,top);c.lineTo(sx+(sw-40)/2+5,bot);c.lineTo(sx+(sw-40)/2-5,bot);c.closePath();c.fill();c.strokeStyle=T.cyan;c.stroke();}
  c.fillStyle=T.muted;c.textAlign='left';c.fillText(S.layers+' layers',sx,14);c.fillText('channel hole',sx+(sw-40)/2+12,h-26);
  /* Vt distributions */const x0=sw+20,x1=w-10,y0=24,y1=h-34;if(x1-x0<80)return;const L=Math.pow(2,S.bits);const sig=(0.32/L)*(1+2.2*S.pe)*(S.bits>=4?1.15:1);
  c.strokeStyle=T.line;c.beginPath();c.moveTo(x0,y1);c.lineTo(x1,y1);c.stroke();c.fillStyle=T.muted;c.textAlign='center';c.fillText('threshold voltage of the cell →',(x0+x1)/2,y1+16);
  const X=v=>x0+v*(x1-x0);let overlap=0;
  for(let k=0;k<L;k++){const mu=(k+0.5)/L;c.strokeStyle=k%2?T.violet:T.cyan;c.lineWidth=1.8;c.beginPath();for(let v=0;v<=1;v+=0.003){const y=y1-(y1-y0)*Math.exp(-(v-mu)*(v-mu)/(2*sig*sig));v?c.lineTo(X(v),y):c.moveTo(X(v),y);}c.stroke();}
  const gap=1/L;const z=gap/2/sig;overlap=Math.exp(-z*z/2);
  c.fillStyle=overlap>0.05?T.bad:T.muted;c.textAlign='left';c.font='600 12px IBM Plex Sans, sans-serif';c.fillText(overlap>0.2?'Levels overlap: many read errors':overlap>0.05?'Levels close: error correction working hard':'Levels well separated',x0,14);}
}
watch(cv,draw);build();
})();
}
