/* Lab: QUANTUM SEARCH, one picture at four depths. The area of each square is the chance of finding
   the prize in that box. That is the real maths drawn directly, so the picture never has to be
   unlearned. The model is src/engines/grover.js; the rail is src/core/depth.js. */
import {clamp,RM,T,redraws} from 'osl/core/ui.js';
import {depthLab} from 'osl/core/depth.js';
import {seeded,start,flip,mean,mirror,run,theta,chance,bestSteps,noisy,noisyAmps,plain,sample,logicalError,physicalQubits,THRESHOLD} from 'osl/engines/grover.js';
const lerp=(a,b,t)=>a+(b-a)*t,ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,pc=(v,n=1)=>(v*100).toFixed(n)+'%';
const BIG=2**20,OPS=100,MOVE_MS=620,MONO='IBM Plex Mono, monospace';
const eOf=v=>v===0?0:Math.pow(10,lerp(-5,-.5,v/100)),pOf=v=>Math.pow(10,lerp(-3.3,-1.7,v/100));
export function init(sec){
const q=id=>sec.querySelector('#'+id),qa=s=>[...sec.querySelectorAll(s)],cv=q('qsCv'),x=cv.getContext('2d');
const S={d:0,N:4,prize:2,seed:11,k:1,eV:60,pV:50,dist:11,lidOpen:false};
const G={a:null,last:'none',prev:0,looked:null,pAt:0};
const M={list:[],best:{}};
const A={from:[],to:[],t0:0,on:false};
let view=[],tgt=[],dt=0,depthAnim=null,lid=0,lidAnim=null,shotAt=null,raf=0;
const rng=()=>seeded(++S.seed*7919);
const pickPrize=()=>{S.prize=Math.floor(rng()()*S.N);};
const eNow=()=>S.d===2?eOf(S.eV):S.d===3?1-Math.pow(1-logicalError(pOf(S.pV),S.dist),OPS):0;
function amps(){if(S.d===0)return G.a;const a=run(S.N,S.k,S.prize),e=eNow();return e>0?noisyAmps(a,S.k,e):a;}
function setTarget(a){tgt=a.slice();if(RM){view=tgt.slice();draw();return;}A.from=view.length===a.length?view.slice():a.map(()=>0);A.to=tgt.slice();A.t0=performance.now();A.on=true;kick();}
function fresh(){G.a=start(S.N);G.last='none';G.prev=0;G.looked=null;pickPrize();view=G.a.map(()=>0);setTarget(G.a);}
function newBoard(){pickPrize();M.list=[];}
const stepsMax=()=>Math.min(16,Math.max(8,2*bestSteps(S.N)+2));
function layout(W){
 const hMax=150,slot=W/S.N,scale=Math.min(hMax,(slot-3)*Math.sqrt(S.N)),H0=2*hMax+76,small=Math.min(92,scale),pic=lerp(H0,2*small+76,dt),H1=2*small+76+246;
 return{H:Math.round(lerp(H0,H1,dt)),slot,amp:lerp(scale,small,dt),base:(pic-52)/2+2,rowY:pic-44,chart:{l:42,r:W-8,t:pic+18,b:H1-40}};
}
function squares(c,W){
 const n=view.length,hide=S.d===1?lid:0;
 x.strokeStyle=T.muted;x.lineWidth=1;x.beginPath();x.moveTo(0,c.base+.5);x.lineTo(W,c.base+.5);x.stroke();
 if(hide>=1)return;
 x.globalAlpha=1-hide;
 for(let i=0;i<n;i++){const v=view[i],s=Math.abs(v)*c.amp,cx=(i+.5)*c.slot,X=cx-s/2,Y=v>=0?c.base-s:c.base+1;
  if(s<.4)continue;x.fillStyle=v>=0?T['cyan-fill']:T['amber-fill'];x.fillRect(X,Y,s,s);x.strokeStyle=v>=0?T.cyan:T.amber;x.lineWidth=1;x.strokeRect(X+.5,Y+.5,s-1,s-1);}
 if(S.d===0&&G.looked===null){const my=c.base-mean(view)*c.amp;let big=0;for(let i=1;i<n;i++)if(Math.abs(view[i])>Math.abs(view[big]))big=i;const left=big>=n/2;
  x.strokeStyle=T.amber;x.setLineDash([5,5]);x.lineWidth=1.5;x.beginPath();x.moveTo(0,my);x.lineTo(W,my);x.stroke();x.setLineDash([]);
  x.fillStyle=T.amber;x.font='12px '+MONO;x.textAlign=left?'left':'right';x.textBaseline='bottom';x.fillText('average',left?2:W-2,my-3);x.textBaseline='alphabetic';}
 x.globalAlpha=1;
}
function boxes(c){
 const n=view.length,bits=Math.round(Math.log2(n)),sz=Math.min(26,c.slot-4),y=c.rowY,showBits=S.d>0&&c.slot>=30;
 for(let i=0;i<n;i++){const cx=(i+.5)*c.slot;let f=T.surface,st=T.line;
  const looked=S.d===0&&G.looked===i,hitIt=looked&&i===S.prize,known=(S.d===0&&G.looked!==null&&i===S.prize)||(S.d>=2&&i===S.prize)||(S.d===1&&M.list.length>0&&i===S.prize);
  if(hitIt||known){f=T.good;st=T.good;}else if(looked){f=T.muted;st=T.muted;}
  x.fillStyle=f;x.strokeStyle=st;x.lineWidth=1;x.fillRect(cx-sz/2,y,sz,sz);x.strokeRect(cx-sz/2+.5,y+.5,sz-1,sz-1);
  if(hitIt||known){x.fillStyle=T.bg;const r=sz*.26;x.beginPath();for(let j=0;j<10;j++){const o=j%2?r*.45:r,t=-1.5708+j*.6283;x.lineTo(cx+Math.cos(t)*o,y+sz/2+Math.sin(t)*o);}x.closePath();x.fill();}
  if(showBits){x.fillStyle=T.muted;x.font='11px '+MONO;x.textAlign='center';x.fillText(i.toString(2).padStart(bits,'0'),cx,y+sz+12);}}
}
function bars(c){
 if(S.d!==1||!M.list.length)return;
 const seen=shotAt===null?M.list.length:Math.floor(clamp((performance.now()-shotAt)/900,0,1)*M.list.length),cnt=Array(S.N).fill(0);
 for(let i=0;i<seen;i++)cnt[M.list[i]]++;
 const top=12,bot=c.rowY-8,bw=Math.min(32,c.slot-6);
 for(let i=0;i<S.N;i++){const h=cnt[i]/M.list.length*(bot-top),cx=(i+.5)*c.slot;x.fillStyle=i===S.prize?T.good:T.muted;x.globalAlpha=S.lidOpen?.28:(i===S.prize?.85:.55);x.fillRect(cx-bw/2,bot-h,bw,h);x.globalAlpha=1;
  if(cnt[i]&&c.slot>=24&&!S.lidOpen){x.fillStyle=T.ink;x.font='600 12px '+MONO;x.textAlign='center';x.fillText(cnt[i],cx,bot-h-4);}}
}
function sealed(c,W){
 if(S.d!==1||lid<=0)return;
 x.globalAlpha=lid;x.fillStyle=T.sunk;x.fillRect(0,4,W,c.rowY-8);x.strokeStyle=T.line;x.lineWidth=1;x.strokeRect(.5,4.5,W-1,c.rowY-9);
 if(!M.list.length){x.fillStyle=T.muted;x.font='500 15px '+MONO;x.textAlign='center';x.fillText('Sealed',W/2,c.base+5);}
 x.globalAlpha=1;
}
function chart(c,W,a){
 if(a<=0)return;
 const{l,r,t,b}=c.chart,K=stepsMax(),px=v=>l+v/K*(r-l),py=v=>b-v*(b-t),e=S.d===2?eOf(S.eV):0,N=S.N;
 x.globalAlpha=a;x.strokeStyle=T.line;x.lineWidth=1;x.fillStyle=T.muted;x.font='11px '+MONO;x.textAlign='right';x.textBaseline='middle';
 [0,.5,1].forEach(v=>{x.beginPath();x.moveTo(l,py(v));x.lineTo(r,py(v));x.stroke();x.fillText(Math.round(v*100)+'%',l-6,py(v));});
 x.textAlign='center';x.textBaseline='alphabetic';for(let k=0;k<=K;k+=K>10?2:1)x.fillText(k,px(k),b+15);x.font='12px '+MONO;x.fillText('Steps',(l+r)/2,b+32);
 const line=(f,dash,w,col)=>{x.strokeStyle=col;x.lineWidth=w;x.setLineDash(dash);x.beginPath();for(let j=0;j<=240;j++){const v=j/240*K,Y=py(f(v));j?x.lineTo(px(v),Y):x.moveTo(px(v),Y);}x.stroke();x.setLineDash([]);};
 line(v=>plain(N,v),[1.5,4],1.5,T.muted);line(v=>chance(N,v),[],2,T.ink);if(e>0)line(v=>noisy(chance(N,v),N,v,e),[6,4],1.75,T.amber);
 const key=[['Quantum',[],T.ink],['With noise',[6,4],T.amber],['Plain checks',[1.5,4],T.muted]],lx=r-122;
 x.textAlign='left';x.textBaseline='middle';x.font='11px '+MONO;key.forEach(([s,d,col],i)=>{const y=t+8+i*14;x.fillStyle=T.surface;x.globalAlpha=a*.8;x.fillRect(lx-4,y-7,126,14);x.globalAlpha=a;x.strokeStyle=col;x.lineWidth=1.75;x.setLineDash(d);x.beginPath();x.moveTo(lx,y);x.lineTo(lx+24,y);x.stroke();x.setLineDash([]);x.fillStyle=T.muted;x.fillText(s,lx+30,y);});
 x.textBaseline='alphabetic';
 const pv=noisy(chance(N,S.k),N,S.k,e);x.fillStyle=T['amber-fill'];x.strokeStyle=T.ink;x.lineWidth=1.25;x.beginPath();x.arc(px(S.k),py(pv),6,0,6.2832);x.fill();x.stroke();
 x.globalAlpha=1;
}
function draw(){
 const W=cv.parentElement.clientWidth;if(W<2)return;
 const dp=Math.min(devicePixelRatio||1,2),c=layout(W);
 if(cv.width!==Math.round(W*dp)||cv.height!==Math.round(c.H*dp)){cv.width=Math.round(W*dp);cv.height=Math.round(c.H*dp);cv.style.height=c.H+'px';}
 x.setTransform(dp,0,0,dp,0,0);x.clearRect(0,0,W,c.H);
 sealed(c,W);bars(c);squares(c,W);boxes(c);chart(c,W,dt);
}
function loop(){
 const now=performance.now();let more=false;
 if(A.on){const u=clamp((now-A.t0)/MOVE_MS,0,1),e=ease(u);view=A.to.map((v,i)=>lerp(A.from[i]||0,v,e));if(u>=1)A.on=false;else more=true;}
 if(depthAnim){const u=clamp((now-depthAnim.t0)/700,0,1);dt=lerp(depthAnim.from,depthAnim.to,ease(u));if(u>=1)depthAnim=null;else more=true;}
 if(lidAnim){const u=clamp((now-lidAnim.t0)/420,0,1);lid=lerp(lidAnim.from,lidAnim.to,ease(u));if(u>=1)lidAnim=null;else more=true;}
 if(shotAt!==null){if(now-shotAt>900){shotAt=null;sync();}else more=true;}
 draw();raf=more?requestAnimationFrame(loop):0;
}
function kick(){if(RM){view=tgt.slice();A.on=false;if(depthAnim){dt=depthAnim.to;depthAnim=null;}if(lidAnim){lid=lidAnim.to;lidAnim=null;}shotAt=null;draw();return;}if(!raf)raf=requestAnimationFrame(loop);}
function say(text,ok){const e=q('qsStatus');e.textContent=text||'';e.classList.toggle('ok',!!ok);}
function seeStatus(){
 const p=G.a[S.prize]**2;
 if(G.looked!==null){
  if(G.looked!==S.prize)return say('Empty. Looking wiped the squares. Start over.');
  if(G.pAt>.9){const nx=S.N<16?' Now try '+(S.N*2)+' boxes.':'';return say('Found it. The wrong boxes '+(G.pAt>.995?'cancelled':'nearly cancelled')+' out.'+nx,true);}
  return say('Found it, with a '+Math.round(G.pAt*100)+'% chance. That was luck. Grow the square first.');}
 if(G.last==='flip')return say(G.a[S.prize]<0?'One square is upside down. Now mirror across the line.':'Flipped back.');
 if(G.last==='still')return say('Nothing moved. Flip first.');
 if(G.last==='mirror'){if(p>.995)return say('Full square. Look now.',true);if(p>.9)return say('Nearly full. Look now.',true);if(p<G.prev)return say('Too far. The square is shrinking again.');return say('Bigger. Keep going.');}
 say('');
}
const fmtE=v=>v===0?'0':v>=.01?pc(v,v>=.1?0:1):(v*100).toPrecision(2)+'%';
function sync(){
 const d=S.d,e=eOf(S.eV);
 qa('#qsBoxes button,#qsQubits button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.n===S.N)));
 q('qsK').max=stepsMax();q('qsK').value=S.k;q('qsKO').textContent=S.k;q('qsEO').textContent=fmtE(e);
 /* Readouts always hold the live values, because challenges read them. */
 q('qsProb').textContent=(G.a[S.prize]**2*100).toFixed(1);
 q('qsFound').textContent=G.looked===S.prize&&G.pAt>.995?'sure':'not yet';
 let bigB=0,bigK=0;for(let k=0;k<=804;k+=2){const v=noisy(chance(BIG,k),BIG,k,e);if(v>bigB){bigB=v;bigK=k;}}
 q('qsBig').textContent=pc(bigB,bigB<.01?2:0);
 q('qsLid').textContent=S.lidOpen?'Seal the lid':'Open the lid';
 const seen=M.list.length,h=seen?M.list.filter(i=>i===S.prize).length:0,best=Object.entries(M.best[S.N]||{}).sort((a,b)=>b[1]-a[1])[0],top=bestSteps(S.N);
 q('qsRN').textContent=S.N;q('qsRG').textContent=pc(1/S.N,S.N>8?1:0);q('qsRF').textContent=seen&&shotAt===null?h+' of '+seen:'?';q('qsRB').textContent=best?best[1]+' at '+best[0]+(best[0]==='1'?' step':' steps'):'none yet';
 q('qsEq').innerHTML='P = sin²((2k + 1)θ) = '+pc(chance(S.N,S.k))+'<small>θ = asin(1/√N) = '+theta(S.N).toFixed(3)+', N = '+S.N+', k = '+S.k+'</small><small>Circuit: H on every qubit, then k × (check, mirror)</small>';
 const row=(l,a,c)=>'<tr><td>'+l+'</td><td>'+a+'</td><td>'+c+'</td></tr>';
 q('qsTb').innerHTML=row('Chance at '+S.k+(S.k===1?' step':' steps'),pc(noisy(chance(S.N,S.k),S.N,S.k,e)),pc(plain(S.N,S.k)))+row('Near-certain find, '+S.N+' boxes',top,S.N-1)+row('About a million boxes, typical','804','524,288');
 const p=pOf(S.pV),pl=logicalError(p,S.dist),nq=physicalQubits(S.dist),tk=bestSteps(S.N),found=noisy(chance(S.N,tk),S.N,tk,1-Math.pow(1-pl,OPS));
 q('qsPO').textContent=(p*100).toFixed(2)+'%';q('qsDO').textContent=S.dist;q('qsOQ').textContent=nq.toLocaleString('en-US');q('qsOL').textContent=pl>=.5?'1 in 2':'1 in '+Math.round(1/pl).toLocaleString('en-US');q('qsOF').textContent=pc(found,0);
 if(d===0)seeStatus();
 if(d===1){if(seen&&shotAt===null){const isBest=S.k===top;say('Found the prize '+h+' times in '+seen+'.'+(isBest?' Best step count for '+S.N+' boxes.'+(S.N<32?' Try another qubit.':''):S.k>top?' Too many steps pushes it back down.':' Try more steps.'),isBest);}else if(!seen)say('Pick a number of steps, then run.');else say('');}
 if(d===2)say('About a million boxes: best chance '+pc(bigB,bigB<.01?2:0)+(bigB>=.5?' after '+bigK+' steps. Half the time reached.':'. Clean it up.'),bigB>=.5);
 if(d===3){if(p>=THRESHOLD)say('Above the threshold, more copies add more mistakes than they fix.');else if(pl<=1e-6)say('Reliable enough for large algorithms, at '+nq.toLocaleString('en-US')+' raw qubits for each reliable one.',true);else say('Errors are falling. Add copies, or clean up the raw qubits.');}
 cv.setAttribute('aria-label',d===1&&!S.lidOpen?'A sealed row of '+S.N+' boxes'+(seen?' with shot counts':''):'Squares for '+S.N+' boxes. The prize box has a '+pc(tgt[S.prize]?tgt[S.prize]**2:0,0)+' chance');
}
function retarget(){setTarget(amps());sync();}
[4,8,16].forEach(n=>{const b=document.createElement('button');b.type='button';b.dataset.n=n;b.textContent=n;b.addEventListener('click',()=>{S.N=n;fresh();sync();});q('qsBoxes').appendChild(b);});
[2,3,4,5].forEach(k=>{const n=2**k,b=document.createElement('button');b.type='button';b.dataset.n=n;b.textContent=k;b.setAttribute('aria-label',k+' qubits, '+n+' boxes');b.addEventListener('click',()=>{S.N=n;newBoard();S.k=Math.min(S.k,stepsMax());retarget();});q('qsQubits').appendChild(b);});
const wiped=()=>{say('Looking wiped the squares. Start over.');};
q('qsFlip').addEventListener('click',()=>{if(G.looked!==null)return wiped();G.a=flip(G.a,S.prize);G.last='flip';setTarget(G.a);sync();});
q('qsMirror').addEventListener('click',()=>{if(G.looked!==null)return wiped();G.prev=G.a[S.prize]**2;const n=mirror(G.a),same=n.every((v,i)=>Math.abs(v-G.a[i])<1e-9);G.a=n;G.last=same?'still':'mirror';setTarget(G.a);sync();});
q('qsLook').addEventListener('click',()=>{if(G.looked!==null)return wiped();const p=G.a.map(v=>v*v);G.pAt=p[S.prize];G.looked=sample(p,rng());G.a=G.a.map((_,i)=>i===G.looked?1:0);setTarget(G.a);sync();});
q('qsReset').addEventListener('click',()=>{fresh();sync();});
q('qsK').addEventListener('input',e=>{S.k=+e.target.value;M.list=[];retarget();});
q('qsE').addEventListener('input',e=>{S.eV=+e.target.value;retarget();});
q('qsP').addEventListener('input',e=>{S.pV=+e.target.value;retarget();});
q('qsDist').addEventListener('input',e=>{S.dist=+e.target.value;retarget();});
q('qsShots').addEventListener('click',()=>{const p=run(S.N,S.k,S.prize).map(v=>v*v),r=rng();M.list=Array.from({length:100},()=>sample(p,r));const h=M.list.filter(i=>i===S.prize).length;M.best[S.N]=M.best[S.N]||{};M.best[S.N][S.k]=Math.max(M.best[S.N][S.k]||0,h);shotAt=performance.now();sync();kick();});
q('qsLid').addEventListener('click',()=>{S.lidOpen=!S.lidOpen;lidAnim={t0:performance.now(),from:lid,to:S.lidOpen?0:1};sync();kick();});
fresh();
function enter(d){
 S.d=d;if(d===0)fresh();
 if(d===1){S.lidOpen=false;newBoard();S.k=Math.min(S.k,1);lidAnim={t0:performance.now(),from:lid,to:1};}else lidAnim={t0:performance.now(),from:lid,to:0};
 if(d===3)S.k=bestSteps(S.N);
 depthAnim={t0:performance.now(),from:dt,to:d===2?1:0};if(d!==0)setTarget(amps());sync();kick();
}
const rail=depthLab(sec.querySelector('.depthlab'),enter);
if(rail.d>0){S.d=rail.d;dt=rail.d===2?1:0;if(rail.d===1){lid=1;newBoard();}if(rail.d===3)S.k=bestSteps(S.N);view=amps().slice();tgt=view.slice();A.on=false;}
sync();redraws.push(draw);new ResizeObserver(()=>draw()).observe(cv.parentElement);draw();
}
