/* Lab: TRANSISTOR */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function tr(){
const A=[
 {id:'planar',name:'Planar',years:'1960s – early 2010s',ss:95,drive:1,sides:'1 side (top)',status:'History',txt:'The channel is a flat strip on the wafer surface and the gate sits on top. Below about 20 nm the drain starts to pull current through the channel even when the gate is off, so leakage power exploded.'},
 {id:'fin',name:'FinFET',years:'2011 – 2025',ss:72,drive:1.7,sides:'3 sides',status:'Mainstream',txt:'The channel stands up as a thin fin and the gate drapes over three sides. Intel shipped it at 22 nm in 2011 and it carried the industry through 3 nm. Most chips in use today are FinFETs.'},
 {id:'gaa',name:'GAA nanosheet',years:'2022 / 2025 →',ss:66,drive:2.3,sides:'All 4 sides',status:'Leading edge now',txt:'The channel is split into stacked horizontal sheets and the gate wraps completely around each one. Samsung was first (3 nm, 2022). TSMC N2 began volume production in Q4 2025 and Intel 18A calls its version RibbonFET. Sheet width can be tuned per cell for speed or power.'},
 {id:'cfet',name:'CFET',years:'≈ 2033+ (imec projection)',ss:64,drive:3.6,sides:'All 4, n over p',status:'Research',txt:'Complementary FET stacks the n-type and p-type transistors directly on top of each other, roughly halving the footprint of a logic cell. imec expects it from about the A7 node, and treats backside power delivery as a prerequisite. TSMC has shown a working CFET circuit with about 1,000 transistors.'},
 {id:'2d',name:'2D channel',years:'≈ 2040s (imec projection)',ss:62,drive:3.0,sides:'All 4, atom-thin',status:'Research',txt:'Silicon sheets stop working well below a few nm. Two-dimensional semiconductors such as MoS₂ or WS₂ are less than 1 nm thick yet still conduct well, letting the gate keep control at even smaller sizes. Depositing and doping them at scale is still unsolved.'}
];
let cur=2;const seg=$('#trSeg');
A.forEach((a,i)=>{const b=document.createElement('button');b.textContent=a.name;b.addEventListener('click',()=>{cur=i;upd();});seg.appendChild(b);});
const Vt=0.3,VDD=0.75;
function I(a,v){const m=a.ss/1000/Math.LN10;const x=(v-Vt)/m;const ln=x>30?x:Math.log1p(Math.exp(x));return a.drive*m*ln;}
const vg=$('#trVg');let tAnim=0;
function upd(){
 const a=A[cur];[...seg.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===cur?'true':'false'));
 $('#trYears').textContent=a.years+' · '+a.status;$('#trSides').textContent=a.sides;$('#trSS').textContent=a.ss+' mV/decade';
 const r=I(a,VDD)/I(a,0);$('#trRatio').textContent='10^'+Math.log10(r).toFixed(1);$('#trDrive').textContent=a.drive.toFixed(1)+'× planar';
 $('#trText').innerHTML='<p>'+a.txt+'</p>';$('#trVgO').textContent=(+vg.value).toFixed(2)+' V';
 drawIV();drawX();
}
vg.addEventListener('input',upd);
function drawIV(){
 const {ctx:c,w,h}=fit($('#ivCv'));c.clearRect(0,0,w,h);
 const L=48,Rr=14,Tp=18,B=40;const X=v=>L+(w-L-Rr)*v/0.8;const lo=-6,hi=1.5;const Y=l=>Tp+(h-Tp-B)*(hi-l)/(hi-lo);
 c.font='11px IBM Plex Mono, monospace';c.fillStyle=T.muted;c.strokeStyle=rgba(T.muted,0.25);c.lineWidth=1;
 for(let l=-6;l<=1;l++){c.beginPath();c.moveTo(L,Y(l));c.lineTo(w-Rr,Y(l));c.stroke();c.fillText('1e'+l,6,Y(l)+4);}
 for(let v=0;v<=0.8;v+=0.2){c.beginPath();c.moveTo(X(v),Tp);c.lineTo(X(v),h-B);c.stroke();c.fillText(v.toFixed(1),X(v)-9,h-B+16);}
 c.fillText('gate voltage (V)',w/2-50,h-6);c.save();c.translate(12,Tp+4);c.fillText('drain current (log)',4,-4);c.restore();
 A.forEach((a,k)=>{if(k===cur)return;c.strokeStyle=rgba(T.muted,0.45);c.lineWidth=1.2;c.beginPath();for(let v=0;v<=0.8;v+=0.005){const y=Y(Math.log10(I(a,v)));v?c.lineTo(X(v),y):c.moveTo(X(v),y);}c.stroke();});
 const a=A[cur];c.strokeStyle=T.amber;c.lineWidth=2.5;c.beginPath();for(let v=0;v<=0.8;v+=0.005){const y=Y(Math.log10(I(a,v)));v?c.lineTo(X(v),y):c.moveTo(X(v),y);}c.stroke();
 c.setLineDash([4,4]);c.strokeStyle=rgba(T.ink,0.5);c.beginPath();c.moveTo(X(Vt),Tp);c.lineTo(X(Vt),h-B);c.stroke();c.setLineDash([]);c.fillStyle=T.muted;c.fillText('threshold',X(Vt)+4,Tp+10);
 const v=+vg.value;c.fillStyle=T.amber;c.beginPath();c.arc(X(v),Y(Math.log10(I(a,v))),5,0,6.283);c.fill();
 c.fillStyle=T.ink;c.fillText('off leakage',X(0)+6,Y(Math.log10(I(a,0)))-8);
}
function drawX(){
 const {ctx:c,w,h}=fit($('#trCv'));c.clearRect(0,0,w,h);
 const a=A[cur],v=+vg.value;const on=clamp((Math.log10(I(a,v))+6)/7.2,0,1);
 const cx=w/2,base=h-50,s=Math.min(w/320,h/260);
 const SI='#8E9CA8',GATE='#C99234',OX='#8F7CF0',chan=`rgb(${Math.round(142-100*on)},${Math.round(156+42*on)},${Math.round(168+42*on)})`;
 c.fillStyle='#6C7A86';c.fillRect(cx-140*s,base,280*s,40*s);
 c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('silicon substrate',cx-136*s,base+18*s+6);
 const sheet=(x,y,ww,hh,col)=>{c.fillStyle=OX;c.fillRect(x-4*s,y-4*s,ww+8*s,hh+8*s);c.fillStyle=col;c.fillRect(x,y,ww,hh);};
 const dots=(x,y,ww,hh)=>{const n=Math.round(on*14);c.fillStyle='#4CC6D2';for(let i=0;i<n;i++){const px=x+((i*37+tAnim*60*(0.5+on))%ww),py=y+hh*(((i*53)%97)/97);c.beginPath();c.arc(px,py,2,0,6.283);c.fill();}};
 if(a.id==='planar'){c.fillStyle=GATE;c.fillRect(cx-70*s,base-70*s,140*s,62*s);c.fillStyle=OX;c.fillRect(cx-70*s,base-8*s,140*s,8*s);c.fillStyle=chan;c.fillRect(cx-90*s,base,180*s,14*s);dots(cx-90*s,base,180*s,14*s);
  label(c,'gate',cx,base-40*s);label(c,'channel at surface',cx,base+30*s,true);}
 else if(a.id==='fin'){c.fillStyle=GATE;c.beginPath();c.moveTo(cx-90*s,base);c.lineTo(cx-90*s,base-150*s);c.lineTo(cx+90*s,base-150*s);c.lineTo(cx+90*s,base);c.closePath();c.fill();
  c.fillStyle=OX;c.fillRect(cx-22*s,base-128*s,44*s,128*s);c.fillStyle=chan;c.fillRect(cx-16*s,base-122*s,32*s,122*s);dots(cx-16*s,base-122*s,32*s,122*s);label(c,'gate wraps 3 sides',cx,base-160*s);}
 else if(a.id==='gaa'||a.id==='2d'){c.fillStyle=GATE;c.fillRect(cx-100*s,base-170*s,200*s,170*s);const th=a.id==='2d'?5*s:18*s;
  for(let k=0;k<3;k++){const y=base-40*s-k*50*s;sheet(cx-70*s,y-th/2,140*s,th,chan);dots(cx-70*s,y-th/2,140*s,th);}
  label(c,a.id==='2d'?'atom-thin 2D sheets':'3 nanosheets, gate all around',cx,base-180*s);}
 else if(a.id==='cfet'){c.fillStyle=GATE;c.fillRect(cx-100*s,base-200*s,200*s,200*s);
  for(let k=0;k<4;k++){const y=base-30*s-k*44*s-(k>1?20*s:0);const col=k<2?chan:`rgb(${Math.round(170+60*on)},${Math.round(150+40*on)},${Math.round(120-40*on)})`;sheet(cx-70*s,y-7*s,140*s,14*s,col);dots(cx-70*s,y-7*s,140*s,14*s);}
  c.fillStyle='#55626D';c.fillRect(cx-100*s,base-112*s,200*s,10*s);
  label(c,'p-type sheets (top)',cx,base-210*s);label(c,'n-type sheets (bottom)',cx,base+30*s,true);}
 c.fillStyle=T.muted;c.textAlign='left';c.fillText('looking down the channel',8,16);
 c.fillText(on>0.55?'switch ON: current flows':'switch OFF: only leakage',8,32);
}
function label(c,t,x,y,below){c.fillStyle=T.ink;c.font='12px IBM Plex Sans, sans-serif';c.textAlign='center';c.fillText(t,x,y);c.textAlign='left';}
watch($('#ivCv'),drawIV);watch($('#trCv'),drawX);
let vis=false;inView($('#trCv'),v=>{vis=v;});
function anim(){if(vis&&!RM){tAnim+=0.016;drawX();}requestAnimationFrame(anim);}requestAnimationFrame(anim);
upd();
})();
}
