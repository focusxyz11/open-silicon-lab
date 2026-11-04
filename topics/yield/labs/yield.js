/* Lab: WAFER MAP, one picture at four depths. The model is src/engines/yieldsim.js; the rail is
   src/core/depth.js. See it needs no numbers, and Model it uses the same wafer as See it. */
import {clamp,RM,T,redraws,inView} from 'osl/core/ui.js';
import {depthLab} from 'osl/core/depth.js';
import {RAD,rain,grid,piece,hit,seeded,poissonY,murphyY,negBinY,spareY,costPerChip} from 'osl/engines/yieldsim.js';
const lerp=(a,b,t)=>a+(b-a)*t,ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
const money=v=>isFinite(v)?'$'+Math.round(v).toLocaleString('en-US'):'n/a',pct=v=>(v*100).toFixed(1)+'%';
const SPARE=.02,RAIN_S=.95,FALL_S=.34;
export function init(sec){
const q=id=>sec.querySelector('#'+id),qa=s=>[...sec.querySelectorAll(s)],cv=q('ydCv'),x=cv.getContext('2d');
const S={d:0,n:1,clump:false,al:1,W:26,H:32,D:.1,wf:30,seed:8,link:.1,k:0};
const M={phase:'guess',g:0,errs:[],last:null};
let runs=[],dt=0,fly=1,rainAt=null,cross=null,depthAnim=null,flyAt=null,raf=0,R=null,started=false;
const grids=new Map(),rains=new Map();
const gridOf=(w,h)=>{const k=w.toFixed(3)+'x'+h.toFixed(3);if(!grids.has(k)){if(grids.size>200)grids.clear();grids.set(k,grid(w,h));}return grids.get(k);};
const rainOf=()=>{const k=[S.seed,S.clump,S.clump?S.al:0].join();if(!rains.has(k)){if(rains.size>60)rains.clear();rains.set(k,rain(S.seed,S.clump,S.al));}return rains.get(k);};
const opts=()=>({clumped:S.clump,alpha:S.al});

function derive(){
 const fr=S.d===3,link=fr?S.link:.1,k=fr&&S.n===1?S.k:0,spare=k*SPARE,p=piece(S.W,S.H,S.n,link,spare),g=gridOf(p.w,p.h),pts=rainOf(),h=hit(g,pts,S.D,k),base=hit(gridOf(S.W,S.H),pts,S.D,0).good,lam=p.area/100*S.D,Y=spareY(lam,k,S.clump,S.al);
 const r=seeded(S.seed+S.n);h.keep.forEach(d=>{d.t=d.d*RAIN_S+FALL_S;});
 h.dies.forEach(d=>{d.j=r();if(d.bad)d.t=d.on.map(o=>o.t).sort((a,b)=>a-b)[k];});
 R={p,h,base,lam,Y,k,goal:base*2,chips:Math.floor(h.good/S.n),max:Math.floor(h.gross/S.n)};
}
function layout(W){
 const wide=W>=500,d0=Math.min(W-8,500),shelf=78,H0=d0+shelf+22,R1=wide?Math.min(120,W*.2):88,H1=wide?320:2*R1+286;
 const H=Math.round(lerp(H0,H1,dt));
 return{R:lerp(d0/2,R1,dt),cx:lerp(W/2,wide?R1+6:W/2,dt),cy:lerp(d0/2+4,wide?H1/2-14:R1+4,dt),H,d0,shelf,chart:wide?{l:2*R1+50,r:W-6,t:24,b:H1-46}:{l:42,r:W-6,t:2*R1+34,b:H1-46}};
}
const dieColor=(d,tau,dry)=>dry?[T.muted,.2]:(d.bad&&(tau===null||tau>=d.t)?[T.bad,.82]:[T.good,.62]);
function drawDies(c,dies,s,tau,dry,a){
 for(const d of dies){const X=c.cx+d.x*s,Y=c.cy+d.y*s,w=d.w*s,h=d.h*s,gp=w>5?.6:.2;
  if(!d.ok){x.globalAlpha=a*.3;x.strokeStyle=T.muted;x.lineWidth=.75;x.strokeRect(X+.5,Y+.5,w-1,h-1);continue;}
  const[col,al]=dieColor(d,tau,dry);x.globalAlpha=a*al;x.fillStyle=col;x.fillRect(X+gp,Y+gp,w-2*gp,h-2*gp);}
 x.globalAlpha=1;
}
function drawWafer(c,tau,dry){
 const s=c.R/RAD;
 x.fillStyle=T.sunk;x.beginPath();x.arc(c.cx,c.cy,c.R,0,6.2832);x.fill();
 x.save();x.beginPath();x.arc(c.cx,c.cy,c.R,0,6.2832);x.clip();
 if(cross){const u=clamp((performance.now()-cross.t0)/260,0,1);drawDies(c,cross.dies,s,null,dry,1-u);drawDies(c,R.h.dies,s,tau,dry,u);}else drawDies(c,R.h.dies,s,tau,dry,1);
 x.restore();
 x.strokeStyle=T.muted;x.lineWidth=1;x.globalAlpha=.7;x.beginPath();x.arc(c.cx,c.cy,c.R,0,6.2832);x.stroke();x.globalAlpha=1;
 x.fillStyle=T.surface;x.beginPath();x.moveTo(c.cx-6,c.cy+c.R+1);x.lineTo(c.cx,c.cy+c.R-7);x.lineTo(c.cx+6,c.cy+c.R+1);x.fill();
 if(dry)return;
 const pr=Math.max(1.25,c.R/118);
 for(const p of R.h.keep){const X=c.cx+p.x*s,Y=c.cy+p.y*s;
  if(tau===null||tau>=p.t){x.fillStyle=T.ink;x.beginPath();x.arc(X,Y,pr,0,6.2832);x.fill();
   if(tau!==null&&tau<p.t+.22){x.strokeStyle=T['cyan-fill'];x.lineWidth=1.25;x.globalAlpha=1-(tau-p.t)/.22;x.beginPath();x.arc(X,Y,pr+(tau-p.t)*42,0,6.2832);x.stroke();x.globalAlpha=1;}}
  else{const u=clamp((tau-(p.t-FALL_S))/FALL_S,0,1);if(u<=0)continue;x.fillStyle=T['cyan-fill'];x.globalAlpha=u;x.beginPath();x.ellipse(X,Y-(1-u*u)*70,pr*.9,pr*2,0,0,6.2832);x.fill();x.globalAlpha=1;}}
}
function shelf(c,W,tau,a){
 if(a<=0||(S.d===1&&M.phase==='guess'))return;
 let good=R.h.good;if(tau!==null){good=0;for(const d of R.h.dies)if(d.ok&&(!d.bad||tau<d.t))good++;}
 const chips=Math.floor(good/S.n),goal=S.d===0?R.goal:0,tot=Math.max(chips,goal,1),h=c.shelf-8,y0=c.d0+18;
 let sz=16;while(sz>2){const per=Math.floor((W+3)/(sz+3)),rows=Math.ceil(tot/per);if(rows*(sz+3)<=h)break;sz--;}
 const per=Math.floor((W+3)/(sz+3));x.globalAlpha=a;
 for(let i=0;i<tot;i++){const X=(i%per)*(sz+3),Y=y0+Math.floor(i/per)*(sz+3);
  if(i<chips){x.fillStyle=T.good;x.fillRect(X,Y,sz,sz);if(sz>=10&&S.n>1){x.strokeStyle=T.surface;x.lineWidth=1;x.beginPath();x.moveTo(X+sz/2,Y);x.lineTo(X+sz/2,Y+sz);if(S.n>2){x.moveTo(X,Y+sz/2);x.lineTo(X+sz,Y+sz/2);}x.stroke();}}
  else{x.strokeStyle=T.muted;x.lineWidth=1;x.strokeRect(X+.5,Y+.5,sz-1,sz-1);}}
 x.globalAlpha=1;
}
function chart(c,W,a){
 if(a<=0)return;
 const{l,r,t,b}=c.chart,XM=4.5,px=v=>l+Math.min(v,XM)/XM*(r-l),py=v=>b-v*(b-t),mono='IBM Plex Mono, monospace';
 x.globalAlpha=a;x.strokeStyle=T.line;x.lineWidth=1;x.fillStyle=T.muted;x.font='11px '+mono;x.textAlign='right';x.textBaseline='middle';
 [0,.25,.5,.75,1].forEach(v=>{x.beginPath();x.moveTo(l,py(v));x.lineTo(r,py(v));x.stroke();x.fillText(Math.round(v*100)+'%',l-6,py(v));});
 x.textAlign='right';x.textBaseline='alphabetic';x.fillText('Yield',l-6,t-9);x.textAlign='center';[0,1,2,3,4].forEach(v=>x.fillText(v,px(v),b+15));
 x.font='12px '+mono;x.fillText('Average defects per die, A·D₀',(l+r)/2,b+33);
 const curves=[['Poisson',poissonY,[],!S.clump],['Murphy',murphyY,[6,4],false],['Neg. binomial α='+S.al,v=>negBinY(v,S.al),[1.5,4],S.clump]];
 x.font='11px '+mono;x.textAlign='left';
 curves.forEach(([name,f,dash,on],i)=>{x.strokeStyle=T.ink;x.globalAlpha=a*(on?1:.55);x.lineWidth=on?2:1.25;x.setLineDash(dash);x.beginPath();
  for(let j=0;j<=120;j++){const v=j/120*XM,Y=py(f(v));j?x.lineTo(px(v),Y):x.moveTo(px(v),Y);}x.stroke();
  const ly=t+9+i*15,lx=Math.max(l+40,r-168);x.beginPath();x.moveTo(lx,ly);x.lineTo(lx+24,ly);x.stroke();x.setLineDash([]);x.globalAlpha=a;x.fillStyle=on?T.ink:T.muted;x.textBaseline='middle';x.fillText(name,lx+30,ly);x.textBaseline='alphabetic';});
 x.setLineDash([]);x.globalAlpha=a;
 /* The wafer, sorted into one bar: good dies below, bad above. */
 const ok=R.h.dies.filter(d=>d.ok).sort((p,o)=>p.bad-o.bad),N=ok.length,bw=Math.max(8,Math.min(13,(r-l)/28)),bx=px(R.lam),hh=(b-t)/N,s=c.R/RAD;
 ok.forEach((d,i)=>{if(fly<=0)return;const u=ease(clamp((fly-d.j*.4)/.6,0,1)),X0=c.cx+d.x*s,Y0=c.cy+d.y*s,X1=bx-bw/2,Y1=b-(i+1)*hh;
  x.globalAlpha=a*(d.bad?.82:.62);x.fillStyle=d.bad?T.bad:T.good;x.fillRect(lerp(X0,X1,u),lerp(Y0,Y1,u),Math.max(1,lerp(d.w*s,bw,u)),Math.max(.5,lerp(d.h*s,hh,u)));});
 x.globalAlpha=a;
 if(fly>.75){x.globalAlpha=a*clamp((fly-.75)/.25,0,1);
  runs.forEach(o=>{x.strokeStyle=T.ink;x.lineWidth=1;x.beginPath();x.arc(px(o[0]),py(o[1]),3,0,6.2832);x.stroke();});
  x.fillStyle=T['amber-fill'];x.strokeStyle=T.ink;x.lineWidth=1.25;x.beginPath();x.arc(bx,py(R.Y),6,0,6.2832);x.fill();x.stroke();
  x.fillStyle=T.ink;x.font='600 12px '+mono;x.textAlign=bx+80>r?'right':'left';x.fillText('Y '+pct(R.Y),bx+(x.textAlign==='left'?13:-13),py(R.Y)-9);}
 x.globalAlpha=1;
}
function draw(){
 const W=cv.parentElement.clientWidth;if(W<2)return;
 const dp=Math.min(devicePixelRatio||1,2),c=layout(W);
 if(cv.width!==Math.round(W*dp)||cv.height!==Math.round(c.H*dp)){cv.width=Math.round(W*dp);cv.height=Math.round(c.H*dp);cv.style.height=c.H+'px';}
 x.setTransform(dp,0,0,dp,0,0);x.clearRect(0,0,W,c.H);
 const tau=rainAt===null?null:(performance.now()-rainAt)/1000,dry=S.d===1&&M.phase==='guess';
 drawWafer(c,tau,dry);shelf(c,W,tau,1-dt);chart(c,W,dt);
}
function loop(){
 const now=performance.now();let more=false;
 if(rainAt!==null){if((now-rainAt)/1000>RAIN_S+FALL_S+.25){rainAt=null;sync();}else more=true;}
 if(cross){if(now-cross.t0>260)cross=null;else more=true;}
 if(depthAnim){const u=clamp((now-depthAnim.t0)/1500,0,1);dt=lerp(depthAnim.from,depthAnim.to,ease(clamp(u/.42,0,1)));if(depthAnim.to===1)fly=clamp((u-.36)/.64,0,1);if(u>=1)depthAnim=null;else more=true;}
 if(flyAt){const u=clamp((now-flyAt)/640,0,1);fly=u;if(u>=1)flyAt=null;else more=true;}
 draw();raf=more?requestAnimationFrame(loop):0;
}
const kick=()=>{if(RM){rainAt=null;cross=null;if(depthAnim){dt=depthAnim.to;fly=1;depthAnim=null;}flyAt=null;fly=1;draw();return;}if(!raf)raf=requestAnimationFrame(loop);};
const point=()=>[R.lam,R.h.good/R.h.gross];
function changed(){M.last=null;derive();runs=S.d===2?[point()]:[];sync();kick();}
function rainNow(){S.seed++;derive();rainAt=performance.now();runs.push(point());sync();kick();}
function runMany(n){for(let i=0;i<n;i++){S.seed++;derive();runs.push(point());}fly=0;flyAt=performance.now();sync();kick();}
function say(text,ok){const e=q('ydStatus');e.textContent=text||'';e.classList.toggle('ok',!!ok);}
function seeStatus(){
 if(rainAt!==null)return say('');
 if(R.chips>=R.goal)return say(S.clump?'Twice as many on this wafer. Rain again and see if it holds.':'Twice as many chips. Now try clumps.',true);
 if(S.n===1)return say(S.clump?'Clumps leave gaps, so more big chips live.':'');
 if(S.clump)return say('Clumps leave more big chips alive, so cutting helps less.');
 if(S.n<8)return say('More. Keep cutting.');
 say('Close on this wafer. Rain again.');
}
function sync(){
 const d=S.d,dry=d===1&&M.phase==='guess',one=costPerChip(S.W,S.H,1,S.D,S.wf*1000,opts()),cur=costPerChip(S.W,S.H,S.n,S.D,S.wf*1000,opts());
 q('ydAlBox').hidden=d!==2||!S.clump;
 q('ydCutL').textContent=d?'Chiplets per chip':'Cut';q('ydRainL').textContent=d?'Defects':'Rain';q('ydEven').textContent=d?'Random':'Even';
 q('ydNew').textContent=d?'Run another wafer':'Rain again';
 qa('#ydRain button').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.c==='1')===S.clump)));
 qa('#ydSplit button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.n===S.n)));
 qa('#ydPre button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.w===S.W&&+b.dataset.h===S.H)));
 q('ydWO').textContent=S.W+' mm';q('ydHO').textContent=S.H+' mm';q('ydDO').textContent=S.D.toFixed(2)+' per cm²';q('ydCO').textContent='$'+S.wf+',000';q('ydAlO').textContent=S.al.toFixed(1);q('ydLkO').textContent=Math.round(S.link*100)+'%';q('ydSpO').textContent=S.k;
 const over=S.W>26||S.H>33;
 q('ydWarn').innerHTML=over&&S.n===1?'<span class="status bad">Exceeds 26 × 33 mm reticle: cannot print as one die</span>':'300 mm wafer';
 q('ydShelf').textContent=R.chips>=R.goal?'full':'open';q('ydDepth').textContent=d;
 /* Readouts always hold the live values, because challenges read them. While sealed, they are only hidden. */
 q('ydN').textContent=R.max;q('ydL').textContent=R.lam.toFixed(2);q('ydChips').textContent=R.chips+' of '+R.max;q('ydY').textContent=pct(cur.Y);q('ydCost').textContent=money(cur.cost);
 qa('#ydRead .seal').forEach(e=>{e.classList.toggle('depthsealed',dry);e.setAttribute('aria-hidden',String(dry));});
 const tol=Math.max(2,Math.round(R.max*.05));
 q('ydGuess').max=R.max;if(M.g>R.max||!M.g)M.g=Math.round(R.max/2);q('ydGuess').value=M.g;q('ydGuessO').textContent=M.g;q('ydGuessBox').hidden=d!==1||!dry;q('ydCheck').textContent=dry?'Rain and check':'Guess again';
 const best=[...M.errs].sort((a,b)=>a-b).slice(0,3);q('ydBest').textContent=best.length?best.join(', ')+' off':'none yet';
 let b=null;[2,4,8].forEach(n=>{const r=costPerChip(S.W,S.H,n,S.D,S.wf*1000,opts()).cost/one.cost;if(!b||r<b.r)b={n,r};});
 q('ydRatio').textContent=b.r.toFixed(3);
 q('ydEq').innerHTML=(S.clump?'Y = (1 + A·D₀/α)<sup>−α</sup>':'Y = e<sup>−A·D₀</sup>')+' = '+pct(cur.Y)+'<small>A·D₀ = '+(cur.area/100).toFixed(2)+' cm² × '+S.D.toFixed(2)+' = '+cur.l.toFixed(3)+'</small>';
 q('ydThN').textContent=S.n>1?S.n+' chiplets':'Same';
 const row=(l,a,c)=>'<tr><td>'+l+'</td><td>'+a+'</td><td>'+c+'</td></tr>';
 q('ydTb').innerHTML=row('Die area, mm²',Math.round(one.area),Math.round(cur.area))+row('Dies per wafer',one.gross,cur.gross)+row('Yield, this model',pct(one.Y),pct(cur.Y))+row('Silicon per good chip',money(one.cost),money(cur.cost))+row('Cost ratio','1.00',(cur.cost/one.cost).toFixed(2));
 const n=S.n>1?S.n:8,big=costPerChip(S.W,S.H,1,S.D,S.wf*1000,{...opts(),spare:S.k*SPARE,k:S.k}).cost,small=costPerChip(S.W,S.H,n,S.D,S.wf*1000,{...opts(),link:S.link}).cost,m=Math.max(big,small);
 const bar=(l,v)=>'<div><span>'+l+'<b>'+money(v)+'</b></span><i style="width:'+(v/m*100).toFixed(1)+'%"></i></div>';
 q('ydBars').innerHTML=bar('One big die, '+S.k+' spare'+(S.k===1?'':'s'),big)+bar(n+' chiplets, '+Math.round(S.link*100)+'% links',small);
 if(d===0)seeStatus();
 if(d===1){if(M.last)say('You guessed '+M.last.g+'. '+M.last.c+' worked. Off by '+M.last.e+'.'+(M.last.e<=tol?' Close.':''),M.last.e<=tol);else say(dry?'Within '+tol+' counts as close. Use the average defects per die.':'');}
 if(d===2)say('Best split: '+b.n+' pieces at '+b.r.toFixed(2)+' of the one-die cost. '+(b.r<.5?'Half price holds.':'Half price missed.'),b.r<.5);
 if(d===3)say('');
 cv.setAttribute('aria-label',dry?'A dry wafer holding '+R.h.gross+' dies':'A wafer with '+R.h.good+' working and '+(R.h.gross-R.h.good)+' ruined dies, making '+R.chips+' working chips'+(d===0?', goal '+R.goal:'')+(dt>.5?'. Beside it, yield curves with the model at '+pct(R.Y):''));
}
[1,2,4,8].forEach(n=>{const b=document.createElement('button');b.type='button';b.dataset.n=n;b.setAttribute('aria-label','Cut into '+n+(n===1?' piece':' pieces'));
 const cols=n>2?(n===4?2:4):n,rows=n>2?2:1,cw=16/cols,ch=16/rows;let s='<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="2" width="16" height="16"/>';
 for(let i=1;i<cols;i++)s+='<path d="M'+(2+i*cw)+' 2V18"/>';for(let j=1;j<rows;j++)s+='<path d="M2 '+(2+j*ch)+'H18"/>';
 b.innerHTML=s+'</svg>'+n;b.addEventListener('click',()=>{S.n=n;if(R)cross={t0:performance.now(),dies:R.h.dies};derive();if(S.d===2)runs=[point()];sync();kick();});q('ydSplit').appendChild(b);});
qa('#ydRain button').forEach(b=>b.addEventListener('click',()=>{S.clump=b.dataset.c==='1';M.last=null;derive();runs=S.d===2?[point()]:[];rainAt=(S.d===0||S.d===3||(S.d===1&&M.phase!=='guess'))?performance.now():null;sync();kick();}));
qa('#ydPre button').forEach(b=>b.addEventListener('click',()=>{S.W=+b.dataset.w;S.H=+b.dataset.h;q('ydW').value=S.W;q('ydH').value=S.H;changed();}));
const bind=(id,f)=>q(id).addEventListener('input',e=>{f(+e.target.value);changed();});
bind('ydW',v=>S.W=v);bind('ydH',v=>S.H=v);bind('ydD',v=>S.D=v);bind('ydC',v=>S.wf=v);bind('ydAl',v=>S.al=v);bind('ydLk',v=>S.link=v/100);bind('ydSp',v=>S.k=v);
q('ydGuess').addEventListener('input',e=>{M.g=+e.target.value;q('ydGuessO').textContent=M.g;});
q('ydNew').addEventListener('click',()=>{if(S.d===2)runMany(1);else rainNow();});
q('ydTen').addEventListener('click',()=>runMany(10));
q('ydCheck').addEventListener('click',()=>{
 if(M.phase==='guess'){M.phase='shown';derive();rainAt=performance.now();const e=Math.abs(M.g-R.chips);M.last={g:M.g,c:R.chips,e};M.errs.push(e);sync();kick();}
 else{M.phase='guess';M.last=null;S.seed++;derive();sync();kick();}
});
derive();
const rail=depthLab(sec.querySelector('.depthlab'),d=>{
 S.d=d;if(d===1){M.phase='guess';M.last=null;S.seed++;}
 derive();if(d===2){runs=[point()];fly=0;}else runs=[];
 depthAnim={t0:performance.now(),from:dt,to:d===2?1:0};sync();kick();
});
S.d=rail.d;if(S.d===2){dt=1;fly=1;runs=[point()];}derive();
sync();redraws.push(draw);new ResizeObserver(()=>draw()).observe(cv.parentElement);draw();
/* The one orchestrated moment: the first rain, when the wafer first comes into view. */
inView(cv,on=>{if(on&&!started){started=true;if(S.d===0&&!RM){rainAt=performance.now();kick();}else draw();}});
}
