/* Lab: PREFILL vs DECODE */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function pd(){
const CHP=[['Rubin',25,288,22],['MI455X',20.1,432,23.3],['Maia 200',5,216,7],['TPU Ironwood',4.6,192,7.4],['Trainium3',2.52,144,4.9]];let ci=0,P=70;
const seg=$('#pdChip');CHP.forEach((c0,i)=>{const b=document.createElement('button');b.textContent=c0[0];b.addEventListener('click',()=>{ci=i;run();});seg.appendChild(b);});
$('#pdModel').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{P=+b.dataset.p;run();}));['#pdIn','#pdOutL'].forEach(s=>$(s).addEventListener('input',run));
const Lin=v=>Math.round(100*Math.pow(1280,v/1000)),Lout=v=>Math.round(10*Math.pow(400,v/1000));
const ft=s=>s<1?Math.round(s*1000)+' ms':s<60?s.toFixed(s<10?2:1)+' s':(s/60).toFixed(1)+' min';
let S={};
function run(){const [nm,F,cap,bw]=CHP[ci];[...seg.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===ci?'true':'false'));$('#pdModel').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.p===P?'true':'false'));
 const Li=Lin(+$('#pdIn').value),Lo=Lout(+$('#pdOutL').value);$('#pdInO').textContent=Li.toLocaleString('en-US')+' tokens';$('#pdOutO').textContent=Lo.toLocaleString('en-US')+' tokens';
 const G=Math.max(1,Math.ceil(P*1.2/cap));const Fe=G*F*1e15*0.5,BW=G*bw*1e12;
 const tp=2*P*1e9*Li/Fe,td1=Math.max(P*1e9/BW,2*P*1e9/Fe),td=Lo*td1;
 $('#pdG').textContent=G;$('#pdTT').textContent=ft(tp);$('#pdSp').textContent=Math.round(1/td1).toLocaleString('en-US')+' tok/s';$('#pdTot').textContent=ft(tp+td);
 $('#pdTag').textContent=tp>td?'Prefill dominates (compute-bound)':'Decode dominates (bandwidth-bound)';S={tp,td,Li,Lo};draw();}
function draw(){if(S.tp===undefined)return;const {ctx:c,w,h}=fit($('#pdCv'));c.clearRect(0,0,w,h);const tot=S.tp+S.td,L=12,R=12,y=70,bh=46;const X=t=>L+(w-L-R)*t/tot;
 c.fillStyle=T['amber-fill'];c.fillRect(X(0),y,Math.max(2,X(S.tp)-X(0)),bh);c.fillStyle=T['cyan-fill'];c.fillRect(X(S.tp),y,Math.max(2,X(tot)-X(S.tp)),bh);
 c.font='12px IBM Plex Sans, sans-serif';c.fillStyle=T.ink;c.fillText('Prefill: read '+S.Li.toLocaleString('en-US')+' prompt tokens in parallel',L,y-26);c.fillStyle=T.amber;c.fillText(ft(S.tp)+' · compute-bound',L,y-10);
 c.fillStyle=T.ink;c.textAlign='right';c.fillText('Decode: write '+S.Lo.toLocaleString('en-US')+' tokens one by one',w-R,y+bh+22);c.fillStyle=T.cyan;c.fillText(ft(S.td)+' · bandwidth-bound',w-R,y+bh+38);c.textAlign='left';
 c.strokeStyle=T.ink;c.setLineDash([3,3]);c.beginPath();c.moveTo(X(S.tp),y-4);c.lineTo(X(S.tp),y+bh+4);c.stroke();c.setLineDash([]);c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('first token',Math.min(X(S.tp)+4,w-80),y+bh+12);}
watch($('#pdCv'),draw);run();
})();
}
