/* Lab: rack to atom */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
import { t as tx } from '../core/i18n.js';
export function init(){
(function zoom(){
const cv=$('#zoomCv');
/* The nine levels; their names and descriptions are zoom.<n>.name / .d in src/i18n. */
const L=[
 {n:1,size:2.4,T:[0,0],get name(){return tx('zoom.1.name');},get d(){return tx('zoom.1.d');}},
 {n:2,size:0.6,T:[0,0],get name(){return tx('zoom.2.name');},get d(){return tx('zoom.2.d');}},
 {n:3,size:0.12,T:[0.22,0],get name(){return tx('zoom.3.name');},get d(){return tx('zoom.3.d');}},
 {n:4,size:0.04,T:[0.07,-0.38],get name(){return tx('zoom.4.name');},get d(){return tx('zoom.4.d');}},
 {n:5,size:0.0028,T:[-0.3,-0.65],get name(){return tx('zoom.5.name');},get d(){return tx('zoom.5.d');}},
 {n:6,size:20e-6,T:[0,0.01],get name(){return tx('zoom.6.name');},get d(){return tx('zoom.6.d');}},
 {n:7,size:1e-6,T:[0,0.085],get name(){return tx('zoom.7.name');},get d(){return tx('zoom.7.d');}},
 {n:8,size:60e-9,T:[0,0],get name(){return tx('zoom.8.name');},get d(){return tx('zoom.8.d');}},
 {n:9,size:3e-9,T:null,get name(){return tx('zoom.9.name');},get d(){return tx('zoom.9.d');}}
];
const N=L.length;
// precomputed geometry
const R1=rng(11),R5=rng(55),R4=rng(44),R6=rng(66),R2=rng(22);
const traces=new Path2D();
for(let i=0;i<140;i++){const x=-0.9+R1()*1.8,y=-0.55+R1()*1.1;const hz=R1()<0.5;const l=0.05+R1()*0.3;traces.moveTo(x,y);if(hz)traces.lineTo(Math.min(0.9,x+l),y);else traces.lineTo(x,Math.min(0.55,y+l));}
const caps=[];for(let i=0;i<70;i++){const side=Math.floor(R2()*4);let x,y;const t=-0.85+R2()*1.7;if(side===0){x=t;y=-0.8+R2()*0.18}else if(side===1){x=t;y=0.62+R2()*0.18}else if(side===2){x=-0.92+R2()*0.12;y=t*0.9}else{x=0.8+R2()*0.12;y=t*0.9}caps.push([x,y]);}
// SM logic texture
const smTex=new Path2D();
for(let qx of [-1,1])for(let qy of [-1,1]){const x0=Math.min(qx*0.5,qx*0.08),x1=Math.max(qx*0.5,qx*0.08),y0=Math.min(qy*0.92,qy*0.4),y1=Math.max(qy*0.92,qy*0.4);for(let y=y0;y<y1-0.008;y+=0.014){let x=x0;while(x<x1){const w=0.004+R4()*0.02;if(R4()<0.8)smTex.rect(x,y,Math.min(w,x1-x)-0.002,0.011);x+=w;}}}
// rows texture (scene 5)
const rowA=new Path2D(),rowB=new Path2D(),m1=new Path2D(),m2=new Path2D(),rails=new Path2D();
for(let k=0;k<120;k++){const y=-1.2+k*0.02;rails.rect(-1.2,y-0.0012,2.4,0.0024);let x=-1.2,alt=false;while(x<1.2){const w=0.006+R5()*0.03;(alt?rowA:rowB).rect(x+0.0008,y+0.0025,w-0.0016,0.015);alt=!alt;x+=w;}}
for(let i=0;i<220;i++){const x=-1.1+R5()*2.2,y=-1.1+R5()*2.2,l=0.04+R5()*0.35;m1.moveTo(x,y);m1.lineTo(x,Math.min(1.1,y+l));}
for(let i=0;i<220;i++){const x=-1.1+R5()*2.2,y=-1.1+R5()*2.2,l=0.04+R5()*0.4;m2.moveTo(x,y);m2.lineTo(Math.min(1.1,x+l),y);}
// scene 6 M0 segments
const m0=[];for(let i=0;i<40;i++){const row=Math.floor(R6()*5)-2;const yc=row*0.4;const tr=[-0.03,0.03,-0.155,0.155][Math.floor(R6()*4)];const x=-1+R6()*1.6;m0.push([x,yc+tr,0.1+R6()*0.5]);}
const contacts=[];for(let k=-11;k<11;k++)for(let row=-2;row<=2;row++){if(R6()<0.55)contacts.push([(k+0.5)*0.096,row*0.4+(R6()<0.5?-1:1)*0.085]);}

function sRack(c,px){
 c.fillStyle='#0B161D';c.fillRect(-5,-5,10,10);
 c.fillStyle='#0F1C24';c.fillRect(-5,0.965,10,4);
 for(const ox of [-0.72,0,0.72]){
  c.globalAlpha=ox===0?1:0.5;
  c.fillStyle='#19242B';c.fillRect(ox-0.29,-0.97,0.58,1.94);
  c.fillStyle='#2D6F8C';c.fillRect(ox-0.285,-0.95,0.012,1.9);c.fillRect(ox+0.273,-0.95,0.012,1.9);
  for(let j=-9;j<=9;j++){
   const yc=j*0.0975,sw=Math.abs(j)>=5&&Math.abs(j)<=6;
   c.fillStyle=sw?'#1E2B33':'#27363F';c.fillRect(ox-0.25,yc-0.04,0.5,0.08);
   c.fillStyle='#16222A';for(let v=0;v<14;v++)c.fillRect(ox-0.15+v*0.028,yc-0.028,0.014,0.056);
   c.fillStyle=sw?'#E9A93A':'#43C3CF';c.beginPath();c.arc(ox-0.215,yc,0.009,0,6.283);c.fill();
  }
 }
 c.globalAlpha=1;
}
function pkgMini(c,x,y){
 c.fillStyle='#33402E';c.fillRect(x-0.19,y-0.17,0.38,0.34);
 c.fillStyle='#56636E';c.fillRect(x-0.15,y-0.11,0.3,0.22);
 c.fillStyle='#1B2731';c.fillRect(x-0.088,y-0.055,0.0868,0.11);c.fillRect(x+0.0012,y-0.055,0.0868,0.11);
 c.fillStyle='#3B4651';for(const sx of [-0.132,0.096])for(const yc of [-0.078,-0.026,0.026,0.078])c.fillRect(x+sx,y+yc-0.023,0.036,0.046);
}
function sTray(c,px){
 c.fillStyle='#27363F';c.fillRect(-5,-5,10,10);
 c.fillStyle='#1A252C';c.fillRect(-0.98,-0.64,1.96,1.28);
 c.fillStyle='#123D33';c.fillRect(-0.92,-0.58,1.84,1.16);
 c.strokeStyle='#1F6551';c.lineWidth=1.2*px;c.stroke(traces);
 pkgMini(c,0,0);pkgMini(c,0.56,0);
 c.fillStyle='#2D3A44';c.fillRect(-0.66,-0.13,0.26,0.26);c.fillStyle='#46545F';c.fillRect(-0.6,-0.07,0.14,0.14);
 c.fillStyle='#2A3A46';for(let k=0;k<8;k++){c.fillRect(-0.84,-0.4+k*0.1,0.12,0.05);}
 c.fillStyle='#3B4852';for(let k=0;k<6;k++)c.fillRect(0.84,-0.5+k*0.2,0.06,0.1);
 c.fillStyle='#252F36';for(let k=0;k<5;k++)c.fillRect(-0.3+k*0.12,0.38,0.08,0.12);
 c.strokeStyle='#2D6F8C';c.lineWidth=6*px;c.beginPath();c.moveTo(-0.95,-0.5);c.lineTo(-0.2,-0.5);c.lineTo(-0.2,-0.25);c.moveTo(-0.95,0.5);c.lineTo(0.3,0.5);c.lineTo(0.3,0.25);c.stroke();
}
function sPkg(c,px){
 c.fillStyle='#123D33';c.fillRect(-5,-5,10,10);
 c.fillStyle='#33402E';c.fillRect(-0.95,-0.85,1.9,1.7);
 c.fillStyle='#8A6A3A';for(const [x,y] of caps)c.fillRect(x,y,0.035,0.02);
 c.fillStyle='#56636E';c.fillRect(-0.75,-0.55,1.5,1.1);
 c.fillStyle='#1B2731';c.fillRect(-0.44,-0.275,0.434,0.55);c.fillRect(0.006,-0.275,0.434,0.55);
 c.strokeStyle='#26343F';c.lineWidth=1*px;c.beginPath();for(let k=1;k<8;k++){const y=-0.275+k*0.0688;c.moveTo(-0.44,y);c.lineTo(0.44,y);}c.stroke();
 for(const x0 of [-0.66,0.48])for(const yc of [-0.39,-0.13,0.13,0.39]){c.fillStyle='#3B4651';c.fillRect(x0,yc-0.115,0.18,0.23);c.fillStyle='#4E5B66';c.fillRect(x0+0.015,yc-0.1,0.15,0.2);}
}
function smLayout(c,cx,cy,s,detail,px){
 const X=v=>cx+v*s,Y=v=>cy+v*s;
 c.fillStyle='#24394A';fr(c,X(-0.97),Y(-0.97),X(0.97),Y(0.97));
 c.fillStyle='#3A3462';fr(c,X(-0.95),Y(-0.12),X(0.95),Y(0.12));
 for(const qx of [-1,1])for(const qy of [-1,1]){
  c.fillStyle='#B98323';fr(c,X(qx*0.92),Y(qy*0.92),X(qx*0.52),Y(qy*0.45));
  c.fillStyle='#2E4B5C';fr(c,X(qx*0.5),Y(qy*0.92),X(qx*0.08),Y(qy*0.4));
  c.fillStyle='#246F78';fr(c,X(qx*0.92),Y(qy*0.38),X(qx*0.08),Y(qy*0.16));
 }
 if(detail){
  c.strokeStyle='#D9A445';c.lineWidth=1*px;c.beginPath();
  for(const qx of [-1,1])for(const qy of [-1,1]){const xa=Math.min(qx*0.92,qx*0.52),xb=Math.max(qx*0.92,qx*0.52),ya=Math.min(qy*0.92,qy*0.45),yb=Math.max(qy*0.92,qy*0.45);for(let k=1;k<8;k++){const x=xa+(xb-xa)*k/8;c.moveTo(x,ya);c.lineTo(x,yb);const y=ya+(yb-ya)*k/8;c.moveTo(xa,y);c.lineTo(xb,y);}}
  c.stroke();
  c.strokeStyle='#5550A0';c.beginPath();for(let x=-0.95;x<0.95;x+=0.03){c.moveTo(x,-0.12);c.lineTo(x,0.12);}for(let y=-0.12;y<=0.12;y+=0.03){c.moveTo(-0.95,y);c.lineTo(0.95,y);}c.stroke();
  c.strokeStyle='#3AA5B0';c.beginPath();for(const qy of [-1,1]){const ya=Math.min(qy*0.38,qy*0.16),yb=Math.max(qy*0.38,qy*0.16);for(let y=ya+0.02;y<yb;y+=0.025){c.moveTo(-0.92,y);c.lineTo(-0.08,y);c.moveTo(0.08,y);c.lineTo(0.92,y);}}c.stroke();
  c.fillStyle='#3C6275';c.fill(smTex);
 }
}
function sDie(c,px){
 c.fillStyle='#56636E';c.fillRect(-5,-5,10,10);
 c.fillStyle='#16212A';c.fillRect(-0.65,-0.82,1.3,1.64);
 c.fillStyle='#1F3540';c.fillRect(-0.65,-0.82,0.04,1.64);c.fillRect(0.61,-0.82,0.04,1.64);
 c.fillStyle='#2E5A63';for(let k=0;k<12;k++)c.fillRect(-0.645,-0.78+k*0.135,0.03,0.09);
 c.fillStyle='#3A3462';c.fillRect(-0.6,-0.08,1.2,0.16);
 c.strokeStyle='#5550A0';c.lineWidth=1*px;c.beginPath();for(let x=-0.6;x<0.6;x+=0.02){c.moveTo(x,-0.08);c.lineTo(x,0.08);}c.stroke();
 for(let col=0;col<8;col++)for(let j=0;j<4;j++){const x=-0.6+col*0.15+0.07;smLayout(c,x,-0.78+j*0.165+0.07,0.07,false,px);smLayout(c,x,0.12+j*0.165+0.07,0.07,false,px);}
}
function sSM(c,px){c.fillStyle='#16212A';c.fillRect(-5,-5,10,10);smLayout(c,0,0,1,true,px);}
function sRows(c,px){
 c.fillStyle='#16242E';c.fillRect(-5,-5,10,10);
 c.fillStyle='#24405A';c.fill(rowA);c.fillStyle='#2C4A61';c.fill(rowB);
 c.fillStyle='#7C8B95';c.globalAlpha=0.7;c.fill(rails);c.globalAlpha=1;
 c.lineWidth=0.004;c.strokeStyle='rgba(76,198,210,0.55)';c.stroke(m1);
 c.lineWidth=0.005;c.strokeStyle='rgba(233,169,58,0.5)';c.stroke(m2);
}
function sCell(c,px){
 c.fillStyle='#16242E';c.fillRect(-5,-5,10,10);
 for(let row=-3;row<=3;row++){
  const yc=row*0.4,sg=(row%2===0)?1:-1;
  c.fillStyle='rgba(46,125,91,0.85)';c.fillRect(-1.3,yc-sg*0.085-0.045,2.6,0.09);
  c.fillStyle='rgba(46,125,91,0.55)';c.fillRect(-1.3,yc+sg*0.085-0.045,2.6,0.09);
  for(let k=-14;k<=14;k++){const dummy=((k+2)%5+5)%5===0;c.fillStyle=dummy?'#6A3A35':'#D0533F';c.fillRect(k*0.096-0.014,yc-0.165,0.028,0.33);}
 }
 c.fillStyle='#8E9AA3';for(let row=-3;row<=3;row++){c.fillRect(-1.3,row*0.4+0.2-0.02,2.6,0.04);}
 c.fillStyle='#DDE3E7';for(const [x,y] of contacts)c.fillRect(x-0.016,y-0.016,0.032,0.032);
 c.fillStyle='rgba(79,163,217,0.8)';for(const [x,y,l] of m0)c.fillRect(x,y-0.009,l,0.018);
}
function sFET(c,px,t){
 c.fillStyle='#2B3A44';c.fillRect(-5,-5,10,10);
 c.fillStyle='#4E5D69';c.fillRect(-5,0.62,10,5);
 c.fillStyle='#2E7D5B';c.fillRect(-1.6,-0.48,1.27,1.1);c.fillRect(0.33,-0.48,1.27,1.1);
 c.fillStyle='#B87333';c.fillRect(-0.92,-1.6,0.42,1.12);c.fillRect(0.5,-1.6,0.42,1.12);c.fillRect(-0.12,-1.6,0.24,0.8);
 c.fillStyle='#3E4E5A';c.fillRect(-0.33,-0.8,0.08,1.42);c.fillRect(0.25,-0.8,0.08,1.42);
 c.fillStyle='#B5801F';c.fillRect(-0.25,-0.8,0.5,1.42);
 for(const yc of [-0.3,0,0.3]){
  c.fillStyle='#9C88FF';c.fillRect(-0.25,yc-0.11,0.5,0.22);
  c.fillStyle='#A9B6C0';c.fillRect(-0.4,yc-0.083,0.8,0.166);
 }
 c.fillStyle='#4CC6D2';
 for(let i=0;i<18;i++){const yc=[-0.3,0,0.3][i%3];const x=((i*0.37+t*0.35)%2.4)-1.2;const yy=yc+((i*7)%5-2)*0.022;c.globalAlpha=Math.abs(x)<0.42?1:0.5;c.beginPath();c.arc(x,yy,0.02,0,6.283);c.fill();}
 c.globalAlpha=1;
}
function sAtoms(c,px,t){
 c.fillStyle='#121C23';c.fillRect(-5,-5,10,10);
 const a=0.362,cw=0.256;
 c.strokeStyle='#3E5260';c.lineWidth=0.018;c.beginPath();
 const pts=[];
 for(let ix=-6;ix<=6;ix++)for(let iy=-4;iy<=4;iy++){const bx=ix*cw,by=iy*a;pts.push([bx,by],[bx,by+a/4],[bx+cw/2,by+a/2],[bx+cw/2,by+3*a/4]);
  c.moveTo(bx,by);c.lineTo(bx,by+a/4);c.moveTo(bx,by+a/4);c.lineTo(bx+cw/2,by+a/2);c.moveTo(bx,by+a/4);c.lineTo(bx-cw/2,by+a/2);
  c.moveTo(bx+cw/2,by+a/2);c.lineTo(bx+cw/2,by+3*a/4);c.moveTo(bx+cw/2,by+3*a/4);c.lineTo(bx,by+a);c.moveTo(bx+cw/2,by+3*a/4);c.lineTo(bx+cw,by+a);}
 c.stroke();
 for(const [x,y] of pts){c.fillStyle='#9EB3C2';c.beginPath();c.arc(x,y,0.045,0,6.283);c.fill();c.fillStyle='#C9D7E1';c.beginPath();c.arc(x-0.012,y-0.012,0.016,0,6.283);c.fill();}
 c.fillStyle='rgba(76,198,210,0.9)';
 for(let i=0;i<9;i++){const x=((i*0.53+t*0.12)%2.4)-1.2;const y=-0.9+i*0.22+Math.sin(t*1.3+i)*0.03;c.beginPath();c.arc(x,y,0.028,0,6.283);c.fill();}
}
const S=[sRack,sTray,sPkg,sDie,sSM,sRows,sCell,sFET,sAtoms];
let t=0,playing=false,goal=null,last=performance.now(),visible=true;
const range=$('#zRange'),lv=$('#zLevels');
L.forEach((l,i)=>{const b=document.createElement('button');b.textContent=(i+1)+' '+l.name;b.addEventListener('click',()=>{playing=false;goal=i;setPlay();});lv.appendChild(b);});
let lastIdx=-1;
function hud(){
 const i=Math.min(N-1,Math.floor(t+1e-6)),f=t-i;
 const r=i<N-1?L[i].size/L[i+1].size:1,s=Math.pow(r,f);
 const fov=L[i].size/s;
 $('#zFov').textContent=fmtLen(fov);
 const near=Math.round(t);
 if(near!==lastIdx){lastIdx=near;$('#zName').textContent=L[near].name;$('#zIdx').textContent=tx('zoom.level',{n:near+1,total:N});$('#zDesc').textContent=L[near].d;[...lv.children].forEach((b,k)=>b.setAttribute('aria-current',k===near?'true':'false'));}
 // scale bar
 const w=cv.getBoundingClientRect().width,h=cv.getBoundingClientRect().height;const U=Math.min(w,h)/2*0.92;const mPerPx=fov/(2*U);
 const target=mPerPx*90;const p=Math.pow(10,Math.floor(Math.log10(target)));let nice=p;for(const m of [1,2,5])if(m*p<=target)nice=m*p;
 $('#zBar').textContent=fmtLen(nice);$('#zBarI').style.width=(nice/mPerPx)+'px';
}
function draw(time){
 const {ctx:c,w,h,d}=fit(cv);
 c.setTransform(d,0,0,d,0,0);c.fillStyle='#081117';c.fillRect(0,0,w,h);
 let i=Math.floor(t+1e-9),f=t-i;if(i>=N-1){i=N-1;f=0;}
 const U=Math.min(w,h)/2*0.92;
 const r=i<N-1?L[i].size/L[i+1].size:1,s=Math.pow(r,f);
 const Tg=i<N-1?L[i].T:[0,0];
 const k=r>1?(1-1/s)*r/(r-1):0;
 const base=new DOMMatrix([d,0,0,d,0,0]).translate(w/2,h/2).scale(U*s).translate(-Tg[0]*k,-Tg[1]*k);
 const sec=time/1000;
 function scene(idx,m,scalePx,clip,alpha){c.save();c.setTransform(m);c.globalAlpha=alpha;if(clip){c.beginPath();c.rect(-1,-1,2,2);c.clip();}S[idx](c,1/scalePx,sec);c.restore();}
 if(i>0){const rp=L[i-1].size/L[i].size;const P=L[i-1].T;scene(i-1,base.scale(rp).translate(-P[0],-P[1]),U*s*rp,false,1);}
 scene(i,base,U*s,i>0,1);
 if(i<N-1){
  c.save();c.setTransform(base);c.globalAlpha=Math.max(0,1-f*1.6);c.strokeStyle='#F0B13C';c.lineWidth=1.5/(U*s);c.setLineDash([5/(U*s),4/(U*s)]);c.strokeRect(Tg[0]-1/r,Tg[1]-1/r,2/r,2/r);c.restore();
  const a=clamp((f-0.12)/0.5,0,1);
  if(a>0)scene(i+1,base.translate(Tg[0],Tg[1]).scale(1/r),U*s/r,true,a);
 }
 if(i>0){c.save();c.setTransform(d,0,0,d,0,0);c.strokeStyle='rgba(240,177,60,0.35)';c.lineWidth=1;c.strokeRect(w/2-U*s*1+0.5,h/2-U*s*1+0.5,2*U*s-1,2*U*s-1);c.restore();}
 hud();
}
function setPlay(){$('#zPlay').textContent=playing?tx('zoom.pause'):(t>=N-1-1e-3?tx('zoom.again'):tx('zoom.in'));}
$('#zPlay').addEventListener('click',()=>{if(!playing&&t>=N-1-1e-3)t=0;playing=!playing;goal=null;setPlay();});
$('#zBack').addEventListener('click',()=>{playing=false;goal=0;setPlay();});
range.addEventListener('input',()=>{playing=false;goal=null;t=range.value/100;setPlay();});
function loop(now){
 const dt=Math.min(0.05,(now-last)/1000);last=now;
 if(playing){t+=dt*0.42;if(t>=N-1){t=N-1;playing=false;setPlay();}}
 else if(goal!==null){const diff=goal-t;if(Math.abs(diff)<0.004){t=goal;goal=null;setPlay();}else t+=diff*Math.min(1,dt*3.2)+Math.sign(diff)*dt*0.25*(Math.abs(diff)>0.3?1:0);}
 range.value=Math.round(t*100);
 if(visible)draw(now);
 requestAnimationFrame(loop);
}
inView(cv,v=>visible=v);
new ResizeObserver(()=>draw(performance.now())).observe(cv);
setPlay();draw(0);requestAnimationFrame(loop);
})();
}
