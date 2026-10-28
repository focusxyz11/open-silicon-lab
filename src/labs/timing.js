/* Lab: TIMING */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function tm(){
const G=[28,35,22,40,30,26,45,33,24,38,29,31],OV=40;let cuts=new Set(),corner=1,gaps=[];
const cv=$('#tmCv'),PR=$('#tmP');
function stages(){const st=[];let cur=0;G.forEach((d,i)=>{cur+=d*corner;if(cuts.has(i)&&i<G.length-1){st.push(cur+OV);cur=0;}});st.push(cur+OV);return st;}
function balance(n){let best=null;function rec(start,ch){if(ch.length===n){const s=new Set(ch);let cur=0,mx=0;G.forEach((d,i)=>{cur+=d;if(s.has(i)){mx=Math.max(mx,cur);cur=0;}});mx=Math.max(mx,cur);if(!best||mx<best.mx)best={mx,s};return;}for(let i=start;i<G.length-1;i++)rec(i+1,ch.concat(i));}rec(0,[]);return best.s;}
$('#tmCuts').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{cuts=balance(+b.dataset.n);upd();}));
$('#tmCorner').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{corner=+b.dataset.v;upd();}));
PR.addEventListener('input',upd);
cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;if(y>110)return;let best=null;gaps.forEach(g=>{const d=Math.abs(g.x-x);if(d<14&&(!best||d<best.d))best={d,i:g.i};});if(best){if(cuts.has(best.i))cuts.delete(best.i);else if(cuts.size<6)cuts.add(best.i);upd();}});
function upd(){const per=+PR.value,st=stages(),mx=Math.max(...st);
 $('#tmPO').textContent=per+' ps = '+(1000/per).toFixed(2)+' GHz';$('#tmF').textContent=(1000/mx).toFixed(2)+' GHz';$('#tmS').textContent=(per-mx>=0?'+':'')+Math.round(per-mx)+' ps';$('#tmL').textContent=st.length+' cycle'+(st.length>1?'s':'')+' = '+(st.length*per/1000).toFixed(2)+' ns';
 $('#tmStatus').innerHTML=per>=mx?'<span class="status ok">Meets timing</span>':'<span class="status bad">Fails timing</span>';
 $('#tmCuts').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.n===cuts.size?'true':'false'));
 $('#tmCorner').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===corner?'true':'false'));
 draw(per,st);}
function draw(per,st){per=per||+PR.value;st=st||stages();const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);
 const L=14,Rr=14,ffW=12,gapW=Math.max(10,Math.min(18,w/60));const tot=G.reduce((a,b)=>a+b,0);const sc=(w-L-Rr-2*ffW-gapW*(G.length+1))/tot;
 const y0=40,gh=40;c.font='11px IBM Plex Mono, monospace';c.textAlign='left';c.fillStyle=T.muted;c.fillText('Click a gap between gates to add or remove a pipeline register',L,18);
 c.strokeStyle=T.muted;c.lineWidth=1.5;c.beginPath();c.moveTo(L,y0+gh/2);c.lineTo(w-Rr,y0+gh/2);c.stroke();
 const ff=(x)=>{c.fillStyle=T.ink;c.fillRect(x,y0-8,ffW,gh+16);c.save();c.fillStyle=T.bg;c.font='9px IBM Plex Mono, monospace';c.translate(x+ffW/2+3,y0+gh/2+6);c.rotate(-Math.PI/2);c.fillText('FF',0,0);c.restore();};
 let x=L;ff(x);x+=ffW+gapW;gaps=[];let si=0;const mxs=st;
 G.forEach((d,i)=>{const wd=d*sc;const bad=mxs[si]>per;c.fillStyle=bad?rgba(T.bad,0.28):(si%2?rgba(T.violet,0.22):rgba(T['cyan-fill'],0.3));c.fillRect(x,y0,wd,gh);c.strokeStyle=bad?T.bad:T.line;c.lineWidth=1;c.strokeRect(x+0.5,y0+0.5,wd-1,gh-1);
  if(wd>22){c.fillStyle=T.ink;c.textAlign='center';c.fillText(Math.round(d*corner),x+wd/2,y0+gh/2+4);c.textAlign='left';}
  x+=wd;if(i<G.length-1){const gx=x+gapW/2;gaps.push({i,x:gx});if(cuts.has(i)){ff(gx-ffW/2);si++;}else{c.strokeStyle=rgba(T.amber,0.5);c.setLineDash([2,3]);c.beginPath();c.moveTo(gx,y0-6);c.lineTo(gx,y0+gh+6);c.stroke();c.setLineDash([]);}x+=gapW;}});
 x+=gapW-gapW;ff(w-Rr-ffW);
 const by=118,rowH=Math.min(26,(h-by-24)/Math.max(st.length,1));const lab=78;const tsc=(w-L-Rr-lab-60)/Math.max(per*1.15,Math.max(...st)*1.05);
 c.fillStyle=T.muted;c.fillText('Delay per pipeline stage (ps)',L,by-12);
 st.forEach((d,i)=>{const y=by+i*rowH;c.fillStyle=T.muted;c.fillText('Stage '+(i+1),L,y+rowH*0.62);c.fillStyle=d>per?T.bad:T['cyan-fill'];c.fillRect(L+lab,y+3,d*tsc,rowH-8);c.fillStyle=T.ink;c.fillText(Math.round(d)+' ps',L+lab+d*tsc+6,y+rowH*0.62);});
 const px=L+lab+per*tsc;c.strokeStyle=T.ink;c.setLineDash([4,4]);c.beginPath();c.moveTo(px,by-4);c.lineTo(px,by+st.length*rowH);c.stroke();c.setLineDash([]);c.fillStyle=T.ink;c.fillText('clock period',Math.min(px+4,w-100),by+st.length*rowH+14);
}
watch(cv,()=>draw());cuts=balance(0);upd();
})();
}
