/* Lab: ALD vs CVD */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function ald(){
const W0=40,NS=60;let mode='cvd',AR=6,running=false,top=0,side=new Float32Array(NS),bot=0,closed=false,time=0,cycles=0,phase=0;
const ARr=$('#adAR');
$('#adM').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.v;reset();}));
ARr.addEventListener('input',()=>{AR=+ARr.value;reset();});
$('#adReset').addEventListener('click',reset);
$('#adRun').addEventListener('click',()=>{if(top>=24)reset();running=!running;btn();if(running)loop();});
function btn(){$('#adRun').textContent=running?'Pause':(top>=24?'Deposit again':'Deposit');}
function reset(){running=false;top=0;side=new Float32Array(NS);bot=0;closed=false;time=0;cycles=0;phase=0;btn();upd();}
const Dd=()=>W0*AR;
function step(){const d=Dd();
 if(mode==='ald'){for(let k=0;k<2&&top<24;k++){top+=0.1;for(let i=0;i<NS;i++)side[i]=Math.min(W0/2,side[i]+0.1);bot=Math.min(d,bot+0.1);cycles++;time+=2;}phase=(phase+1)%4;}
 else{const r0=0.2;const open=W0-2*side[0];if(open<=0.6)closed=true;if(!closed){const o=Math.max(open,1);for(let i=0;i<NS;i++){const z=d*i/(NS-1);side[i]=Math.min(W0/2,side[i]+r0*Math.exp(-z/(1.1*o)));}bot+=r0*Math.exp(-d/(1.1*o));}top+=r0;time+=0.2;}
 if(top>=24){top=24;running=false;btn();}}
function loop(){if(!running){upd();return;}step();upd();requestAnimationFrame(loop);}
function upd(){[...$('#adM').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===mode?'true':'false'));$('#adARO').textContent=AR+' : 1 ('+Dd()+' nm deep)';
 $('#adTop').textContent=top.toFixed(1)+' nm';const cov=top>0?Math.min(1,Math.max(bot,side[NS-1])/top):1;$('#adSC').textContent=top>0?Math.round(cov*100)+'%':'–';
 $('#adT').textContent=mode==='ald'?Math.round(time)+' s ('+cycles+' cycles)':Math.round(time)+' s';
 const voided=mode==='cvd'&&closed&&2*side[NS-1]<W0-1;$('#adTag').innerHTML=voided?'<span class="status bad">Void trapped</span>':top>=20&&2*side[NS-1]>=W0-1?'<span class="status ok">Filled cleanly</span>':(mode==='ald'?'ALD: about 0.1 nm per cycle':'CVD: fast, uneven');
 draw();drawCyc();}
function draw(){const {ctx:c,w,h}=fit($('#adCv'));c.clearRect(0,0,w,h);const d=Dd(),sd=60,totW=W0+2*sd;const s=Math.min((w-20)/totW,(h-40)/(d+30));const ox=(w-totW*s)/2,ys=12+26*s;
 const X=n=>ox+n*s,Y=n=>ys+n*s;c.fillStyle='#7D8C99';c.fillRect(X(0),Y(0),totW*s,Math.min(h-Y(0),(d+12)*s));c.fillStyle=T.sunk;c.fillRect(X(sd),Y(0),W0*s,d*s);
 const fc=mode==='ald'?'#9C88FF':'#8FB0D6';c.fillStyle=fc;
 if(top>0){c.fillRect(X(0),Y(-top),sd*s,top*s);c.fillRect(X(sd+W0),Y(-top),sd*s,top*s);
  for(const dir of [1,-1]){const bx=dir>0?sd:sd+W0;c.beginPath();c.moveTo(X(bx),Y(-top));c.lineTo(X(bx+dir*side[0]),Y(-top));for(let i=0;i<NS;i++){const z=d*i/(NS-1);c.lineTo(X(bx+dir*side[i]),Y(z));}c.lineTo(X(bx),Y(d));c.closePath();c.fill();}
  c.fillRect(X(sd),Y(d-Math.min(bot,d)),W0*s,Math.min(bot,d)*s);}
 if(mode==='cvd'&&closed&&2*side[NS-1]<W0-1){c.strokeStyle=T.bad;c.setLineDash([4,3]);c.lineWidth=1.5;c.strokeRect(X(sd+side[NS-1]),Y(d*0.15),(W0-2*side[NS-1])*s,d*0.8*s);c.setLineDash([]);c.fillStyle=T.bad;c.font='12px IBM Plex Sans, sans-serif';c.fillText('void',X(sd+W0)+6,Y(d*0.5));}
 c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('40 nm',X(sd)+2,Y(0)-4-top*s);
}
function drawCyc(){const {ctx:c,w,h}=fit($('#adCyc'));c.clearRect(0,0,w,h);c.font='11px IBM Plex Mono, monospace';
 if(mode==='cvd'){c.fillStyle=T.muted;c.fillText('CVD: both gases react at once,',10,22);c.fillText('wherever they reach first.',10,38);const r=rng(3);for(let i=0;i<30;i++){c.fillStyle=i%2?T['amber-fill']:T.violet;c.beginPath();c.arc(10+r()*(w-20),50+r()*(h-70),3,0,6.283);c.fill();}c.fillStyle='#8FB0D6';c.fillRect(0,h-12,w,12);return;}
 const lab=['A pulse','purge','B pulse','purge'];const pw=w/4;
 for(let k=0;k<4;k++){const x0=k*pw;c.fillStyle=running&&k===phase?rgba(T['amber-fill'],0.18):'rgba(0,0,0,0)';c.fillRect(x0+2,0,pw-4,h);c.fillStyle=T.muted;c.fillText((k+1)+' '+lab[k],x0+6,14);
  c.fillStyle='#9C88FF';c.fillRect(x0+4,h-14,pw-8,10);
  const nsite=Math.max(3,Math.floor((pw-16)/12));for(let j=0;j<nsite;j++){const x=x0+10+j*12;if(k>=1){c.fillStyle=T['amber-fill'];c.beginPath();c.arc(x,h-20,4,0,6.283);c.fill();}if(k>=3){c.fillStyle=T.cyan;c.beginPath();c.arc(x,h-28,3,0,6.283);c.fill();}}
  if(k===0||k===2){c.fillStyle=k===0?T['amber-fill']:T.cyan;for(let j=0;j<4;j++){c.beginPath();c.arc(x0+14+j*(pw-28)/3,30+((j*13)%20),3.5,0,6.283);c.fill();}}
  if(k===1||k===3){c.strokeStyle=T.muted;c.lineWidth=1;c.beginPath();c.moveTo(x0+pw/2,h-40);c.lineTo(x0+pw/2,26);c.lineTo(x0+pw/2-4,32);c.moveTo(x0+pw/2,26);c.lineTo(x0+pw/2+4,32);c.stroke();}}
}
watch($('#adCv'),draw);watch($('#adCyc'),drawCyc);reset();
})();
}
