/* Lab: EUV SCANNER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function euv(){
const P=$('#euP'),Rf=$('#euR'),Nn=$('#euN'),D=$('#euD');let seed=1,tA=0,vis=false,S={};
[P,Rf,Nn].forEach(e=>e.addEventListener('input',calc));D.addEventListener('input',()=>{calc();expose();});
$('#euRe').addEventListener('click',()=>{seed++;expose();});
function calc(){const p=+P.value,r=+Rf.value,n=+Nn.value,d=+D.value;const pw=p*Math.pow(r,n);const tex=d/1000*700/pw;const wph=3600/(tex+12.6);const phnm=d*0.678;const hole=Math.PI*64*phnm;const abs=hole*0.2;
 $('#euPO').textContent=p+' W';$('#euRO').textContent=(r*100).toFixed(1)+'%';$('#euNO').textContent=n;$('#euDO').textContent=d+' mJ/cm²';
 $('#euW').textContent=pw.toFixed(1)+' W ('+(pw/p*100).toFixed(1)+'%)';$('#euH').textContent=Math.round(wph);$('#euPh').textContent=Math.round(hole).toLocaleString('en-US');$('#euNz').textContent='±'+(100/Math.sqrt(abs)).toFixed(1)+'%';$('#euAbs').textContent=(phnm*0.2).toFixed(1);
 $('#euTag').textContent=Math.round(wph)+' wafers per hour';S={p,r,n,d,pw};drawSch();}
function drawSch(){const {ctx:c,w,h}=fit($('#euCv'));c.clearRect(0,0,w,h);if(!S.p)return;c.font='11px IBM Plex Mono, monospace';
 const cy=h*0.52,px=Math.max(70,w*0.14);
 c.fillStyle=rgba(T.muted,0.12);c.fillRect(8,cy-78,px+44,156);c.fillStyle=T.muted;c.fillText('source vessel (vacuum)',14,cy-62);
 c.fillStyle=T.muted;c.fillRect(12,cy-6,18,12);
 c.fillStyle=T['amber-fill'];for(let k=0;k<8;k++){const x=30+((tA*140+k*((px-30)/8))%(px-30));c.beginPath();c.arc(x,cy,2.2,0,6.283);c.fill();}
 c.fillStyle=T.muted;c.fillText('tin droplets',14,cy+22);
 c.strokeStyle=T.bad;c.lineWidth=2;c.beginPath();c.moveTo(px,h-6);c.lineTo(px,cy+6);c.stroke();c.fillStyle=T.bad;c.fillText('CO₂ laser',px+6,h-12);
 const fl=0.5+0.5*Math.abs(Math.sin(tA*30));c.fillStyle=rgba(T.violet,0.3+0.5*fl);c.beginPath();c.arc(px,cy,8+3*fl,0,6.283);c.fill();
 c.strokeStyle=T.ink;c.lineWidth=3;c.beginPath();c.arc(px+6,cy,36,Math.PI*0.62,Math.PI*1.38);c.stroke();c.fillStyle=T.muted;c.fillText('collector',px-58,cy-40);
 const ifx=px+80;c.strokeStyle=rgba(T.violet,0.7);c.lineWidth=1.5;c.beginPath();c.moveTo(px-20,cy-30);c.lineTo(ifx,cy);c.lineTo(px-20,cy+30);c.stroke();
 c.fillStyle=T.ink;c.fillText(S.p+' W',ifx-14,cy-12);
 const n=S.n,x0=ifx+20,x1=w-60,pts=[[ifx,cy]];for(let k=0;k<n;k++){const x=x0+(x1-x0)*k/(n-1);pts.push([x,k%2?cy+64:cy-64]);}
 const mi=Math.floor(n/2)-((Math.floor(n/2))%2);const wx=w-26,wy=h-22;pts.push([wx,wy]);
 for(let k=0;k<pts.length-1;k++){const frac=Math.pow(S.r,k);c.strokeStyle=rgba(T.violet,0.25+0.6*frac);c.lineWidth=1+7*frac;c.beginPath();c.moveTo(pts[k][0],pts[k][1]);c.lineTo(pts[k+1][0],pts[k+1][1]);c.stroke();}
 for(let k=1;k<=n;k++){const [x,y]=pts[k];const up=y<cy;if(k-1===mi){c.fillStyle=T['amber-fill'];c.fillRect(x-16,up?y-10:y+2,32,8);c.fillStyle=T.ink;c.fillText('mask',x-14,up?y-14:y+24);}else{c.fillStyle=T.ink;c.fillRect(x-10,up?y-6:y+2,20,4);}}
 c.fillStyle=T.ink;c.fillText('mirrors',x0-4,cy-82);
 c.fillStyle=T.muted;c.fillRect(wx-18,wy+2,36,6);c.fillStyle=T.ink;c.textAlign='right';c.fillText('wafer: '+S.pw.toFixed(1)+' W',w-8,wy-12);c.textAlign='left';
}
function expose(){const cv=$('#euSt');const {ctx:c,w,h}=fit(cv);const G=96,d=+D.value;const lamOpen=d*0.678*0.2;const r=rng(seed*131+d*7);
 const cnt=new Float32Array(G*G);const cen=[16,48,80];
 for(let y=0;y<G;y++)for(let x=0;x<G;x++){const cx=cen[Math.min(2,Math.floor(x/32))],cyy=cen[Math.min(2,Math.floor(y/32))];const rr=Math.hypot(x+0.5-cx,y+0.5-cyy);const I=1/(1+Math.exp((rr-8)/1.2));const l=I*lamOpen;let k=0;if(l>30)k=Math.max(0,Math.round(l+Math.sqrt(l)*gauss(r)));else if(l>0){const Lx=Math.exp(-l);let pp=1;do{k++;pp*=r();}while(pp>Lx);k--;}cnt[y*G+x]=k;}
 const pr=new Uint8Array(G*G);const thr=0.5*lamOpen;const area=new Array(9).fill(0);
 for(let y=0;y<G;y++)for(let x=0;x<G;x++){let s=0,n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<G&&yy<G){s+=cnt[yy*G+xx];n++;}}if(s/n>thr){pr[y*G+x]=1;area[Math.min(2,Math.floor(y/32))*3+Math.min(2,Math.floor(x/32))]++;}}
 const off=document.createElement('canvas');off.width=G;off.height=G;const oc=off.getContext('2d');const im=oc.createImageData(G,G);const rc=hexRGB(T['amber-fill']),oc2=hexRGB(T.sunk);
 for(let i=0;i<G*G;i++){const col=pr[i]?oc2:rc;im.data[i*4]=col[0];im.data[i*4+1]=col[1];im.data[i*4+2]=col[2];im.data[i*4+3]=255;}
 oc.putImageData(im,0,0);c.clearRect(0,0,w,h);const s=Math.min(w,h)/G,ox=(w-G*s)/2,oy=(h-G*s)/2;c.imageSmoothingEnabled=false;c.drawImage(off,ox,oy,G*s,G*s);
 let bad=0;area.forEach((a,i)=>{const ok=a>=0.6*201&&a<=1.5*201;if(!ok)bad++;const cx=cen[i%3],cyy=cen[Math.floor(i/3)];c.strokeStyle=ok?rgba(T.ink,0.55):T.bad;c.lineWidth=ok?1:2.5;c.setLineDash(ok?[3,3]:[]);c.beginPath();c.arc(ox+cx*s,oy+cyy*s,8*s+(ok?0:4),0,6.283);c.stroke();});c.setLineDash([]);
 $('#euBad').textContent=bad+' of 9';
}
watch($('#euCv'),drawSch);watch($('#euSt'),expose);inView($('#euCv'),v=>vis=v);
function anim(){if(vis&&!RM){tA+=0.016;drawSch();}requestAnimationFrame(anim);}requestAnimationFrame(anim);
calc();expose();
})();
}
