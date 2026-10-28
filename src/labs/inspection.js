/* Lab: INSPECTION */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function insp(){
const S=60;let dies,defect,showCmp=false,guess=null,seed=4;const cv=$('#inCv');
function gen(){for(let tries=0;tries<20;tries++){const r=rng(seed*977+tries);const b=new Uint8Array(S*S);
 for(let y=2;y<S-3;y+=6){for(let x=2;x<S-2;x++)for(let t=0;t<3;t++)b[(y+t)*S+x]=1;for(let k=0;k<3;k++){const cx=4+Math.floor(r()*(S-10));for(let t=0;t<3;t++){b[(y+t)*S+cx]=0;b[(y+t)*S+cx+1]=0;}}}
 for(let k=0;k<26;k++){const ly=2+6*Math.floor(r()*8);const cx=3+Math.floor(r()*(S-6));for(let a=0;a<2;a++)for(let q=3;q<6;q++){const yy=ly+q;if(yy<S)b[yy*S+cx+a]=1;}}
 dies=[b.slice(),b.slice(),b.slice()];const di=Math.floor(r()*3),type=['bridge','open','particle'][Math.floor(r()*3)];const ly=2+6*(1+Math.floor(r()*6));const x=6+Math.floor(r()*(S-12));let y;const Dd=dies[di];
 if(type==='bridge'){y=ly+4;for(let a=0;a<2;a++)for(let q=3;q<6;q++)Dd[(ly+q)*S+x+a]=1;}
 else if(type==='open'){y=ly+1;for(let a=0;a<3;a++)for(let t=0;t<3;t++)Dd[(ly+t)*S+x+a]=0;}
 else{y=ly+4;for(let a=-2;a<=2;a++)for(let q=-2;q<=2;q++)if(a*a+q*q<=5){const yy=y+q,xx=x+a;if(yy>=0&&yy<S&&xx>=0&&xx<S)Dd[yy*S+xx]=1;}}
 let diff=0;for(let i=0;i<S*S;i++)if(Dd[i]!==b[i])diff++;if(diff>=3){defect={di,x,y,type};break;}}
 showCmp=false;guess=null;draw();text();}
const DESC={bridge:'an extra metal bridge between two wires, which shorts two signals together',open:'a break in a wire, which cuts a signal',particle:'a particle lying across the pattern, which can short or block several features'};
function text(){let t;if(showCmp)t='Die '+(defect.di+1)+' disagrees with both neighbours: '+DESC[defect.type]+'. One defect like this can kill the whole chip.';else if(guess===true)t='Found it in die '+(defect.di+1)+'. Now imagine doing this for 10 billion features on hundreds of dies per wafer, at speed.';else if(guess===false)t='Not there. Keep looking, or let the comparison find it.';else t='One of these three dies has a defect. Click where you think it is.';$('#inTxt').textContent=t;$('#inTag').textContent=showCmp||guess?'Defect found':'Defect hidden';}
let geo={};
function draw(){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);const gap=14,ds=Math.min((w-gap*4)/3,h-28),cs=ds/S;const oy=22;geo={ds,cs,gap,oy};
 const pc=T['cyan-fill'];c.font='11px IBM Plex Mono, monospace';
 for(let k=0;k<3;k++){const ox=gap+k*(ds+gap);c.fillStyle=rgba(T.muted,0.12);c.fillRect(ox,oy,ds,ds);c.fillStyle=T.muted;c.fillText('Die '+(k+1),ox,14);
  const Dk=dies[k];c.fillStyle=pc;for(let i=0;i<S*S;i++)if(Dk[i])c.fillRect(ox+(i%S)*cs,oy+Math.floor(i/S)*cs,cs+0.3,cs+0.3);
  if(showCmp){const o1=dies[(k+1)%3],o2=dies[(k+2)%3];c.fillStyle=T.bad;for(let i=0;i<S*S;i++)if(Dk[i]!==o1[i]&&Dk[i]!==o2[i])c.fillRect(ox+(i%S)*cs,oy+Math.floor(i/S)*cs,cs+0.3,cs+0.3);}}
 if(showCmp||guess===true){const ox=gap+defect.di*(ds+gap);c.strokeStyle=T.bad;c.lineWidth=2;c.beginPath();c.arc(ox+(defect.x+0.5)*cs,oy+(defect.y+0.5)*cs,7*cs,0,6.283);c.stroke();}
 if(geo.click){c.strokeStyle=guess?T.good:T.ink;c.lineWidth=1.5;c.beginPath();c.arc(geo.click[0],geo.click[1],6,0,6.283);c.stroke();}
}
cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;const {ds,cs,gap,oy}=geo;for(let k=0;k<3;k++){const ox=gap+k*(ds+gap);if(x>=ox&&x<ox+ds&&y>=oy&&y<oy+ds){const cx=(x-ox)/cs,cy=(y-oy)/cs;guess=k===defect.di&&Math.hypot(cx-defect.x,cy-defect.y)<=5;const keep=[x,y];draw();geo.click=keep;draw();text();return;}}});
$('#inCmp').addEventListener('click',()=>{showCmp=true;draw();text();});$('#inNew').addEventListener('click',()=>{seed++;geo.click=null;gen();});
watch(cv,draw);gen();
})();
}
