/* Lab: PLACEMENT (simulated annealing) */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function place(){
const GW=14,GH=10,NS=GW*GH,NC=110,IW=11;
const cv=$('#plCv'),sp=$('#plSpark');
const R=rng(7);
const nets=[];const ideal=[];
for(let i=0;i<NC;i++)ideal.push([i%IW,Math.floor(i/IW)]);
const idx=(x,y)=>y*IW+x;
for(let y=0;y<10;y++)for(let x=0;x<IW;x++){if(x<IW-1&&R()<0.85)nets.push([idx(x,y),idx(x+1,y)]);if(y<9&&R()<0.85)nets.push([idx(x,y),idx(x,y+1)]);}
for(let k=0;k<40;k++){const x=Math.floor(R()*(IW-1)),y=Math.floor(R()*9);nets.push([idx(x,y),idx(x+1,y+1),idx(x+(R()<0.5?1:0),y)].filter((v,i,a)=>a.indexOf(v)===i));}
for(let k=0;k<8;k++){nets.push([Math.floor(R()*NC),Math.floor(R()*NC),Math.floor(R()*NC)]);}
const cellNets=Array.from({length:NC},()=>[]);nets.forEach((n,i)=>n.forEach(c=>cellNets[c].push(i)));
const cluster=ideal.map(([x,y])=>(x<5.5?0:1)+(y<5?0:2));
let slot=new Int16Array(NS),pos=new Int16Array(NC);
let temp=0,moves=0,running=false,startW=0,hist=[],greedyLeft=0,auto=false;
function hp(n){let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const ce of nets[n]){const s=pos[ce],x=s%GW,y=(s/GW)|0;if(x<a)a=x;if(x>b)b=x;if(y<c)c=y;if(y>d)d=y;}return b-a+d-c;}
function total(){let s=0;for(let i=0;i<nets.length;i++)s+=hp(i);return s;}
function scramble(){slot.fill(-1);const order=[...Array(NS).keys()];const r=rng(Math.floor(Math.random()*1e9));for(let i=NS-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}for(let c=0;c<NC;c++){pos[c]=order[c];slot[order[c]]=c;}temp=6;moves=0;startW=total();hist=[startW];greedyLeft=0;running=false;btn();draw();}
function trySwap(T0){
 const s1=Math.floor(Math.random()*NS),s2=Math.floor(Math.random()*NS);if(s1===s2)return;
 const c1=slot[s1],c2=slot[s2];if(c1<0&&c2<0)return;
 const aff=new Set();if(c1>=0)cellNets[c1].forEach(n=>aff.add(n));if(c2>=0)cellNets[c2].forEach(n=>aff.add(n));
 let before=0;aff.forEach(n=>before+=hp(n));
 slot[s1]=c2;slot[s2]=c1;if(c1>=0)pos[c1]=s2;if(c2>=0)pos[c2]=s1;
 let after=0;aff.forEach(n=>after+=hp(n));
 const dl=after-before;moves++;
 if(dl<=0||(T0>0&&Math.random()<Math.exp(-dl/T0)))return;
 slot[s1]=c1;slot[s2]=c2;if(c1>=0)pos[c1]=s1;if(c2>=0)pos[c2]=s2;
}
function step(){
 for(let k=0;k<700;k++)trySwap(greedyLeft>0?0:temp);
 if(greedyLeft>0){greedyLeft--;if(greedyLeft===0){running=false;btn();}}
 else{temp*=0.982;if(temp<0.03){greedyLeft=25;}}
 hist.push(total());
}
function btn(){$('#plRun').textContent=running?'Pause':(greedyLeft===0&&temp<0.03?'Run again':'Run annealing');}
$('#plRun').addEventListener('click',()=>{if(!running&&temp<0.03&&greedyLeft===0){temp=3;}running=!running;btn();if(running)loop();});
$('#plShuf').addEventListener('click',scramble);
const cols=()=>[T['amber-fill'],T['cyan-fill'],T.violet,T.muted];
function draw(){
 const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);
 const cs=Math.min(w/GW,h/GH),ox=(w-cs*GW)/2,oy=(h-cs*GH)/2;
 c.strokeStyle=rgba(T.line.startsWith('#')?T.line:'#888888',0.6);c.lineWidth=1;
 for(let i=0;i<=GW;i++){c.beginPath();c.moveTo(ox+i*cs,oy);c.lineTo(ox+i*cs,oy+GH*cs);c.stroke();}
 for(let j=0;j<=GH;j++){c.beginPath();c.moveTo(ox,oy+j*cs);c.lineTo(ox+GW*cs,oy+j*cs);c.stroke();}
 const P=s=>[ox+(s%GW+0.5)*cs,oy+(((s/GW)|0)+0.5)*cs];
 c.strokeStyle=rgba(T.ink,0.28);c.lineWidth=1;
 for(const n of nets){let mx=0,my=0;for(const ce of n){const p=P(pos[ce]);mx+=p[0];my+=p[1];}mx/=n.length;my/=n.length;c.beginPath();for(const ce of n){const p=P(pos[ce]);c.moveTo(mx,my);c.lineTo(p[0],p[1]);}c.stroke();}
 const C=cols();
 for(let i=0;i<NC;i++){const p=P(pos[i]);c.fillStyle=C[cluster[i]];const z=cs*0.62;c.fillRect(p[0]-z/2,p[1]-z/2,z,z);}
 const cur=hist[hist.length-1];
 $('#plW').textContent=cur.toLocaleString('en-US');$('#plR').textContent=startW?Math.round((1-cur/startW)*100)+'%':'–';$('#plT').textContent=greedyLeft>0?'0 (final polish)':temp.toFixed(2);$('#plM').textContent=moves.toLocaleString('en-US');
 spark();
}
function spark(){
 const {ctx:c,w,h}=fit(sp);c.clearRect(0,0,w,h);
 const mx=Math.max(...hist),mn=0;const n=Math.max(hist.length,120);
 const X=i=>8+(w-16)*i/(n-1),Y=v=>h-8-(h-22)*(v-mn)/(mx-mn||1);
 c.strokeStyle=rgba(T.muted,0.35);c.beginPath();c.moveTo(8,Y(startW/2));c.lineTo(w-8,Y(startW/2));c.stroke();
 c.fillStyle=rgba(T['amber-fill'],0.22);c.beginPath();c.moveTo(X(0),h-8);hist.forEach((v,i)=>c.lineTo(X(i),Y(v)));c.lineTo(X(hist.length-1),h-8);c.fill();
 c.strokeStyle=T.amber;c.lineWidth=2;c.beginPath();hist.forEach((v,i)=>i?c.lineTo(X(i),Y(v)):c.moveTo(X(i),Y(v)));c.stroke();
 const le=hist.length-1;c.fillStyle=T.amber;c.beginPath();c.arc(X(le),Y(hist[le]),3.5,0,6.283);c.fill();
 c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('wirelength over time',10,13);c.fillText('½ start',w-58,Y(startW/2)-4);
}
function loop(){if(!running)return;step();draw();requestAnimationFrame(loop);}
watch(cv,draw);new ResizeObserver(()=>spark()).observe(sp);
scramble();
inView(cv,v=>{if(v&&!auto&&!RM){auto=true;setTimeout(()=>{if(!running&&moves===0){running=true;btn();loop();}},600);}});
})();
}
