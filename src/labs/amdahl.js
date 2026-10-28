/* Lab: AMDAHL */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function am(){
const R=$('#amP');const pOf=v=>1-Math.pow(10,-3*v/1000);const S=(p,N)=>1/((1-p)+p/N);
$('#amPre').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{R.value=b.dataset.v;upd();}));
R.addEventListener('input',upd);
function upd(){const p=pOf(+R.value);$('#amPO').textContent=(p*100).toFixed(p>=0.99?1:0)+'%';
 $('#am16').textContent=S(p,16).toFixed(1)+'×';$('#amG').textContent=big(S(p,1e4))+'×';$('#amMax').textContent=big(1/(1-p))+'×';
 $('#amTag').textContent=p<0.9?'Serial part dominates':p<0.99?'Many cores help, with a ceiling':'Massively parallel';
 $('#amTxt').textContent=p<0.9?'Most of the time goes to the part that can\'t be split. A few fast cores win, which is why CPUs keep big, clever cores with high clock speeds.':p<0.99?'More cores help, but the serial part caps the gain. Adding thousands of lanes barely beats adding dozens.':'Almost all the work is parallel, so thousands of simple lanes win by a mile. This is why AI training and inference run on GPUs and accelerators.';
 draw();}
function draw(){const {ctx:c,w,h}=fit($('#amCv'));c.clearRect(0,0,w,h);const p=pOf(+R.value);const L=48,Rr=64,Tp=16,B=38;
 const X=n=>L+(w-L-Rr)*Math.log10(n)/5,Y=s=>Tp+(h-Tp-B)*(1-Math.log10(s)/3);
 c.font='11px IBM Plex Mono, monospace';c.strokeStyle=rgba(T.muted,0.22);c.fillStyle=T.muted;c.lineWidth=1;
 ['1','10','100','1k','10k','100k'].forEach((t,e)=>{c.beginPath();c.moveTo(X(10**e),Tp);c.lineTo(X(10**e),h-B);c.stroke();c.fillText(t,X(10**e)-8,h-B+15);});
 ['1×','10×','100×','1000×'].forEach((t,e)=>{c.beginPath();c.moveTo(L,Y(10**e));c.lineTo(w-Rr,Y(10**e));c.stroke();c.fillText(t,6,Y(10**e)+4);});
 c.fillText('number of cores (log scale) →',L,h-6);c.fillText('speedup',L+4,Tp+10);
 const curve=(pp,col,lw)=>{c.strokeStyle=col;c.lineWidth=lw;c.beginPath();for(let e=0;e<=5.001;e+=0.02){const x=X(10**e),y=Y(S(pp,10**e));e?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();};
 [0.5,0.9,0.99,0.999].forEach(pp=>{curve(pp,rgba(T.muted,0.45),1.2);c.fillStyle=T.muted;c.fillText((pp*100)+'%',w-Rr+5,Y(S(pp,1e5))+4);});
 curve(p,T.amber,2.6);
 [[16,'16 CPU cores'],[1e4,'10k GPU lanes']].forEach(([n,t])=>{const x=X(n),y=Y(S(p,n));c.fillStyle=T.cyan;c.beginPath();c.arc(x,y,5,0,6.283);c.fill();c.fillStyle=T.ink;c.fillText(t,Math.min(x+8,w-Rr-90),y-9);});
}
watch($('#amCv'),draw);upd();
})();
}
