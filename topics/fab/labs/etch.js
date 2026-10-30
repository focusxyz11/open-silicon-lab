/* Lab: ETCH */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function etch(){
const GW=100,GH=90,MT=10,MB=16,OL=40,OR=60;let g=new Uint8Array(GW*GH),running=false,frames=0,traces=[],mask0=1;
const I=$('#etI'),Cc=$('#etC');
function reset(){for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)g[y*GW+x]=y<MT?0:y<MB?((x>=OL&&x<OR)?0:1):2;mask0=g.reduce((a,v)=>a+(v===1),0);frames=0;traces=[];running=false;btn();upd();}
function btn(){$('#etRun').textContent=running?'Pause':'Etch';}
const rnd=Math.random;
function shoot(ion,sig){let x=rnd()*GW,y=0;const th=ion?gauss(rnd)*sig:Math.asin(2*rnd()-1);let dx=Math.sin(th),dy=Math.cos(th);const tr=[[x,y]];let b=0;
 for(let s=0;s<700;s++){x+=dx*0.5;y+=dy*0.5;if(x<0||x>=GW||y>=GH||y<0)break;const i=(y|0)*GW+(x|0);const v=g[i];if(!v)continue;
  if(ion){if(v===2&&rnd()<0.6)g[i]=0;else if(v===1&&rnd()<0.015)g[i]=0;tr.push([x,y]);break;}
  if(v===2&&rnd()<0.05){g[i]=0;tr.push([x,y]);break;}
  if(b++>8)break;x-=dx*0.5;y-=dy*0.5;tr.push([x,y]);const a=rnd()*Math.PI*2;dx=Math.cos(a);dy=Math.sin(a);}
 tr.push([x,y]);return {ion,tr};}
function depth(){let md=MB-1;for(let x=OL-25;x<OR+25;x++){if(x<0||x>=GW)continue;for(let y=GH-1;y>=MB;y--)if(!g[y*GW+x]){if(y>md)md=y;break;}}return md-MB+1;}
function undercut(){let u=0;for(let y=MB;y<MB+3;y++){let k=0;for(let x=OL-1;x>=0&&!g[y*GW+x];x--)k++;let k2=0;for(let x=OR;x<GW&&!g[y*GW+x];x++)k2++;u=Math.max(u,k,k2);}return u;}
function frame(){const sig=(2+(100-+I.value)/100*38)*Math.PI/180,chem=+Cc.value/100;for(let k=0;k<350;k++){const ion=rnd()>=chem;const r=shoot(ion,sig);if(r.tr[r.tr.length-1][1]>MT&&rnd()<0.12){traces.push(r);if(traces.length>40)traces.shift();}}frames++;if(depth()>=GH-MB-1||frames>1200){running=false;btn();}}
function loop(){if(!running){upd();return;}frame();upd();requestAnimationFrame(loop);}
$('#etRun').addEventListener('click',()=>{running=!running;btn();if(running)loop();});$('#etReset').addEventListener('click',reset);
[I,Cc].forEach(e=>e.addEventListener('input',()=>{$('#etIO').textContent=(+I.value)+'% (cone ±'+Math.round(2+(100-+I.value)/100*38)+'°)';$('#etCO').textContent=Cc.value+'%';}));
function upd(){$('#etIO').textContent=(+I.value)+'% (cone ±'+Math.round(2+(100-+I.value)/100*38)+'°)';$('#etCO').textContent=Cc.value+'%';
 const dpt=depth()*2,uc=undercut()*2,ml=g.reduce((a,v)=>a+(v===1),0)/mask0;$('#etD').textContent=dpt+' nm';$('#etAR').textContent=(dpt/40).toFixed(1)+' : 1';$('#etU').textContent=uc+' nm';$('#etM').textContent=Math.round(ml*100)+'%';
 $('#etTag').innerHTML=running?'Etching…':uc>8?'<span class="status warn">Undercut</span>':dpt>0?'<span class="status ok">Straight walls</span>':'Ready';draw();}
function draw(){const cv=$('#etCv');const {ctx:c,w,h}=fit(cv);const off=document.createElement('canvas');off.width=GW;off.height=GH;const oc=off.getContext('2d');const im=oc.createImageData(GW,GH);const cs=[hexRGB(T.sunk),hexRGB('#B9C3CA'),hexRGB('#8FB0D6')];
 for(let i=0;i<GW*GH;i++){const col=cs[g[i]];im.data[i*4]=col[0];im.data[i*4+1]=col[1];im.data[i*4+2]=col[2];im.data[i*4+3]=255;}oc.putImageData(im,0,0);
 c.clearRect(0,0,w,h);c.imageSmoothingEnabled=false;c.drawImage(off,0,0,w,h);const sx=w/GW,sy=h/GH;
 traces.forEach(t=>{c.strokeStyle=t.ion?rgba(T.cyan,0.7):rgba(T.amber,0.6);c.lineWidth=1;c.beginPath();t.tr.forEach((p,i)=>i?c.lineTo(p[0]*sx,p[1]*sy):c.moveTo(p[0]*sx,p[1]*sy));c.stroke();});
 c.fillStyle=T.ink;c.font='11px IBM Plex Mono, monospace';c.fillText('mask',4,MT*sy+12);c.fillText('film',4,MB*sy+16);
}
watch($('#etCv'),draw);reset();
})();
}
