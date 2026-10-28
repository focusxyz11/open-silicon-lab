/* Lab: ENERGY PER TOKEN */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function energy(){
const cv=$('#enCv');if(!cv)return;
const I={w:$('#enW'),t:$('#enTok'),o:$('#enOv'),p:$('#enPue')};
const COL=()=>[T.violet,T['cyan-fill'],T['amber-fill']];
function run(){const W=+I.w.value,tok=Math.pow(10,+I.t.value),ov=+I.o.value/100,pue=+I.p.value;
 const it=W*(1+ov),fac=it*pue;const J=fac/tok;const wh=J*1000/3600;const gpus=1e9/fac;const perDay=gpus*tok*86400;
 $('#enWO').textContent=(W/1000).toFixed(2)+' kW';$('#enTokO').textContent=Math.round(tok).toLocaleString('en-US');$('#enOvO').textContent='+'+Math.round(ov*100)+'%';$('#enPueO').textContent=pue.toFixed(2);
 const parts=[W,W*ov,it*(pue-1)];const col=COL();const NM=['Accelerator','Rest of server & network','Cooling & power losses'];
 $('#enStack').innerHTML=parts.map((x,i)=>'<i style="width:'+(x/fac*100).toFixed(1)+'%;background:'+col[i]+'"></i>').join('');
 $('#enLeg').innerHTML=parts.map((x,i)=>'<span><i style="background:'+col[i]+'"></i>'+NM[i]+' '+Math.round(x/fac*100)+'%</span>').join('');
 $('#enJ').textContent=J>=1?J.toFixed(2)+' J':(J*1000).toFixed(0)+' mJ';$('#enWh').textContent=wh>=1?wh.toFixed(2)+' Wh':(wh*1000).toFixed(0)+' mWh';
 const big=v=>v>=1e15?(v/1e15).toFixed(1)+' quadrillion':v>=1e12?(v/1e12).toFixed(1)+' trillion':(v/1e9).toFixed(1)+' billion';
 $('#enDay').textContent=big(perDay)+' tokens a day';$('#enYr').textContent='8.8 TWh ≈ '+Math.round(8.76e9/10500/1000)+'k US homes';
 $('#enTag').textContent=Math.round(gpus).toLocaleString('en-US')+' accelerators per gigawatt';
 const phone=wh/15;
 $('#enTxt').textContent='One 1,000-token answer uses about '+(wh>=1?wh.toFixed(2)+' watt-hours':(wh*1000).toFixed(0)+' milliwatt-hours')+', about '+(phone*100<0.1?'0.1':(phone*100).toFixed(phone*100<10?1:0))+'% of a full phone battery. Small per answer, but a 1 GW campus serving at this rate produces '+big(perDay)+' tokens a day and draws as much power as a large city. The biggest lever is tokens per second: better chips, smaller number formats and serving many users per chip all raise it.';
 draw(J);}
function draw(Jc){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);const W=+I.w.value,ov=+I.o.value/100,pue=+I.p.value;
 const L=52,R=10,Tp=10,B=30;const X=v=>L+(v-2)/(4.7-2)*(w-L-R);const lo=-2,hi=2;const Y=j=>Tp+(1-(Math.log10(j)-lo)/(hi-lo))*(h-Tp-B);
 c.strokeStyle=T.line;c.font='11px IBM Plex Mono, monospace';c.fillStyle=T.muted;c.textAlign='right';[0.01,0.1,1,10,100].forEach(j=>{c.beginPath();c.moveTo(L,Y(j));c.lineTo(w-R,Y(j));c.stroke();c.fillText(j>=1?j+' J':j*1000+' mJ',L-6,Y(j)+4);});
 c.textAlign='center';[100,1000,10000].forEach(t=>c.fillText(t.toLocaleString('en-US'),X(Math.log10(t)),h-16));c.fillText('tokens per second per accelerator',(L+w-R)/2,h-2);
 c.strokeStyle=T.violet;c.lineWidth=2.5;c.beginPath();for(let v=2;v<=4.7;v+=0.02){const j=W*(1+ov)*pue/Math.pow(10,v);const y=Y(clamp(j,0.01,100));v===2?c.moveTo(X(v),y):c.lineTo(X(v),y);}c.stroke();
 const tv=+I.t.value,jj=W*(1+ov)*pue/Math.pow(10,tv);c.fillStyle=T['amber-fill'];c.beginPath();c.arc(X(tv),Y(clamp(jj,0.01,100)),6,0,7);c.fill();}
Object.values(I).forEach(e=>e.addEventListener('input',run));watch(cv,run);run();
})();
}
