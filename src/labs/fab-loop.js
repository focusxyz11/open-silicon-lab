/* Lab: FAB LOOP */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function fab(){
const ST=[
 ['Clean','Wet chemistry and scrubbing remove particles and residue. One stray particle can kill a die, so the air in a fab is thousands of times cleaner than a hospital operating room.','Wet benches and scrubbers (SCREEN, Lam Research)'],
 ['Deposit film','Grow or deposit an insulating film. Atomic layer deposition (ALD) can build it one atomic layer at a time.','CVD and ALD tools (Applied Materials, Lam Research, Tokyo Electron, ASM)'],
 ['Coat resist','Spin a light-sensitive photoresist onto the wafer, a film only tens of nanometres thick.','Coater/developer tracks (Tokyo Electron)'],
 ['Expose','The scanner shines EUV light through the mask and shrinks the image 4× onto the resist, stepping across the wafer exposure by exposure.','EUV scanners (ASML, sole supplier)'],
 ['Develop','A developer liquid dissolves the resist that was hit by light, uncovering the film underneath.','Coater/developer tracks'],
 ['Etch','A plasma of reactive ions carves straight down into the film wherever the resist is open.','Plasma etch (Lam Research, Tokyo Electron, Applied Materials)'],
 ['Strip resist','Remove the leftover resist. The pattern now lives in the film itself.','Ashers and wet strip'],
 ['Fill metal','Coat the trenches with a thin barrier and fill them with copper. Newer nodes are testing ruthenium for the narrowest wires.','Deposition and electroplating (Applied Materials, Lam Research)'],
 ['Polish (CMP)','Chemical-mechanical polishing grinds the top perfectly flat, leaving metal only inside the trenches, so the next layer starts on a level surface.','CMP tools (Applied Materials, Ebara)'],
 ['Inspect','Optical and electron-beam tools scan for defects and measure dimensions to fractions of a nanometre. Data flows back to tune earlier steps.','Inspection and metrology (KLA, Applied Materials, Hitachi High-Tech)']
];
let step=5,prog=1,playing=false,lastT=0;const box=$('#fbSteps');
ST.forEach((s,i)=>{const b=document.createElement('button');b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span>'+s[0];b.addEventListener('click',()=>{playing=false;go(i);});box.appendChild(b);});
function go(i){step=clamp(i,0,ST.length-1);prog=RM?1:0;info();if(!raf)tick(performance.now());}
function info(){[...box.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===step?'true':'false'));$('#fbStepLbl').textContent='Step '+(step+1)+' of 10';
 $('#fbText').innerHTML='<h3>'+ST[step][0]+'</h3><p>'+ST[step][1]+'</p><p class="muted small"><b>Equipment:</b> '+ST[step][2]+'</p>';$('#fbPlay').textContent=playing?'Pause':'Play loop';}
$('#fbPrev').addEventListener('click',()=>{playing=false;go(step-1);});
$('#fbNext').addEventListener('click',()=>{playing=false;go(step+1);});
$('#fbPlay').addEventListener('click',()=>{playing=!playing;if(playing&&step===ST.length-1&&prog>=1)step=-1;if(playing)go(prog>=1?step+1:step);info();});
let raf=0;
function tick(now){const dt=Math.min(0.05,(now-(lastT||now))/1000);lastT=now;
 if(prog<1){prog=Math.min(1,prog+dt/1.3);}
 else if(playing){if(step<ST.length-1){hold+=dt;if(hold>0.7){hold=0;step++;prog=0;info();}}else{playing=false;info();}}
 draw();
 raf=(prog<1||playing)?requestAnimationFrame(tick):0;if(!raf)lastT=0;}
let hold=0;
function draw(){
 const {ctx:c,w,h}=fit($('#fbCv'));c.clearRect(0,0,w,h);
 const SI='#7D8C99',OXc='#8FB0D6',RS='#E3A532',EX='#9C88FF',CU='#C47A44';
 const y0=h*0.74,FH=46,RH=26;const tr=[0.18,0.34,0.5,0.66,0.82].map(f=>f*w);const tw=Math.max(16,w*0.055);
 const s=step,p=prog;
 const film=s<1?0:s===1?p*FH:FH;
 const resist=s<2?0:s===2?p*RH:s<6?RH:s===6?(1-p)*RH:0;
 const expo=s<3?0:s===3?p:1;
 const openH=s<4?1:s===4?(1-p):0;
 const depth=s<5?0:s===5?p*FH:FH;
 const fill=s<7?0:s===7?p:1;
 const over=s<7?0:s===7?p*14:s===8?(1-p)*14:0;
 c.fillStyle=SI;c.fillRect(0,y0,w,h-y0);
 c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('silicon (transistors already built below)',10,h-10);
 if(film>0){c.fillStyle=OXc;c.fillRect(0,y0-film,w,film);}
 const ft=y0-film;
 if(depth>0)tr.forEach(x=>{c.clearRect(x-tw/2,ft,tw,depth);c.fillStyle=T.sunk;c.fillRect(x-tw/2,ft,tw,depth);});
 if(fill>0){c.fillStyle=CU;tr.forEach(x=>{const fh=depth*Math.min(1,fill*1.4);c.fillRect(x-tw/2,ft+depth-fh,tw,fh);});if(over>0)c.fillRect(0,ft-over,w,over);}
 if(resist>0){
  c.fillStyle=RS;c.fillRect(0,ft-resist,w,resist);
  tr.forEach(x=>{c.clearRect(x-tw/2,ft-resist,tw,resist);c.fillStyle=T.sunk;c.fillRect(x-tw/2,ft-resist,tw,resist);const oh=resist*openH;if(oh>0){c.fillStyle=expo>0?EX:RS;c.globalAlpha=expo>0?0.4+0.6*expo:1;c.fillRect(x-tw/2,ft-oh,tw,oh);c.globalAlpha=1;}});
 }
 if(s===3){const my=36;c.fillStyle='#2B3138';c.fillRect(0,my,w,12);tr.forEach(x=>{c.clearRect(x-tw/2,my,tw,12);c.fillStyle=T.sunk;c.fillRect(x-tw/2,my,tw,12);});
  c.fillStyle=T.muted;c.fillText('mask',10,my-6);c.strokeStyle=rgba(T.violet,0.35+0.5*Math.sin(p*Math.PI));c.lineWidth=2;tr.forEach(x=>{for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(x+k*tw*0.3,0);c.lineTo(x+k*tw*0.3,ft-resist);c.stroke();}});
  c.fillStyle=T.violet;c.fillText('EUV light, 13.5 nm',w-150,22);}
 if(s===5){c.strokeStyle=rgba(T.cyan,0.85);c.lineWidth=1.5;tr.forEach((x,i)=>{for(let k=0;k<4;k++){const yy=((p*300+k*40+i*17)%(ft-20));c.beginPath();c.moveTo(x-tw*0.3+k*tw*0.2,yy);c.lineTo(x-tw*0.3+k*tw*0.2,yy+10);c.stroke();}});c.fillStyle=T.cyan;c.fillText('plasma ions',w-110,22);}
 if(s===0){c.fillStyle=rgba(T.cyan,0.8*(1-p));for(let i=0;i<24;i++){const x=(i*97)%w,yy=y0-6-((i*31)%40)-p*60;c.beginPath();c.arc(x,yy,3,0,6.283);c.fill();}c.fillStyle=rgba(T.ink,1-p);for(let i=0;i<6;i++){c.fillRect((i*173+40)%w,y0-4,4,4);}}
 if(s===8){const px=-w*0.3+p*w*1.3;c.fillStyle='#5A6670';c.fillRect(px,ft-over-22,w*0.35,18);c.fillStyle=T.muted;c.fillText('polishing pad',Math.max(10,Math.min(w-110,px+8)),ft-over-28);}
 if(s===9){const bx=p*w;c.strokeStyle=rgba(T.cyan,0.9);c.lineWidth=2;c.beginPath();c.moveTo(bx,10);c.lineTo(bx,ft);c.stroke();c.fillStyle='#5A6670';c.fillRect(bx-14,0,28,12);
  if(bx>tr[2]){c.strokeStyle=T.bad;c.lineWidth=2;c.beginPath();c.arc(tr[2],ft-2,tw*0.8,0,6.283);c.stroke();c.fillStyle=T.bad;c.fillText('width 21.4 nm ✓',tr[2]+tw,ft-20);}}
 c.fillStyle=T.ink;c.font='600 12px IBM Plex Mono, monospace';c.fillText('Layer '+(s<9?'in progress':'done')+' · repeat for each of 70+ mask layers',10,18);
}
watch($('#fbCv'),draw);info();draw();
})();
}
