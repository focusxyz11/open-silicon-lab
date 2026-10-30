/* Lab: LITHOGRAPHY */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function litho(){
const SRC=[
 {n:'i-line',lam:365,na:0.6,min:0.35,max:0.65,yr:'1990s'},
 {n:'KrF',lam:248,na:0.8,min:0.5,max:0.93,yr:'late 1990s'},
 {n:'ArF dry',lam:193,na:0.93,min:0.6,max:0.93,yr:'2000s'},
 {n:'ArF immersion',lam:193,na:1.35,min:0.9,max:1.35,yr:'2007 →'},
 {n:'EUV',lam:13.5,na:0.33,fixed:true,yr:'2019 →'},
 {n:'High-NA EUV',lam:13.5,na:0.55,fixed:true,yr:'2026 →'},
 {n:'Hyper-NA (research)',lam:13.5,na:0.75,fixed:true,yr:'2030s?'}
];
let si=4,illum='dipole';
const seg=$('#lsSrc'),hpR=$('#lsHp'),naR=$('#lsNa'),doseR=$('#lsDose'),dpC=$('#lsDP');
SRC.forEach((s,i)=>{const b=document.createElement('button');b.innerHTML=s.n+' <span class="mono" style="opacity:.7">'+s.lam+'</span>';b.addEventListener('click',()=>{si=i;naR.min=s.fixed?s.na:s.min;naR.max=s.fixed?s.na:s.max;naR.value=s.na;naR.disabled=!!s.fixed;run();});seg.appendChild(b);});
$('#lsIllum').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{illum=b.dataset.v;run();}));
[hpR,naR,doseR,dpC].forEach(e=>e.addEventListener('input',run));
const hpOf=v=>5*Math.pow(40,v/1000);
function img(p,lam,NA,tilt,duty,x){
 const M=Math.ceil((NA+Math.abs(tilt))*p/lam)+1;let re=0,im=0;
 for(let m=-M;m<=M;m++){const f=tilt+m*lam/p;if(Math.abs(f)>NA+1e-9)continue;const cm=m===0?duty:Math.sin(Math.PI*m*duty)/(Math.PI*m);const ph=2*Math.PI*m*x/p;re+=cm*Math.cos(ph);im+=cm*Math.sin(ph);}
 return re*re+im*im;
}
function orders(p,lam,NA,tilt){const out=[];const M=Math.ceil((NA*1.9+Math.abs(tilt))*p/lam)+1;for(let m=-M;m<=M;m++){const f=tilt+m*lam/p;out.push([m,f,Math.abs(f)<=NA+1e-9]);}return out;}
let S={};
function run(){
 const s=SRC[si];const lam=s.lam,NA=+naR.value,hp=hpOf(+hpR.value),p=2*hp,dose=+doseR.value,dp=dpC.checked,thr=0.3;
 [...seg.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===si?'true':'false'));
 $('#lsIllum').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===illum?'true':'false'));
 const P=dp?2*p:p,duty=dp?0.25:0.5;
 const tilt=illum==='dipole'?Math.min(lam/(2*P),0.95*NA):0;
 const I=x=>{const v=tilt?(img(P,lam,NA,tilt,duty,x)+img(P,lam,NA,-tilt,duty,x))/2:img(P,lam,NA,0,duty,x);return v*dose;};
 // CD on exposure A around x=0
 const n=600;let mx=-1,mn=9,cd=0,allOn=true;
 for(let i=0;i<n;i++){const x=-P/2+P*i/n;const v=I(x);mx=Math.max(mx,v);mn=Math.min(mn,v);if(v>thr)cd+=P/n;else allOn=false;}
 const contrast=(mx-mn)/(mx+mn||1);const target=p/2;let err=Math.abs(cd-target)/target;
 let status='ok',msg='Prints';
 const merged=dp&&cd>=1.5*p;
 if(contrast<0.05||cd===0||allOn||merged){status='bad';msg='Fails: pattern lost';err=NaN;}
 else if(err>0.12||contrast<0.35){status='warn';msg='Marginal';}
 const st=$('#lsStatus');st.className='status '+status;st.textContent=msg;
 $('#lsHpO').textContent=hp.toFixed(hp<20?1:0)+' nm';$('#lsNaO').textContent=NA.toFixed(2)+(s.fixed?' (fixed by machine)':'');$('#lsDoseO').textContent=dose.toFixed(2)+'×';
 $('#lsL').textContent=lam+' nm';$('#lsP').textContent=p.toFixed(1)+' nm';$('#lsK').textContent=(hp*NA/lam).toFixed(3);
 $('#lsCD').textContent=isNaN(err)?'—':(err*100).toFixed(1)+'%';$('#lsC').textContent=(contrast*100).toFixed(0)+'%';$('#lsM').textContent=dp?'2 (cost ×2)':'1';
 S={lam,NA,hp,p,P,dp,tilt,I,thr,status};draw();drawPupil();
}
function draw(){
 const cv=$('#lsCv');const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);if(!S.I)return;
 const {p,P,dp,I,thr}=S;const x0=-2*p,x1=2*p;const L=12,Rr=12;const X=x=>L+(w-L-Rr)*(x-x0)/(x1-x0);
 c.font='11px IBM Plex Mono, monospace';
 // masks
 const drawMask=(y,hh,shift,period,openW,label)=>{c.fillStyle='#2B3138';c.fillRect(L,y,w-L-Rr,hh);c.fillStyle='#DDE6EC';for(let k=Math.floor((x0-shift)/period)-1;k<=Math.ceil((x1-shift)/period)+1;k++){const cx=k*period+shift;const a=Math.max(x0,cx-openW/2),b=Math.min(x1,cx+openW/2);if(b>a)c.fillRect(X(a),y,X(b)-X(a),hh);}c.fillStyle=T.muted;c.fillText(label,L,y-4);};
 if(dp){drawMask(18,12,0,P,p/2,'mask A');drawMask(46,12,p,P,p/2,'mask B');}else drawMask(18,26,0,p,p/2,'mask: open = light passes');
 // aerial
 const top=78,bot=h-96,ymax=1.5;const Y=v=>bot-(bot-top)*Math.min(v,ymax)/ymax;
 c.strokeStyle=rgba(T.muted,0.25);c.lineWidth=1;for(let v=0;v<=1.5;v+=0.5){c.beginPath();c.moveTo(L,Y(v));c.lineTo(w-Rr,Y(v));c.stroke();}
 c.fillStyle=T.muted;c.fillText('light intensity at wafer',L,top-6);
 const curve=(shift,col)=>{c.strokeStyle=col;c.lineWidth=2.2;c.beginPath();for(let i=0;i<=400;i++){const x=x0+(x1-x0)*i/400;const v=I(x-shift);i?c.lineTo(X(x),Y(v)):c.moveTo(X(x),Y(v));}c.stroke();};
 curve(0,T.amber);if(dp)curve(p,T.cyan);
 c.setLineDash([5,4]);c.strokeStyle=T.bad;c.lineWidth=1.2;c.beginPath();c.moveTo(L,Y(thr));c.lineTo(w-Rr,Y(thr));c.stroke();c.setLineDash([]);c.fillStyle=T.bad;c.fillText('resist threshold',w-Rr-110,Y(thr)-5);
 // resist profile
 const ry=h-70,rh=26;c.fillStyle='#6C7A86';c.fillRect(L,ry+rh,w-L-Rr,12);
 c.fillStyle='#E3A532';
 let i0=null;for(let i=0;i<=500;i++){const x=x0+(x1-x0)*i/500;let ex=I(x)>thr;if(dp)ex=ex||I(x-p)>thr;if(!ex&&i0===null)i0=x;if((ex||i===500)&&i0!==null){c.fillRect(X(i0),ry,X(x)-X(i0),rh);i0=null;}}
 c.strokeStyle=rgba(T.ink,0.7);c.setLineDash([3,3]);c.lineWidth=1;
 for(let k=-3;k<=3;k++){const cx=k*p;for(const e of [cx-p/4,cx+p/4]){if(e>x0&&e<x1){c.beginPath();c.moveTo(X(e),ry-6);c.lineTo(X(e),ry+rh);c.stroke();}}}
 c.setLineDash([]);c.fillStyle=T.muted;c.fillText('resist after develop (dashed = intended edges)',L,ry-10);
 c.fillText('pitch '+p.toFixed(1)+' nm',w-Rr-110,h-6);
}
function drawPupil(){
 const cv=$('#lsPupil');const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);if(!S.lam)return;
 const {lam,NA,P,tilt}=S;const cx=w/2,cy=h/2,Rp=Math.min(w,h)*0.3;const sc=Rp/NA;
 c.fillStyle=rgba(T['amber-fill'],0.10);c.strokeStyle=T.amber;c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,Rp,0,6.283);c.fill();c.stroke();
 c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('lens pupil (NA '+NA.toFixed(2)+')',8,16);c.fillText('diffraction orders',8,h-8);
 const rows=tilt?[[tilt,-14],[-tilt,14]]:[[0,0]];
 rows.forEach(([tl,dy])=>{
  if(tl){c.fillStyle=T.violet;c.beginPath();c.moveTo(cx+tl*sc,cy+dy-7);c.lineTo(cx+tl*sc-5,cy+dy-14);c.lineTo(cx+tl*sc+5,cy+dy-14);c.fill();}
  orders(P,lam,NA,tl).forEach(([m,f,inn])=>{const x=cx+f*sc;if(x<4||x>w-4)return;c.beginPath();c.arc(x,cy+dy,inn?6:5,0,6.283);if(inn){c.fillStyle=T.amber;c.fill();}else{c.strokeStyle=T.muted;c.lineWidth=1.5;c.stroke();}c.fillStyle=T.ink;if(Math.abs(m)<=2)c.fillText(String(m),x-4,cy+dy+(dy<0?-12:20));});
 });
 const caught=orders(P,lam,NA,tilt).filter(o=>o[2]).length;c.fillStyle=T.ink;c.fillText(caught+' order'+(caught>1?'s':'')+' caught'+(tilt?' per pole':''),8,32);
}
watch($('#lsCv'),draw);watch($('#lsPupil'),drawPupil);
naR.min=0.33;naR.max=0.33;naR.value=0.33;naR.disabled=true;
run();
})();
}
