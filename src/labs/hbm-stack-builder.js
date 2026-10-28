/* Lab: HBM STACK BUILDER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function hbm(){
const cv=$('#hbCv');if(!cv)return;
/* name, width, default pin, max pin, die Gb, height limit µm, allowed heights */
const GEN=[['HBM3E',1024,9.6,9.8,24,720,[8,12,16]],['HBM4',2048,10.7,12,24,775,[8,12,16]],['HBM4E (est.)',2048,12,14,32,775,[12,16,20]]];
let g=1,hi=12,bond='bump';
$('#hbGen').innerHTML=GEN.map((x,i)=>'<button type="button" data-i="'+i+'">'+x[0]+'</button>').join('');
$('#hbGen').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{g=+b.dataset.i;const G=GEN[g];if(!G[6].includes(hi))hi=G[6][1];$('#hbPin').value=G[2];hiBtns();run();}));
function hiBtns(){$('#hbHi').innerHTML=GEN[g][6].map(n=>'<button type="button" data-h="'+n+'">'+n+'-high</button>').join('');$('#hbHi').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{hi=+b.dataset.h;run();}));}
$('#hbBond').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{bond=b.dataset.b;run();}));
['#hbPin','#hbN'].forEach(s=>$(s).addEventListener('input',run));
let R={};
function run(){const G=GEN[g],pin=+$('#hbPin').value,n=+$('#hbN').value;const capS=hi*G[4]/8,bwS=G[1]*pin/8/1000;const gap=bond==='bump'?14:1;const per=(G[5]-110-60)/hi;const die=per-gap;
 R={G,pin,n,capS,bwS,die,gap};
 $('#hbGen').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===g?'true':'false'));$('#hbHi').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.h===hi?'true':'false'));$('#hbBond').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.b===bond?'true':'false'));
 $('#hbPinO').textContent=pin.toFixed(1)+' Gb/s';$('#hbNO').textContent=n+' stacks';
 $('#hbCap').textContent=Math.round(capS*n)+' GB';$('#hbBw').textContent=(bwS*n).toFixed(1)+' TB/s';$('#hbThk').textContent=die<12?'Impossible':Math.round(die)+' µm thick';$('#hbPins').textContent=(G[1]*n).toLocaleString('en-US');
 $('#hbTag').textContent=hi+'-high '+G[0]+' · '+Math.round(capS)+' GB per stack';
 let t='';if(die<12)t='There is no room: even paper-thin dies won\'t fit this many layers with micro-bump gaps. Hybrid bonding, which fuses copper pads directly with no gap, is the industry\'s answer for 20-high stacks.';
 else if(die<30)t='Each die must be ground thinner than '+Math.round(die)+' µm, less than half the thickness of a human hair. Dies this thin warp and crack, so yields fall. Hybrid bonding would give each die more room.';
 else t='This stack fits within the '+G[5]+' µm package height with comfortable die thickness.';
 if(pin>G[3])t+=' The pin speed is above what has been announced for this generation.';
 if(g===1&&hi===12&&n===8&&pin>=10.5)t+=' This is close to NVIDIA Rubin: 288 GB and about 22 TB/s per GPU.';
 if(hi>=16)t+=' Taller stacks also trap more heat in the middle dies.';
 $('#hbTxt').textContent=t;draw();}
function draw(){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);if(!R.G)return;c.font='11px IBM Plex Mono, monospace';
 /* top view of package on left */const pw=Math.min(w*0.42,230),py=50;c.fillStyle=rgba(T.muted,.18);c.fillRect(8,py,pw-16,pw*0.7);c.fillStyle=T.muted;c.textAlign='left';c.fillText('package, top view',8,py-8);
 const gx=8+(pw-16)*0.3,gw=(pw-16)*0.4,gy=py+12,gh=pw*0.7-24;c.fillStyle=rgba(T.violet,.55);c.fillRect(gx,gy,gw,gh);c.fillStyle=T.ink;c.textAlign='center';c.fillText('GPU',gx+gw/2,gy+gh/2+4);
 const per=R.n/2,sh=gh/Math.max(per,1)-4;for(let k=0;k<per;k++){[[8+(pw-16)*0.04,1],[gx+gw+(pw-16)*0.04,1]].forEach(([x])=>{c.fillStyle=rgba(T.cyan,.6);c.fillRect(x,gy+k*(sh+4),(pw-16)*0.22,sh);});}
 /* cross-section */const x0=pw+20,x1=w-14;if(x1-x0<90)return;const lim=R.G[5];const y1=h-30,y0=30,sc=(y1-y0)/800;const cx=(x0+x1)/2,sw=Math.min(180,(x1-x0)*0.7);
 c.fillStyle=T.muted;c.textAlign='left';c.fillText('one stack, side view (height to scale)',x0,18);
 c.strokeStyle=T.bad;c.setLineDash([4,4]);c.beginPath();c.moveTo(x0,y1-lim*sc);c.lineTo(x1,y1-lim*sc);c.stroke();c.setLineDash([]);c.fillStyle=T.bad;c.textAlign='right';c.fillText(lim+' µm limit',x1,y1-lim*sc-5);
 let y=y1;c.fillStyle=rgba(T.violet,.6);const bh=110*sc;c.fillRect(cx-sw/2,y-bh,sw,bh);c.fillStyle=T.ink;c.textAlign='center';c.fillText('base (logic) die',cx,y-bh/2+4);y-=bh;
 const dieT=Math.max(R.die,3);for(let i=0;i<hi;i++){if(R.gap>2){c.fillStyle=rgba(T['amber-fill'],.7);for(let k=0;k<8;k++)c.fillRect(cx-sw/2+8+k*(sw-16)/8,y-R.gap*sc,(sw-16)/16,R.gap*sc);}y-=R.gap*sc;c.fillStyle=R.die<12?rgba(T.bad,.5):rgba(T.cyan,.55);c.fillRect(cx-sw/2,y-dieT*sc,sw,Math.max(1,dieT*sc-0.4));y-=dieT*sc;}
 c.fillStyle=rgba(T.muted,.35);c.fillRect(cx-sw/2,y-60*sc,sw,60*sc);
 c.strokeStyle=rgba(T.ink,.5);c.lineWidth=1;for(let k=1;k<6;k++){const xx=cx-sw/2+k*sw/6;c.beginPath();c.moveTo(xx,y1-bh);c.lineTo(xx,y);c.stroke();}
 c.fillStyle=T.muted;c.textAlign='left';c.fillText('TSVs',cx+sw/2+6,(y+y1)/2);c.fillText(hi+' dies',cx+sw/2+6,(y+y1)/2+14);if(R.gap>2)c.fillText('bumps',cx+sw/2+6,(y+y1)/2+28);}
hiBtns();run();watch(cv,draw);
})();
}
