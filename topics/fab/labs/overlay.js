/* Lab: OVERLAY */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function ov(){
function erfc(x){const z=Math.abs(x),t=1/(1+0.5*z);const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?r:2-r;}
const X=$('#ovX'),S=$('#ovS');const Z=(()=>{const r=rng(9);return Array.from({length:40},()=>gauss(r));})();
[X,S].forEach(e=>e.addEventListener('input',upd));
const pf=(mu,s)=>{const k=Math.SQRT2*s;return 0.5*erfc((4.2-mu)/k)+0.5*erfc((4.2+mu)/k);};
function upd(){const mu=+X.value,s=+S.value,p=pf(mu,s),f=p*1e10;
 $('#ovXO').textContent=(mu>=0?'+':'')+mu.toFixed(1)+' nm';$('#ovSO').textContent=s.toFixed(2)+' nm';
 $('#ovP').textContent=p<1e-15?'< 1 in 10¹⁵':'1 in '+big(1/p);$('#ovF').textContent=f>=1?big(f):f<1e-4?'< 0.0001':f.toPrecision(2);
 $('#ovTxt').textContent=f>=1?'Nearly every chip would have broken connections, so yield would be close to zero. Total overlay error must stay within a couple of nanometres.':f>=0.05?'Several percent of chips would fail from overlay alone. Still too risky.':'Fewer than 1 chip in 20 affected. This is the level of control a leading fab needs.';
 $('#ovTag').innerHTML=f>=1?'<span class="status bad">Chips fail</span>':f>=0.05?'<span class="status warn">Marginal</span>':'<span class="status ok">Within budget</span>';draw();}
function draw(){const {ctx:c,w,h}=fit($('#ovCv'));c.clearRect(0,0,w,h);const mu=+X.value,s=+S.value;const view=178,sc=w/view,ox=5*sc;const rows=Math.max(3,Math.floor((h/sc-20)/40));
 for(let k=0;k<6;k++){const cx=14+k*28;c.fillStyle='rgba(196,122,68,0.75)';c.fillRect(ox+(cx-7)*sc,0,14*sc,h);}
 let i=0;for(let k=0;k<6;k++)for(let r=0;r<rows;r++){const cx=14+k*28,cy=24+r*40;const e=mu+s*Z[i%Z.length];i++;const bad=Math.abs(e)>4.2;
  c.strokeStyle=rgba(T.ink,0.5);c.setLineDash([2,2]);c.strokeRect(ox+(cx-7)*sc,(cy-7)*sc,14*sc,14*sc);c.setLineDash([]);
  c.fillStyle=bad?rgba(T.bad,0.85):rgba(T.good,0.8);c.fillRect(ox+(cx-7+e)*sc,(cy-7)*sc,14*sc,14*sc);}
 c.fillStyle=T.ink;c.font='11px IBM Plex Mono, monospace';c.fillRect(8,h-14,28*sc,3);c.fillText('28 nm',12+28*sc,h-9);
}
watch($('#ovCv'),draw);upd();
})();
}
