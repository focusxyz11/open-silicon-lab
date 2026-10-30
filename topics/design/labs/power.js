/* Lab: POWER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function pw(){
const Vt=0.3,K=3*0.75/Math.pow(0.45,1.3),C=45/(0.15*0.5625*3);
const fmax=V=>V<=Vt?0:K*Math.pow(V-Vt,1.3)/V,leak=V=>6*(V/0.75)*Math.exp((V-0.75)/0.25);
function vmin(f){let lo=0.31,hi=1.6;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(fmax(m)>=f)hi=m;else lo=m;}return Math.max(0.5,hi);}
const V=$('#pwV'),F=$('#pwF'),A=$('#pwA');[V,F,A].forEach(e=>e.addEventListener('input',upd));
$('#pwBest').addEventListener('click',()=>{V.value=Math.min(1.1,Math.ceil(vmin(+F.value)*100)/100);upd();});
const P=(a,v,f)=>a*C*v*v*f+leak(v);
function upd(){const v=+V.value,f=+F.value,a=+A.value;const Pd=a*C*v*v*f,Pl=leak(v),Pt=Pd+Pl,ok=f<=fmax(v)+1e-9;
 $('#pwVO').textContent=v.toFixed(2)+' V';$('#pwFO').textContent=f.toFixed(2)+' GHz';$('#pwAO').textContent=Math.round(a*100)+'%';
 $('#pwD').textContent=Pd.toFixed(1)+' W';$('#pwL').textContent=Pl.toFixed(1)+' W';$('#pwT').textContent=Pt.toFixed(1)+' W';$('#pwE').textContent=(Pt/f).toFixed(1)+' nJ';
 const need=vmin(f);$('#pwStatus').innerHTML=ok?'<span class="status ok">Runs, up to '+fmax(v).toFixed(2)+' GHz at '+v.toFixed(2)+' V</span>':'<span class="status bad">'+(need>1.1?'Beyond this chip\'s limit':'Fails timing: needs '+need.toFixed(2)+' V')+'</span>';
 draw(v,f,a,Pt,ok);}
function draw(v,f,a,Pt,ok){if(v===undefined){v=+V.value;f=+F.value;a=+A.value;Pt=P(a,v,f);ok=f<=fmax(v)+1e-9;}
 const {ctx:c,w,h}=fit($('#pwCv'));c.clearRect(0,0,w,h);const L=46,Rr=14,Tp=16,B=38;const fm=fmax(1.1);
 let ymax=Math.max(P(a,1.1,fm),Pt)*1.12;const X=x=>L+(w-L-Rr)*(x-0.5)/4,Y=y=>Tp+(h-Tp-B)*(1-y/ymax);
 c.font='11px IBM Plex Mono, monospace';c.strokeStyle=rgba(T.muted,0.22);c.fillStyle=T.muted;c.lineWidth=1;
 for(let x=1;x<=4.5;x+=1){c.beginPath();c.moveTo(X(x),Tp);c.lineTo(X(x),h-B);c.stroke();c.fillText(x+' GHz',X(x)-18,h-B+15);}
 const step=ymax>300?100:ymax>120?50:20;for(let y=0;y<=ymax;y+=step){c.beginPath();c.moveTo(L,Y(y));c.lineTo(w-Rr,Y(y));c.stroke();c.fillText(y+' W',4,Y(y)+4);}
 c.fillStyle=rgba(T.muted,0.12);c.fillRect(X(fm),Tp,w-Rr-X(fm),h-Tp-B);c.fillStyle=T.muted;c.fillText('needs > 1.1 V',X(fm)+4,Tp+12);
 c.fillStyle=rgba(T['amber-fill'],0.16);c.beginPath();c.moveTo(X(0.5),Y(0));for(let x=0.5;x<=fm;x+=0.02)c.lineTo(X(x),Y(P(a,vmin(x),x)));c.lineTo(X(fm),Y(0));c.closePath();c.fill();
 c.strokeStyle=T.amber;c.lineWidth=2.4;c.beginPath();for(let x=0.5;x<=fm;x+=0.02){const y=Y(P(a,vmin(x),x));x===0.5?c.moveTo(X(x),y):c.lineTo(X(x),y);}c.stroke();
 const fv=Math.min(4.5,fmax(v));c.strokeStyle=rgba(T.ink,0.5);c.setLineDash([4,4]);c.lineWidth=1.2;c.beginPath();c.moveTo(X(0.5),Y(P(a,v,0.5)));c.lineTo(X(Math.max(0.5,fv)),Y(P(a,v,Math.max(0.5,fv))));c.stroke();c.setLineDash([]);
 c.fillStyle=T.ink;c.fillText('lowest safe voltage at each speed',L+8,Tp+12);c.fillStyle=T.muted;c.fillText('dashed: fixed '+v.toFixed(2)+' V',L+8,Tp+26);
 c.fillStyle=ok?T.cyan:T.bad;c.beginPath();c.arc(X(f),Y(Pt),6,0,6.283);c.fill();
 c.fillStyle=T.muted;c.fillText('clock frequency →',w-Rr-120,h-6);
}
watch($('#pwCv'),()=>draw());upd();
})();
}
