/* Lab: SCHEDULE GANTT */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function gantt(){
const PH=[['Architecture & spec','people',[9,7,5]],['RTL design','ai',[12,9,6]],['Verification','ai',[15,10,6]],['Physical design & sign-off','ai',[7,5,3]],['Masks & OPC','ai',[1.5,1,0.75]],['Wafer fabrication','invent',[3.5,3.5,3.2]],['Packaging & test','capital',[2,2,1.5]],['Bring-up & qualification','people',[6,5,3.5]],['Volume ramp to racks','capital',[6,6,5]]];
const FAB=[36,30,26];let sc=1,cur=null,raf=0;
function plan(k){const d=PH.map(p=>p[2][k]);const st=[0];st[1]=0.6*d[0];st[2]=st[1]+0.25*d[1];const e=i=>st[i]+d[i];st[3]=Math.max(e(1),e(2)-0.5*d[3]);for(let i=4;i<9;i++)st[i]=e(i-1);return {st,d,fab:FAB[k]};}
$('#gtSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{sc=+b.dataset.s;out();if(!raf)step();}));
function step(){const t=plan(sc);let done=true;cur.st=cur.st.map((v,i)=>{const n=v+(t.st[i]-v)*(RM?1:0.15);if(Math.abs(n-t.st[i])>0.02)done=false;return Math.abs(n-t.st[i])<0.02?t.st[i]:n;});cur.d=cur.d.map((v,i)=>{const n=v+(t.d[i]-v)*(RM?1:0.15);if(Math.abs(n-t.d[i])>0.02)done=false;return Math.abs(n-t.d[i])<0.02?t.d[i]:n;});cur.fab+=(t.fab-cur.fab)*(RM?1:0.15);if(Math.abs(cur.fab-t.fab)<0.05)cur.fab=t.fab;else done=false;draw();raf=done?0:requestAnimationFrame(step);}
function out(){$('#gtSeg').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===sc?'true':'false'));const p=plan(sc);const e=i=>p.st[i]+p.d[i];const end=e(8);
 $('#gtFS').textContent=Math.round(e(5))+' months';$('#gtV').textContent=Math.round(end)+' months';$('#gtPh').textContent=Math.round((p.d[5]+p.d[6]+p.d[8])/end*100)+'%';$('#gtFab').textContent=p.fab+' months';}
function draw(){const {ctx:c,w,h}=fit($('#gtCv'));c.clearRect(0,0,w,h);const narrow=w<620;const LW=narrow?10:210,R=24,Tp=24,B=10;const rows=PH.length+1.6;const rh=(h-Tp-B)/rows;const M=48;const X=m=>LW+(w-LW-R)*m/M;
 c.font='11px IBM Plex Mono, monospace';c.strokeStyle=rgba(T.muted,0.2);c.fillStyle=T.muted;c.lineWidth=1;
 for(let m=0;m<=M;m+=6){c.beginPath();c.moveTo(X(m),Tp-4);c.lineTo(X(m),h-B);c.stroke();c.fillText(m===0?'0 months':String(m),X(m)-(m===0?0:6),14);}
 const bar=(i,st,d,lim,label,y,hatch)=>{const bh=narrow?rh*0.42:rh*0.62;const by=narrow?y+rh*0.5:y+(rh-bh)/2;c.fillStyle=rgba(T[LIMC[lim]],hatch?0.35:0.85);c.fillRect(X(st),by,Math.max(2,X(st+d)-X(st)),bh);
  if(hatch){c.strokeStyle=rgba(T[LIMC[lim]],0.9);c.strokeRect(X(st)+0.5,by+0.5,X(st+d)-X(st)-1,bh-1);}
  c.fillStyle=T.ink;c.font='12px IBM Plex Sans, sans-serif';if(narrow){c.fillText(label,X(0),y+rh*0.38);}else{c.textAlign='right';c.fillText(label,LW-10,by+bh/2+4);c.textAlign='left';}
  c.font='11px IBM Plex Mono, monospace';c.fillStyle=T.muted;const txt=(Math.round(d*10)/10)+' mo';const tx=X(st+d)+5;c.fillText(txt,Math.min(tx,w-40),by+bh/2+4);};
 PH.forEach((p,i)=>bar(i,cur.st[i],cur.d[i],p[1],p[0],Tp+i*rh,false));
 bar(9,0,cur.fab,'capital','New fab capacity (parallel)',Tp+(PH.length+0.6)*rh,true);
 const fs=cur.st[5]+cur.d[5],end=cur.st[8]+cur.d[8];c.setLineDash([3,4]);c.strokeStyle=T.ink;[[fs,'first silicon'],[end,'volume']].forEach(([m,t])=>{c.beginPath();c.moveTo(X(m),Tp);c.lineTo(X(m),Tp+PH.length*rh);c.stroke();});c.setLineDash([]);
}
cur=JSON.parse(JSON.stringify(plan(sc)));watch($('#gtCv'),draw);out();draw();
})();
}
