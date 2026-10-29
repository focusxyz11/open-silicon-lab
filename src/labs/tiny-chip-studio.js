/* Lab: TINY CHIP STUDIO */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
import TC from '../engines/tinychip.js';
import { tableOf, makeALU } from '../engines/alu.js';
import { publishSlice } from '../app/alu-link.js';
export function init(){
(function tinyStudio(){
const root=$('#tiny');if(!root)return;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STEPS=['Spec','Write logic','Verify','Synthesize','Place & route','Masks','Fabricate','Test & ship'];
const KEY='sjl-tiny-v1';
const S={p:0,step:0,code:{},lib:'basic',opt:false,util:0.5,node:'130',sv:{},vecs:8,fabbed:false,tested:false,svOn:false};
try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&typeof j==='object'){if(j.code&&typeof j.code==='object')S.code=j.code;if(Number.isInteger(j.p)&&TC.PROJ[j.p])S.p=j.p;}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({code:S.code,p:S.p}));}catch(e){}};
const P=()=>TC.PROJ[S.p];
const code=()=>S.code[P().id]!==undefined?S.code[P().id]:P().starter;
let D=null,SY=null,PL=null,RT=null,FAB=null,TST=null;
function compile(){D=TC.parse(code(),P().ins,P().outs);SY=null;PL=null;RT=null;FAB=null;TST=null;S.fabbed=false;}
function synth(){if(!D||D.errs.length){SY=null;return;}if(!SY)SY=TC.synth(D,P().ins,P().outs,S.lib,S.opt,S.node);}
const V=()=>TC.vectors(P().ins);
const pub=()=>{if(P().id==='alu')publishSlice(code());};
publishSlice(S.code.alu!==undefined?S.code.alu:TC.PROJ.find(p=>p.id==='alu').starter);
const verify=()=>{if(!D||D.errs.length||!P().f)return null;let bad=0;const rows=V().map(v=>{const o=TC.evalDesign(D,v),e=P().f(v);const mis=P().outs.filter(k=>o[k]!==e[k]);if(mis.length)bad++;return {v,o,e,mis};});return {rows,bad};};

/* ---- stepper ---- */
const stepBox=$('#tcSteps');stepBox.innerHTML=STEPS.map((t,i)=>'<button type="button" data-i="'+i+'"><span>'+(i+1)+'</span>'+t+'</button>').join('');
stepBox.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.i)));
const ok=()=>D&&!D.errs.length;
function canEnter(i){if(i<=1)return true;if(!ok())return false;if(i>=5&&!(RT&&!RT.failed.length))return false;if(i>=7&&!S.fabbed)return false;return true;}
function go(i){if(!canEnter(i))return;S.step=i;render();const t=root.querySelector('.tiny');if(t&&t.getBoundingClientRect().top<0)t.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'});}
$('#tcBack').addEventListener('click',()=>go(Math.max(0,S.step-1)));
$('#tcNext').addEventListener('click',()=>{if(S.step===4&&!(RT&&!RT.failed.length)){runPR();return;}if(S.step===6&&!S.fabbed){runFab();return;}go(Math.min(7,S.step+1));});
function chrome(){const vr=verify();stepBox.querySelectorAll('button').forEach((b,i)=>{b.disabled=!canEnter(i);if(i===S.step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
  let d=false,w=false;if(i===0)d=true;if(i===1){d=ok();w=D&&D.errs.length>0;}if(i===2&&ok()){d=!vr||vr.bad===0;w=vr&&vr.bad>0;}if(i===3)d=!!SY;if(i===4)d=!!(RT&&!RT.failed.length);if(i===5)d=!!(RT&&!RT.failed.length)&&S.step>5;if(i===6)d=S.fabbed;if(i===7)d=!!TST;
  b.classList.toggle('done',d&&i<S.step);b.classList.toggle('warn',!!w);});
 root.querySelectorAll('.tpanel').forEach(p=>p.hidden=+p.dataset.p!==S.step);
 $('#tcBack').disabled=S.step===0;const nx=$('#tcNext');
 let hint='',label='Next →',dis=false;
 if(S.step===1&&!ok()){dis=true;hint='Fix the errors to continue.';}
 if(S.step===2&&vr&&vr.bad){hint='Your design has a bug. You can still continue, but your chip will be wrong.';}
 if(S.step===4&&!(RT&&!RT.failed.length)){label=PL?'Route again →':'Place and route →';}
 if(S.step===6&&!S.fabbed)label='Run the fab →';
 if(S.step===7){label='Done';dis=true;}
 nx.textContent=label;nx.disabled=dis;$('#tcHint').textContent=hint;
 $('#tcTag').textContent=P().t+' · step '+(S.step+1)+' of 8';}

/* ---- step 0: projects ---- */
const projBox=$('#tcProj');projBox.innerHTML=TC.PROJ.map((p,i)=>'<button type="button" data-i="'+i+'"><small>'+esc(p.lvl)+'</small><b>'+esc(p.t)+'</b></button>').join('');
projBox.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S.p=+b.dataset.i;S.sv={};save();compile();render();}));
function rSpec(){projBox.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===S.p?'true':'false'));const p=P();
 $('#tcSpec').innerHTML='<h3>'+esc(p.t)+'</h3><p>'+esc(p.d)+'</p><div class="pins"><div class="side">'+p.ins.map(n=>'<span>'+n+' →</span>').join('')+'</div><div class="chipbox">'+esc(p.t)+'</div><div class="side">'+p.outs.map(n=>'<span>→ '+n+'</span>').join('')+'</div></div><p class="small muted">Every real chip starts like this: a specification of inputs, outputs and exactly what the outputs must be. Here the specification is a truth table.</p>';
 if(p.f){const vs=V();$('#tcSpecTT').innerHTML='<p class="eyebrow" style="margin-bottom:6px">Specification: what the chip must do</p><div class="scroll"><table class="tt"><tr>'+p.ins.map(n=>'<th>'+n+'</th>').join('')+p.outs.map((n,k)=>'<th'+(k===0?' class="sep"':'')+'>'+n+'</th>').join('')+'</tr>'+vs.map(v=>{const e=p.f(v);return '<tr>'+p.ins.map(n=>'<td>'+v[n]+'</td>').join('')+p.outs.map((n,k)=>'<td'+(k===0?' class="sep"':'')+'>'+e[n]+'</td>').join('')+'</tr>';}).join('')+'</table></div>';}
 else $('#tcSpecTT').innerHTML='<div class="empty">No specification: you decide what the chip does.</div>';}

/* ---- step 1: code ---- */
const ta=$('#tcCode'),gut=$('#tcGut');
ta.addEventListener('input',()=>{S.code[P().id]=ta.value;save();pub();compile();rCode(true);chrome();});
ta.addEventListener('scroll',()=>{gut.scrollTop=ta.scrollTop;});
ta.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart;ta.setRangeText('  ',s,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'));}});
$('#tcResetCode').addEventListener('click',()=>{delete S.code[P().id];save();pub();compile();rCode();chrome();});
$('#tcSol').addEventListener('click',()=>{if(!P().sol)return;S.code[P().id]=P().sol;save();pub();compile();rCode();chrome();});
/* Other labs can open the studio on a project, e.g. the RISC-V lab's "design my ALU". */
document.addEventListener('click',e=>{const t=e.target.closest('[data-tiny-proj]');if(t)document.dispatchEvent(new CustomEvent('osl:tiny-open',{detail:{id:t.dataset.tinyProj,step:0}}));});
document.addEventListener('osl:tiny-open',e=>{const i=TC.PROJ.findIndex(p=>p.id===(e.detail&&e.detail.id));if(i<0)return;S.p=i;S.sv={};save();compile();S.step=Math.min(e.detail.step||0,1);render();});
$('#tcSvBtn').addEventListener('click',()=>{S.svOn=!S.svOn;rCode(true);});
function sv(){const p=P();const nm=p.id==='seg'?'seg_decoder':p.t.toLowerCase().replace(/[^a-z0-9]+/g,'_');const wires=D.order.filter(n=>!p.outs.includes(n));
 const ex=e=>{switch(e.op){case 'const':return "1'b"+e.v;case 'var':return e.n;case 'not':return '~'+ex(e.a);default:return '('+ex(e.a)+' '+{and:'&',or:'|',xor:'^'}[e.op]+' '+ex(e.b)+')';}};
 const strip=s=>s.replace(/^\((.*)\)$/,'$1');
 return '<span class="k">module</span> '+nm+' (\n  <span class="k">input  logic</span> '+p.ins.join(', ')+',\n  <span class="k">output logic</span> '+p.outs.join(', ')+'\n);\n'+(wires.length?'  <span class="k">logic</span> '+wires.join(', ')+';\n':'')+D.order.map(n=>'  <span class="k">assign</span> '+n+' = '+esc(strip(ex(D.asg[n].e)))+';').join('\n')+'\n<span class="k">endmodule</span>';}
function rCode(keep){const p=P();if(!keep||ta.value!==code())ta.value=code();const n=ta.value.split('\n').length;gut.textContent=Array.from({length:Math.max(n,8)},(_,i)=>i+1).join('\n');
 $('#tcFile').textContent=(p.id==='seg'?'seg_decoder':p.id)+'.tiny';$('#tcSol').hidden=!p.sol;
 const st=$('#tcStat');if(D.errs.length){st.className='pill ann';st.textContent=D.errs.length+(D.errs.length>1?' errors':' error');}else{st.className='pill ship';st.textContent='Compiles';}
 $('#tcErr').innerHTML=D.errs.map(e=>'<p><b>'+(e.l?'Line '+e.l:'Design')+'</b>'+esc(e.m)+'</p>').join('')+D.warns.map(w=>'<p class="w"><b>Note</b>'+esc(w)+'</p>').join('');
 const b=$('#tcSvBtn');b.setAttribute('aria-pressed',S.svOn?'true':'false');const pre=$('#tcSv');pre.hidden=!S.svOn||!!D.errs.length;if(!pre.hidden)pre.innerHTML=sv();}

/* ---- step 2: verify ---- */
const wave=$('#tcWave');
function rVerify(){const p=P(),vr=verify(),vs=V();const box=$('#tcVerRes');
 if(!p.f){box.innerHTML='<p class="code">No specification</p><p>Here is what your circuit does for every combination of inputs. With no specification, the only check is whether this is what you meant.</p>';}
 else if(!vr.bad)box.innerHTML='<p class="code">All '+vs.length+' cases pass</p><p>Your logic matches the specification for every possible input. That is <b>exhaustive verification</b>, possible here because there are only '+vs.length+' cases.</p>';
 else{const r=vr.rows.find(x=>x.mis.length);box.innerHTML='<p class="code" style="color:var(--bad)">Bug found: '+vr.bad+' of '+vs.length+' cases wrong</p><p>When '+p.ins.map(n=>n+' = '+r.v[n]).join(', ')+', output '+r.mis.map(k=>'<b>'+k+'</b> should be '+r.e[k]+' but is '+r.o[k]).join(', ')+'. Go back to step 2 and fix it'+(p.sol?', or use "Show a solution"':'')+'. Catching it now costs minutes; after fabrication it would cost a new set of masks.</p>';}
 const t=$('#tcTT');t.innerHTML='<tr>'+p.ins.map(n=>'<th>'+n+'</th>').join('')+p.outs.map((n,k)=>'<th'+(k===0?' class="sep"':'')+'>'+n+(p.f?' <small class="muted">expected / got</small>':'')+'</th>').join('')+'</tr>'+vs.map(v=>{const o=TC.evalDesign(D,v),e=p.f?p.f(v):null;return '<tr>'+p.ins.map(n=>'<td>'+v[n]+'</td>').join('')+p.outs.map((n,k)=>{const sep=k===0?' sep':'';if(!e)return '<td class="'+sep+'">'+o[n]+'</td>';const bad=o[n]!==e[n];return '<td class="'+(bad?'bad':'ok')+sep+'">'+e[n]+' / '+o[n]+'</td>';}).join('')+'</tr>';}).join('');
 $('#tcVerNote').textContent=(p.f?'Dashed lines show the expected outputs; shaded columns are cases where your design is wrong. ':'')+'In industry, exhaustive testing is impossible: a 64-bit adder has 2¹²⁹ input combinations. Verification teams, often larger than design teams, use random tests, coverage targets and mathematical proofs instead, and AI agents now write many of those tests.';
 drawWave();}
function drawWave(){if(!D||D.errs.length)return;const p=P(),vs=V();const sig=p.ins.concat(p.outs);const {ctx:c,w,h}=fit(wave);c.clearRect(0,0,w,h);const L=56,R=8,rowH=(h-24)/sig.length,X=k=>L+k/vs.length*(w-L-R);
 c.font='11px IBM Plex Mono, monospace';c.textBaseline='middle';
 vs.forEach((v,k)=>{if(!p.f)return;const o=TC.evalDesign(D,v),e=p.f(v);if(p.outs.some(n=>o[n]!==e[n])){c.fillStyle=rgba(T.bad,.14);c.fillRect(X(k),0,X(k+1)-X(k),h-20);}});
 sig.forEach((n,i)=>{const y0=6+i*rowH,hi=y0+rowH*0.15,lo=y0+rowH*0.75;const isOut=p.outs.includes(n);c.fillStyle=isOut?T.ink:T.muted;c.textAlign='left';c.fillText(n,6,(hi+lo)/2);
  if(isOut&&p.f){c.strokeStyle=rgba(T.muted,.7);c.setLineDash([3,3]);c.lineWidth=1.2;c.beginPath();vs.forEach((v,k)=>{const y=p.f(v)[n]?hi:lo;if(k===0)c.moveTo(X(0),y);else c.lineTo(X(k),y);c.lineTo(X(k+1),y);});c.stroke();c.setLineDash([]);}
  c.strokeStyle=isOut?T['amber-fill']:T.cyan;c.lineWidth=2;c.beginPath();vs.forEach((v,k)=>{const val=isOut?TC.evalDesign(D,v)[n]:v[n];const y=val?hi:lo;if(k===0)c.moveTo(X(0),y);else c.lineTo(X(k),y);c.lineTo(X(k+1),y);});c.stroke();});
 c.fillStyle=T.muted;c.textAlign='center';vs.forEach((v,k)=>{if(vs.length<=16||k%2===0)c.fillText(k,(X(k)+X(k+1))/2,h-8);});
 }
watch(wave,()=>{if(S.step===2)drawWave();});

/* ---- step 3: synthesis + schematic ---- */
$('#tcLib').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S.lib=b.dataset.l;SY=null;PL=null;RT=null;S.fabbed=false;TST=null;rSynth();chrome();}));
$('#tcOpt').addEventListener('change',e=>{S.opt=e.target.checked;SY=null;PL=null;RT=null;S.fabbed=false;TST=null;rSynth();chrome();});
const sch=$('#tcSch');let hits=[];
sch.addEventListener('click',e=>{const r=sch.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const h=hits.find(q=>x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1);if(h){S.sv[h.n]=S.sv[h.n]?0:1;drawSch();if(S.step===7)rGadget();}});
const fmtF=m=>m>=1000?(m/1000).toFixed(2)+' GHz':Math.round(m)+' MHz';
function rSynth(){synth();if(!SY)return;$('#tcLib').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===S.lib?'true':'false'));$('#tcOpt').checked=S.opt;
 const st=SY.st;$('#tcCells').textContent=st.cells;$('#tcTr').textContent=st.tr;$('#tcDepth').textContent=st.depth;$('#tcFmax').textContent=fmtF(st.fmax)+' at '+TC.NODE[S.node].t;
 const types={};SY.M.cells.forEach(c=>types[c.type]=(types[c.type]||0)+1);
 let t='Synthesis turned your '+D.order.length+' line'+(D.order.length>1?'s':'')+' into '+st.cells+' cells from the library: '+Object.entries(types).map(([k,n])=>n+' '+k).join(', ')+'. ';
 if(S.lib==='nand')t+='Every logic function can be built from NAND gates alone, but it takes more of them: compare the transistor count with standard cells. ';
 else if(types.NAND2||types.NOR2||types.XNOR2)t+='Where a NOT followed an AND, OR or XOR, the tool merged them into one inverting cell (NAND, NOR or XNOR), which uses fewer transistors. ';
 if(S.opt&&SY.alt)t+=SY.used==='sop'?'The optimizer found a smaller circuit ('+SY.alt.sop+' instead of '+SY.alt.yours+' transistors) by rewriting your logic as a minimized sum of products, so it used that. ':'The optimizer tried rewriting your logic as a minimized sum of products ('+SY.alt.sop+' transistors) but your structure ('+SY.alt.yours+') was already better, so it kept yours. Sharing wires like p = a ^ b is something tools are good at too. ';
 t+='Real synthesis tools do this for billions of gates, trading speed, power and area as they go.';$('#tcSynTxt').textContent=t;drawSch();}
function gate(c,type,x,y,w,h,col){const bub=['INV','NAND2','NOR2','XNOR2'].includes(type);c.beginPath();const bw=bub?w-7:w;
 if(type==='INV'||type==='BUF'){c.moveTo(x,y);c.lineTo(x+bw,y+h/2);c.lineTo(x,y+h);c.closePath();}
 else if(type==='AND2'||type==='NAND2'){c.moveTo(x,y);c.lineTo(x+bw-h/2,y);c.arc(x+bw-h/2,y+h/2,h/2,-Math.PI/2,Math.PI/2);c.lineTo(x,y+h);c.closePath();}
 else if(type.startsWith('OR')||type.startsWith('NOR')||type.startsWith('X')){c.moveTo(x,y);c.quadraticCurveTo(x+bw*0.6,y,x+bw,y+h/2);c.quadraticCurveTo(x+bw*0.6,y+h,x,y+h);c.quadraticCurveTo(x+bw*0.3,y+h/2,x,y);c.closePath();}
 else{c.rect(x,y,bw,h);}
 c.fillStyle=T.surface;c.fill();c.strokeStyle=col;c.lineWidth=1.8;c.stroke();
 if(type.startsWith('X')){c.beginPath();c.moveTo(x-5,y);c.quadraticCurveTo(x+bw*0.3-5,y+h/2,x-5,y+h);c.stroke();}
 if(bub){c.beginPath();c.arc(x+w-3.5,y+h/2,3.5,0,7);c.fillStyle=T.surface;c.fill();c.stroke();}
 if(type.startsWith('TIE')){c.fillStyle=T.ink;c.font='600 11px IBM Plex Mono, monospace';c.textAlign='center';c.fillText(type==='TIE1'?'1':'0',x+bw/2,y+h/2+1);}}
function drawSch(){if(!SY)return;const M=SY.M,p=P();const lvl={},drvCell={};M.inputs.forEach(i=>lvl[i.net]=0);M.cells.forEach((c,ci)=>drvCell[c.out]=ci);
 const L=n=>{if(lvl[n]!==undefined)return lvl[n];const c=M.cells[drvCell[n]];lvl[n]=1+Math.max(0,...c.ins.map(L));return lvl[n];};M.cells.forEach(c=>L(c.out));
 const maxL=Math.max(1,...M.cells.map(c=>lvl[c.out]));const cols=[];for(let k=0;k<=maxL;k++)cols.push([]);M.cells.forEach((c,ci)=>cols[lvl[c.out]].push(ci));
 const maxCol=Math.max(p.ins.length,p.outs.length,...cols.map(x=>x.length));const hh=Math.max(220,Math.min(640,maxCol*52+40));sch.style.height=hh+'px';
 const {ctx:c,w,h}=fit(sch);c.clearRect(0,0,w,h);const left=70,right=80,gw=Math.min(48,Math.max(30,(w-left-right)/(maxL+1)*0.45)),gh=Math.min(30,(h-30)/maxCol*0.6);
 const colX=k=>left+(k-0.5)*((w-left-right)/maxL)-gw/2;const pos={};
 M.inputs.forEach((i,k)=>pos[i.net]={x:left-18,y:(k+1)*h/(M.inputs.length+1)});
 /* order each column by barycenter of inputs */
 for(let k=1;k<=maxL;k++){const col=cols[k];col.forEach((ci,j)=>{const cc=M.cells[ci];const ys=cc.ins.map(n=>pos[n]?pos[n].y:h/2);cc._b=ys.length?ys.reduce((a,b)=>a+b,0)/ys.length:h/2+j;});col.sort((a,b)=>M.cells[a]._b-M.cells[b]._b);
  col.forEach((ci,j)=>{const cc=M.cells[ci];const y=(j+1)*h/(col.length+1);pos[cc.out]={x:colX(k)+gw,y,cx:colX(k),ci};});}
 const val=TC.simCells(M,Object.fromEntries(p.ins.map(n=>[n,S.sv[n]?1:0]))).val;
 const wire=(x1,y1,x2,y2,v)=>{c.strokeStyle=v?T['amber-fill']:rgba(T.muted,.6);c.lineWidth=v?2.4:1.4;c.beginPath();c.moveTo(x1,y1);const mx=(x1+x2)/2;c.bezierCurveTo(mx,y1,mx,y2,x2,y2);c.stroke();};
 M.cells.forEach(cc=>{const q=pos[cc.out];const n=cc.ins.length;cc.ins.forEach((src,k)=>{const sp=pos[src];const py=n===1?q.y:q.y-gh*0.25+k*gh*0.5;wire(sp.x,sp.y,q.cx-(cc.type.startsWith('X')?5:0),py,val[src]);});});
 const ox=w-right+18;M.outs.forEach((o,k)=>{const y=(k+1)*h/(M.outs.length+1);const sp=pos[o.net];wire(sp.x,sp.y,ox-10,y,val[o.net]);pos['out'+k]={y};});
 M.cells.forEach(cc=>{const q=pos[cc.out];gate(c,cc.type,q.cx,q.y-gh/2,gw,gh,val[cc.out]?T.amber:T.ink);c.fillStyle=T.muted;c.font='9px IBM Plex Mono, monospace';c.textAlign='center';c.fillText(cc.type,q.cx+gw/2,q.y+gh/2+10);});
 hits=[];c.font='600 12px IBM Plex Mono, monospace';M.inputs.forEach(i=>{const q=pos[i.net],v=val[i.net];c.fillStyle=v?T['amber-fill']:T.surface;c.strokeStyle=T.ink;c.lineWidth=1.5;c.beginPath();c.roundRect?c.roundRect(6,q.y-11,40,22,11):c.rect(6,q.y-11,40,22);c.fill();c.stroke();c.fillStyle=T.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(i.name+'='+v,26,q.y+1);hits.push({n:i.name,x0:4,x1:50,y0:q.y-14,y1:q.y+14});});
 M.outs.forEach((o,k)=>{const y=pos['out'+k].y,v=val[o.net];c.fillStyle=v?T['amber-fill']:T.sunk;c.beginPath();c.arc(ox,y,9,0,7);c.fill();c.strokeStyle=T.ink;c.stroke();c.fillStyle=T.ink;c.textAlign='left';c.fillText(o.name+'='+v,ox+14,y+1);});c.textBaseline='alphabetic';}
watch(sch,()=>{if(S.step===3)drawSch();});

/* ---- step 4: place & route ---- */
const lay=$('#tcLay'),utilI=$('#tcUtil');let snapPos=null,animT=0;
utilI.addEventListener('input',()=>{S.util=+utilI.value;$('#tcUtilO').textContent=Math.round(S.util*100)+'% of the core';PL=null;RT=null;S.fabbed=false;TST=null;rPR();chrome();});
$('#tcPR').addEventListener('click',runPR);
const TYC={INV:'#8fa3b3',BUF:'#8fa3b3',NAND2:'#9b8ce0',NOR2:'#c58ab3',AND2:'#7f9fe0',OR2:'#d6a35a',XOR2:'#5fb7a8',XNOR2:'#5fb7a8',TIE0:'#aaa',TIE1:'#aaa'};
function runPR(){synth();if(!SY)return;clearInterval(animT);PL=TC.place(SY.M,S.util,7+S.p);RT=null;const frames=[];PL.anneal(Math.min(6000,400+SY.M.cells.length*160),(snap,cost)=>frames.push([snap,cost]));const finalPos=PL.snapshot();
 if(RM||!frames.length){snapPos=null;RT=TC.route(PL);rPR();chrome();return;}
 let k=0;$('#tcPRTxt').textContent='Placing: simulated annealing swaps cells to shorten the wires…';animT=setInterval(()=>{if(k>=frames.length){clearInterval(animT);snapPos=null;Object.assign(PL.pos,finalPos);RT=TC.route(PL);rPR();chrome();return;}snapPos=frames[k][0];drawLay(frames[k][1]);k++;},45);}
function rPR(){$('#tcUtil').value=S.util;$('#tcUtilO').textContent=Math.round(S.util*100)+'% of the core';const nd=TC.NODE[S.node];
 if(!PL){$('#tcCore').textContent='–';$('#tcWl').textContent='–';$('#tcVia').textContent='–';$('#tcFail').textContent='–';$('#tcPRTxt').textContent='Press "Place and route". The placer arranges your '+(SY?SY.M.cells.length:'')+' cells in rows, then the router draws metal wires on two layers: horizontal on metal 2 and vertical on metal 3, joined by vias.';drawLay();return;}
 const wum=(PL.GW*nd.site[0]),hum=(PL.H/3*nd.site[1]);$('#tcCore').textContent=wum.toFixed(1)+' × '+hum.toFixed(1)+' µm';
 if(RT){$('#tcWl').textContent=Math.round(RT.wl*nd.site[0]*1.2)+' µm';$('#tcVia').textContent=RT.vias;$('#tcFail').textContent=RT.failed.length;
  $('#tcPRTxt').textContent=RT.failed.length?RT.failed.length+' connection'+(RT.failed.length>1?'s':'')+' could not be routed (dashed red): the cells are packed too tightly to leave room for wires. Lower the packing density and try again. Real routers face the same trade-off: denser layouts are smaller and cheaper but can become impossible to wire.':'Every connection is routed and the layout passes the design-rule check. Your whole circuit is '+wum.toFixed(1)+' × '+hum.toFixed(1)+' µm at '+nd.t+', '+(Math.max(wum,hum)<70?'smaller than the width of a human hair.':'about the width of a human hair.')+' A big GPU places tens of billions of cells this way, which is why placement and routing use some of the most powerful software and AI in chip design.';}
 drawLay();}
function drawLay(cost){const {ctx:c,w,h}=fit(lay);c.clearRect(0,0,w,h);if(!PL){c.fillStyle=T.muted;c.font='13px IBM Plex Sans, sans-serif';c.textAlign='center';c.fillText('No layout yet',w/2,h/2);$('#tcLayLeg').innerHTML='';return;}
 const s=Math.min((w-80)/PL.GW,(h-24)/PL.H),ox=(w-PL.GW*s)/2,oy=(h-PL.H*s)/2;const X=x=>ox+x*s,Y=y=>oy+y*s;const pos=snapPos||PL.pos;
 c.fillStyle=rgba(T.muted,.08);c.fillRect(X(0),Y(0),PL.GW*s,PL.H*s);
 for(let r=0;r<PL.rows;r++){c.fillStyle=r%2?rgba(T.muted,.07):rgba(T.muted,.13);c.fillRect(X(2),Y(r*PL.TR+1),(PL.GW-4)*s,3*s);c.fillStyle=rgba(T.violet,.35);c.fillRect(X(2),Y(r*PL.TR+1)-0.5,(PL.GW-4)*s,1);}
 const M=SY.M;M.cells.forEach((cc,ci)=>{const p=pos[ci];if(!p)return;c.fillStyle=TYC[cc.type];c.globalAlpha=.75;c.fillRect(X(2+p.x)+1,Y(p.r*PL.TR+1)+1,p.w*s-2,3*s-2);c.globalAlpha=1;if(p.w*s>26){c.fillStyle='#10202a';c.font='600 '+Math.max(8,Math.min(11,s*0.9))+'px IBM Plex Mono, monospace';c.textAlign='center';c.fillText(cc.type.replace('2',''),X(2+p.x+p.w/2),Y(p.r*PL.TR+2.5)+3);}});
  if(!RT||snapPos){const P2=PL.netPins(snapPos);c.strokeStyle=rgba(T.amber,.5);c.lineWidth=1;Object.values(P2).forEach(L=>{if(L.length<2)return;const d=L[0];L.slice(1).forEach(q=>{c.beginPath();c.moveTo(X(d.x+.5),Y(d.y+.5));c.lineTo(X(q.x+.5),Y(q.y+.5));c.stroke();});});
  c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.textAlign='left';c.fillText(cost!==undefined?'estimated wire length '+cost:'straight lines show which pins must connect',X(0),oy-6>8?oy-6:12);}
 else{Object.entries(RT.paths).forEach(([n,segs])=>segs.forEach(path=>{for(let k=1;k<path.length;k++){const a=path[k-1],b=path[k];const la=a%2,lb=b%2;const ca=(a-la)/2,cb=(b-lb)/2;const ax=ca%PL.GW,ay=(ca-ax)/PL.GW,bx=cb%PL.GW,by=(cb-bx)/PL.GW;
   if(la!==lb){c.fillStyle=T.ink;c.fillRect(X(ax+.5)-s*.18,Y(ay+.5)-s*.18,s*.36,s*.36);continue;}c.strokeStyle=la===0?T.cyan:T.violet;c.lineWidth=Math.max(1.5,s*0.32);c.lineCap='round';c.beginPath();c.moveTo(X(ax+.5),Y(ay+.5));c.lineTo(X(bx+.5),Y(by+.5));c.stroke();}}));
  RT.failed.forEach(n=>{const L=RT.P[n];const d=L[0];c.strokeStyle=T.bad;c.setLineDash([4,3]);c.lineWidth=1.5;L.slice(1).forEach(q=>{c.beginPath();c.moveTo(X(d.x+.5),Y(d.y+.5));c.lineTo(X(q.x+.5),Y(q.y+.5));c.stroke();});c.setLineDash([]);});}
 c.font='600 10px IBM Plex Mono, monospace';Object.entries(PL.ioIn).forEach(([n,p])=>{const nm=M.inputs.find(i=>i.net===+n).name;c.fillStyle=T['amber-fill'];c.fillRect(X(p.x),Y(p.y),s,s);c.fillStyle=T.ink;c.textAlign='right';c.fillText(nm,X(p.x)-3,Y(p.y+.75));});
 Object.entries(PL.ioOut).forEach(([n,p])=>{c.fillStyle=T['amber-fill'];c.fillRect(X(p.x),Y(p.y),s,s);c.fillStyle=T.ink;c.textAlign='left';c.fillText(n,X(p.x+1)+3,Y(p.y+.75));});
 $('#tcLayLeg').innerHTML='<span><i style="background:'+T.cyan+'"></i>Metal 2 (horizontal)</span><span><i style="background:'+T.violet+'"></i>Metal 3 (vertical)</span><span><i style="background:'+T.ink+'"></i>Via</span><span><i style="background:'+T['amber-fill']+'"></i>Input/output pin</span><span><i style="background:#9b8ce0;opacity:.75"></i>Logic cells</span>';}
watch(lay,()=>{if(S.step===4)drawLay();});

/* ---- step 5: masks ---- */
const LAYERS=[['diff','Active areas','Where transistors will be: the silicon not covered by insulating oxide.','#5fae6e'],['poly','Polysilicon gates','The gates of every transistor. The finest lines on the chip.','#d9584a'],['cont','Contacts','Holes that connect transistors to the first metal layer.','#555555'],['m1','Metal 1','Power rails and the wiring inside each cell.','#4a7fd9'],['v1','Via 1','Vertical links from metal 1 up to metal 2.','#333333'],['m2','Metal 2','Your horizontal routing wires.','#2aa5b5'],['v2','Via 2','Vertical links between metal 2 and metal 3.','#222222'],['m3','Metal 3','Your vertical routing wires.','#8b6fe0']];
let selL=1;
$('#tcNode').innerHTML=Object.entries(TC.NODE).map(([k,n])=>'<button type="button" data-n="'+k+'">'+n.t+'</button>').join('');
$('#tcNode').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S.node=b.dataset.n;SY=null;synth();S.fabbed=false;TST=null;rMask();chrome();}));
const lyBox=$('#tcLayers');lyBox.innerHTML=LAYERS.map((l,i)=>'<button type="button" data-i="'+i+'"><i style="background:'+l[3]+'"></i><span><b>Mask '+(i+1)+' · '+l[1]+'</b><small>'+l[2]+'</small></span></button>').join('');
lyBox.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selL=+b.dataset.i;rMask();}));
function geo(){const g={diff:[],poly:[],cont:[],m1:[],v1:[],m2:[],v2:[],m3:[]};const M=SY.M;
 for(let r=0;r<PL.rows;r++){g.m1.push([2,r*PL.TR+1,PL.GW-4,0.25]);g.m1.push([2,r*PL.TR+3.75,PL.GW-4,0.25]);}
 M.cells.forEach((cc,ci)=>{const p=PL.pos[ci];const x=2+p.x,y=p.r*PL.TR+1;g.diff.push([x+.2,y+.45,p.w-.4,.8]);g.diff.push([x+.2,y+1.75,p.w-.4,.8]);const n=Math.max(1,TC.LIB[cc.type][0]/2);for(let k=0;k<n;k++){const px=x+(k+0.5)*p.w/n-0.08;g.poly.push([px,y+.25,.16,2.5]);}});
 const P2=PL.netPins();Object.values(P2).forEach(L=>L.forEach(q=>{if(q.x===0||q.x===PL.GW-1)return;g.cont.push([q.x+.3,q.y+.3,.4,.4]);g.m1.push([q.x+.2,q.y+.1,.6,.8]);g.v1.push([q.x+.3,q.y+.3,.4,.4]);}));
 Object.values(RT.paths).forEach(segs=>segs.forEach(path=>{for(let k=1;k<path.length;k++){const a=path[k-1],b=path[k];const la=a%2,lb=b%2,ca=(a-la)/2,cb=(b-lb)/2;const ax=ca%PL.GW,ay=(ca-ax)/PL.GW,bx=cb%PL.GW,by=(cb-bx)/PL.GW;
  if(la!==lb){g.v2.push([ax+.3,ay+.3,.4,.4]);continue;}const x0=Math.min(ax,bx),y0=Math.min(ay,by);if(la===0)g.m2.push([x0+.35,y0+.35,Math.abs(bx-ax)+.3,.3]);else g.m3.push([x0+.35,y0+.35,.3,Math.abs(by-ay)+.3]);}}));
 return g;}
const mcv=$('#tcMask');
function rMask(){$('#tcNode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.n===S.node?'true':'false'));lyBox.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===selL?'true':'false'));
 const nd=TC.NODE[S.node];if(!PL)return;const wum=PL.GW*nd.site[0],hum=PL.H/3*nd.site[1];
 $('#tcMasks').textContent='about '+nd.masks;$('#tcMaskCost').textContent=nd.mask$>=1?'$'+nd.mask$+' million':'$'+Math.round(nd.mask$*1000)+'k';$('#tcArea').textContent=(wum*hum).toFixed(wum*hum<10?2:0)+' µm²';$('#tcHow').textContent=nd.shuttle?'Shared shuttle':'Full mask set only';
 let t='Your layout splits into one pattern per layer, and each pattern becomes a photomask: a quartz plate printed 4× larger than the chip. Here are the 8 main layers of your design; a real '+nd.t+' process uses about '+nd.masks+' masks, because each transistor also needs wells, implants and spacer layers. ';
 t+=nd.shuttle?'Nobody buys a full mask set for a circuit this small. Universities, startups and hobbyists share a <b>multi-project wafer</b> ("shuttle"): hundreds of designs are tiled onto one set of masks and split the cost. Programs such as Tiny Tapeout let students put designs like yours on real 130 nm-class chips.':'There are no low-cost shuttles for 3 nm in practice: a full mask set costs tens of millions of dollars, so only big companies tape out here. Your tiny circuit would be lost in a single corner of one chip.';
 $('#tcMaskTxt').innerHTML=t;drawMask();}
function drawMask(){if(!PL||!RT)return;const g=geo();const {ctx:c,w,h,d}=fit(mcv);c.clearRect(0,0,w,h);const k=Math.min((w-40)/(PL.GW*0.866+PL.H*0.866),(h-40)/(PL.GW*0.5+PL.H*0.5+LAYERS.length*2.2)*0.9);
 const ox=20+PL.H*0.866*k,dz=Math.min(26,(h-40-(PL.GW+PL.H)*0.5*k)/(LAYERS.length-1));const baseY=h-20-(PL.GW+PL.H)*0.5*k;
 LAYERS.forEach((L,i)=>{const z=i*dz;const on=i===selL;c.setTransform(d*k*0.866,d*k*0.5,-d*k*0.866,d*k*0.5,d*ox,d*(baseY-z));
  c.fillStyle=on?rgba(T.surface,.92):rgba(T.surface,.25);c.fillRect(0,0,PL.GW,PL.H);c.strokeStyle=on?T.ink:rgba(T.muted,.5);c.lineWidth=1/k;c.strokeRect(0,0,PL.GW,PL.H);
  c.fillStyle=L[3];c.globalAlpha=on?1:0.35;g[L[0]].forEach(r=>c.fillRect(r[0],r[1],r[2],r[3]));c.globalAlpha=1;
  c.setTransform(d,0,0,d,0,0);});
 const L=LAYERS[selL];c.fillStyle=T.ink;c.font='600 12px IBM Plex Sans, sans-serif';c.textAlign='left';c.fillText('Mask '+(selL+1)+': '+L[1],10,18);}
watch(mcv,()=>{if(S.step===5)drawMask();});

/* ---- step 6: fab ---- */
const xs=$('#tcXs'),wf=$('#tcWaf');let fabT=0,fabProg=0;
const MOD=[['Isolation & wells',0.12],['Transistor gates',0.3],['Source & drain implants',0.42],['Contacts',0.5],['Metal 1',0.6],['Via 1 + metal 2',0.75],['Via 2 + metal 3',0.9],['Passivation & pads',1]];
const OPS=['deposit','coat resist','expose through mask','develop','etch','strip & clean','inspect'];
$('#tcFabGo').addEventListener('click',runFab);
function runFab(){if(!RT||RT.failed.length)return;clearInterval(fabT);const nd=TC.NODE[S.node];fabProg=0;S.fabbed=false;TST=null;
 if(RM){fabProg=1;finishFab();return;}fabT=setInterval(()=>{fabProg=Math.min(1,fabProg+0.006);drawFab();if(fabProg>=1){clearInterval(fabT);finishFab();}},30);chrome();}
function finishFab(){const nd=TC.NODE[S.node];const die=nd.shuttle?(S.node==='28'?858:400):100;/* mm2 */const R=nd.wafer/2;const side=Math.sqrt(die);let n=0;for(let x=-R;x<R;x+=side)for(let y=-R;y<R;y+=side){const cx=x+side/2,cy=y+side/2;if(Math.hypot(Math.max(Math.abs(x),Math.abs(x+side)),Math.max(Math.abs(y),Math.abs(y+side)))<=R-3)n++;}
 FAB={die,dies:n,side,R};S.fabbed=true;drawFab();rFab();chrome();}
function rFab(){const nd=TC.NODE[S.node];const days=nd.masks*nd.days;$('#tcFabT').textContent='about '+Math.round(days/7)+' weeks';$('#tcFabW').textContent=nd.wafer+' mm';
 $('#tcFabD').textContent=FAB?FAB.dies.toLocaleString('en-US'):'–';$('#tcFabC').textContent=FAB?FAB.dies.toLocaleString('en-US')+' on this wafer':'–';
 $('#tcFabStep').textContent=S.fabbed?'Wafer finished':fabProg>0?'Processing…':'';
 $('#tcFabTxt').textContent='Each of the '+nd.masks+' mask layers repeats the same loop: deposit a film, coat it with resist, expose it through the mask, develop, etch or implant, strip and inspect. At about '+nd.days+' days per layer, the wafer spends roughly '+Math.round(days/7)+' weeks in the fab. '+(nd.shuttle?'On a shuttle, the masks hold hundreds of designs side by side. Each exposure of the scanner prints one copy of all of them, so this wafer carries one copy of your chip per exposure field. Shuttle customers usually receive a few dozen packaged samples.':'At 3 nm you would pay for the whole mask set and wafer yourself; here your circuit is drawn as if it were a full 10 × 10 mm chip, and one 300 mm wafer costs tens of thousands of dollars.');}
function drawFab(){const nd=TC.NODE[S.node];let c,w,h;({ctx:c,w,h}=fit(xs));c.clearRect(0,0,w,h);const pr=S.fabbed?1:fabProg;
 const mi=Math.min(nd.masks,Math.floor(pr*nd.masks)+1),mod=MOD.find(m=>pr<=m[1])||MOD[MOD.length-1],op=OPS[Math.floor(pr*nd.masks*OPS.length)%OPS.length];
 c.fillStyle=T.ink;c.font='600 12px IBM Plex Sans, sans-serif';c.textAlign='left';c.fillText(S.fabbed?'Finished: '+nd.masks+' mask layers':'Mask '+mi+' of '+nd.masks+': '+mod[0],10,18);c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText(S.fabbed?'cross-section of one transistor pair':op,10,34);
 const by=h-30,bx=20,bw=w-40;c.fillStyle='#8b96a0';c.fillRect(bx,by-40,bw,60);
 const st=k=>pr>=MOD[k][1]-0.001||pr>(k?MOD[k-1][1]:0);
 if(st(0)){c.fillStyle='#c9d6dd';[0.02,0.48,0.94].forEach(f=>c.fillRect(bx+bw*f,by-40,bw*0.04,22));c.fillStyle=rgba(T.cyan,.35);c.fillRect(bx+bw*0.06,by-40,bw*0.42,34);c.fillStyle=rgba(T['amber-fill'],.35);c.fillRect(bx+bw*0.52,by-40,bw*0.42,34);}
 const gates=[0.27,0.73];if(st(1)){c.fillStyle='#d9584a';gates.forEach(f=>c.fillRect(bx+bw*f-8,by-62,16,22));c.fillStyle='#e7eef2';gates.forEach(f=>c.fillRect(bx+bw*f-9,by-42,18,2));}
 if(st(2)){c.fillStyle=rgba(T.violet,.55);gates.forEach(f=>{c.fillRect(bx+bw*f-34,by-40,22,8);c.fillRect(bx+bw*f+12,by-40,22,8);});}
 const ild=(y0,hh)=>{c.fillStyle=rgba(T.sunk,.9);c.fillRect(bx,y0,bw,hh);};
 if(st(3)){ild(by-90,50);c.fillStyle='#555';gates.forEach(f=>{c.fillRect(bx+bw*f-26,by-90,6,50);c.fillRect(bx+bw*f+20,by-90,6,50);});}
 if(st(4)){c.fillStyle='#4a7fd9';gates.forEach(f=>{c.fillRect(bx+bw*f-34,by-100,22,10);c.fillRect(bx+bw*f+12,by-100,22,10);});}
 if(st(5)){ild(by-140,40);c.fillStyle='#333';c.fillRect(bx+bw*0.27+18,by-140,6,40);c.fillRect(bx+bw*0.73-26,by-140,6,40);c.fillStyle='#2aa5b5';c.fillRect(bx+bw*0.27+10,by-150,bw*0.46-18,10);}
 if(st(6)){ild(by-190,40);c.fillStyle='#222';c.fillRect(bx+bw*0.5-3,by-190,6,40);c.fillStyle='#8b6fe0';c.fillRect(bx+bw*0.5-8,by-215,16,25);}
 if(st(7)){c.fillStyle=rgba(T.muted,.4);c.fillRect(bx,by-222,bw,7);c.fillStyle='#d6b35a';c.fillRect(bx+bw*0.5-24,by-228,48,7);}
 if(!S.fabbed&&pr>0){const yy=pr<0.5?by-60:by-60-(pr-0.5)*300;c.strokeStyle=rgba(T.amber,.6);c.setLineDash([4,4]);c.beginPath();c.moveTo(bx,Math.max(44,yy));c.lineTo(bx+bw,Math.max(44,yy));c.stroke();c.setLineDash([]);}
 c.fillStyle=T.muted;c.textAlign='right';c.fillText('silicon wafer',bx+bw,by+14);
 /* wafer */({ctx:c,w,h}=fit(wf));c.clearRect(0,0,w,h);const r=Math.min(w,h)/2-14,cx=w/2,cy=h/2+4;c.fillStyle=pr>0?rgba(T.violet,.12+0.25*pr):rgba(T.muted,.2);c.beginPath();c.arc(cx,cy,r,0,7);c.fill();c.strokeStyle=T.muted;c.stroke();
 if(FAB||pr>0){const die=TC.NODE[S.node].shuttle?(S.node==='28'?858:400):100;const R=nd.wafer/2,side=Math.sqrt(die),sc=r/R;c.strokeStyle=rgba(T.ink,.25);c.lineWidth=0.6;for(let x=-R;x<R;x+=side)for(let y=-R;y<R;y+=side){if(Math.hypot(Math.max(Math.abs(x),Math.abs(x+side)),Math.max(Math.abs(y),Math.abs(y+side)))>R-3)continue;if(side*sc>2){c.fillStyle=rgba(T['cyan-fill'],0.2+0.5*pr);c.fillRect(cx+x*sc,cy+y*sc,side*sc-0.6,side*sc-0.6);}}}
 c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.textAlign='center';c.fillText(nd.wafer+' mm wafer'+(S.fabbed?' · '+FAB.dies+' dies':''),cx,12);if(!S.fabbed)rFab();}
watch(xs,()=>{if(S.step===6)drawFab();});watch(wf,()=>{if(S.step===6)drawFab();});

/* ---- step 7: test, package, run ---- */
const pcv=$('#tcProbe'),vecI=$('#tcVec');vecI.addEventListener('input',()=>{S.vecs=+vecI.value;TST=null;rTest();});
function rTest(){const vs=V();vecI.max=vs.length;if(S.vecs>vs.length||S.vecs<1)S.vecs=vs.length;vecI.value=S.vecs;$('#tcVecO').textContent=S.vecs+' of '+vs.length;
 if(!TST){/* fixed shuffled order of vectors */const r=rng(13+S.p);const order=vs.map((v,i)=>[r(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);const F=TC.faults(SY.M,order);
  const r2=rng(99+S.p);const dies=Math.min(FAB.dies,260);const res=[];for(let i=0;i<dies;i++){if(r2()<0.25){const f=Math.floor(r2()*F.F.length);const det=F.detected[f];res.push(det>=0&&det<S.vecs?'caught':'escape');}else res.push('good');}
  const cov=F.detected.filter(x=>x>=0&&x<S.vecs).length/F.F.length;const covFull=F.detected.filter(x=>x>=0).length/F.F.length;TST={res,cov,covFull,dies};}
 const n={good:0,caught:0,escape:0};TST.res.forEach(x=>n[x]++);const scale=1;
 $('#tcCov').textContent=Math.round(TST.cov*100)+'%';$('#tcGood').textContent=Math.round(n.good*scale).toLocaleString('en-US');$('#tcCaught').textContent=Math.round(n.caught*scale).toLocaleString('en-US');$('#tcEsc').textContent=Math.round(n.escape*scale).toLocaleString('en-US');
 let tt='A probe card touches each copy and runs your test patterns. To make testing visible, about one copy in four has a defect inside your circuit, far more than reality. Each defect is modelled as a wire stuck at 0 or 1. ';
 if(TST.cov<TST.covFull-1e-9)tt+='With only '+S.vecs+' pattern'+(S.vecs>1?'s':'')+', '+Math.round((TST.covFull-TST.cov)*100)+'% of possible faults go unnoticed'+(n.escape?', and '+n.escape+' faulty chip'+(n.escape>1?'s':'')+' passed and would reach customers.':'. None escaped on this wafer, but some will on others.')+' Real test engineers balance coverage against tester time, which costs money every second.';
 else tt+='Your patterns detect every fault that can change an output'+(n.escape?'':'')+', so no bad chip escapes.';
 if(TST.covFull<0.999)tt+=' Some stuck wires can never change an output: that logic is redundant, and test tools flag it.';
 $('#tcTestTxt').textContent=tt;
 drawProbe();rGadget();rReport();}
function drawProbe(){const {ctx:c,w,h}=fit(pcv);c.clearRect(0,0,w,h);const r=Math.min(w,h)/2-10,cx=w/2,cy=h/2;c.fillStyle=rgba(T.muted,.15);c.beginPath();c.arc(cx,cy,r,0,7);c.fill();
 const N=TST.dies,cols=Math.ceil(Math.sqrt(N*4/Math.PI))+1,sz=2*r/cols;let k=0;const COL={good:T.good,caught:T.bad,escape:T['amber-fill']};
 for(let i=0;i<cols&&k<N;i++)for(let j=0;j<cols&&k<N;j++){const x=cx-r+j*sz,y=cy-r+i*sz;if(Math.hypot(x+sz/2-cx,y+sz/2-cy)>r-sz*0.7)continue;c.fillStyle=COL[TST.res[k]];c.globalAlpha=TST.res[k]==='good'?0.55:1;c.fillRect(x+0.5,y+0.5,sz-1,sz-1);c.globalAlpha=1;k++;}
 c.font='11px IBM Plex Mono, monospace';c.textAlign='left';[['good','passed'],['caught','failed test'],['escape','bad but passed']].forEach(([k2,l],i)=>{c.fillStyle=COL[k2];c.fillRect(6,h-14-i*14,9,9);c.fillStyle=T.muted;c.fillText(l,19,h-6-i*14);});}
watch(pcv,()=>{if(S.step===7&&TST)drawProbe();});
function rGadget(){const p=P(),box=$('#tcGadget');const v=Object.fromEntries(p.ins.map(n=>[n,S.sv[n]?1:0]));const o=TC.simCells(SY.M,v).out;
 const sw=p.ins.map(n=>'<div class="sw"><button type="button" data-n="'+n+'" aria-pressed="'+(v[n]?'true':'false')+'" aria-label="Input '+n+'"></button>'+n+'</div>').join('');
 let out='';if(p.demo==='seg'){const on=s=>o[s]?'#ff5640':'#3b1414';out='<svg viewBox="0 0 60 100" aria-label="Display"><polygon points="12,6 48,6 42,12 18,12" fill="'+on('a')+'"/><polygon points="50,8 50,46 44,42 44,14" fill="'+on('b')+'"/><polygon points="50,54 50,92 44,86 44,58" fill="'+on('c')+'"/><polygon points="12,94 48,94 42,88 18,88" fill="'+on('d')+'"/><polygon points="10,54 10,92 16,86 16,58" fill="'+on('e')+'"/><polygon points="10,8 10,46 16,42 16,14" fill="'+on('f')+'"/><polygon points="14,50 20,46 40,46 46,50 40,54 20,54" fill="'+on('g')+'"/></svg>';
  out+='<div class="num">'+(v.x2*4+v.x1*2+v.x0)+'</div>';}
 else{out='<div class="outs">'+p.outs.map(n=>'<div><span class="led'+(o[n]?' on':'')+'"></span>'+n+'</div>').join('')+'</div>';
  if(p.demo==='add'){const a=p.ins.reduce((t,n)=>t+v[n],0);const got=(o.carry!==undefined?o.carry:o.cout)*2+o.sum;out+='<div class="num">'+p.ins.map(n=>v[n]).join('+')+' = '+got+(got!==a?' ✗':'')+'</div>';}
  if(p.demo==='add2'){const a=v.a1*2+v.a0,b=v.b1*2+v.b0,got=o.s2*4+o.s1*2+o.s0;out+='<div class="num">'+a+'+'+b+' = '+got+(got!==a+b?' ✗':'')+'</div>';}
  if(p.demo==='alu'){const op=v.op1*2+v.op0===3?(v.sub?'sub':'add'):['and','or','xor'][v.op1*2+v.op0];const sym={and:'AND',or:'OR',xor:'XOR',add:'+',sub:'−'}[op];const A=1234,B=567;const r=makeALU(tableOf(SY.M))(op,A,B).y;const want={and:A&B,or:A|B,xor:A^B,add:A+B,sub:A-B}[op];
   out+='<div class="num" style="font-size:15px">'+sym+' · 32 slices: '+A+' '+sym+' '+B+' = '+r+(r!==want?' ✗':' ✓')+'</div><a class="btn primary" href="#riscv-3" data-use-alu="1">Run it in the RISC-V CPU →</a>';}}
 box.innerHTML='<div style="display:flex;gap:10px">'+sw+'</div><div class="chip">'+esc(p.t).toUpperCase()+'<br>'+TC.NODE[S.node].t+'</div>'+out;
 box.querySelectorAll('.sw button').forEach(b=>b.addEventListener('click',()=>{S.sv[b.dataset.n]=S.sv[b.dataset.n]?0:1;rGadget();}));}
function rReport(){const p=P(),st=SY.st,nd=TC.NODE[S.node],vr=verify();const wum=PL.GW*nd.site[0],hum=PL.H/3*nd.site[1];const n={good:0};TST.res.forEach(x=>{if(x==='good')n.good++;});
 const ratio=336e9/st.tr;
 $('#tcReport').innerHTML='<div class="wide"><b style="font-family:var(--body)">'+(vr&&vr.bad?'Shipped with a bug: '+vr.bad+' input cases give wrong answers. ':'Your chip works. ')+'</b>It spent about '+Math.round(nd.masks*nd.days/7)+' weeks in the fab. Real shuttle runs take several months because many designs share one schedule, and a flagship GPU takes about three years from specification to volume.</div>'+
  (p.id==='alu'?'<div class="wide">The RISC-V lab builds its ALU from 32 copies of this slice: '+(st.tr*32).toLocaleString('en-US')+' transistors. <a href="#riscv-3" data-use-alu="1">Run programs on it →</a></div>':'')+
  [['Logic cells',st.cells],['Transistors',st.tr],['Fastest clock',fmtF(st.fmax)],['Core area',(wum*hum).toFixed(0)+' µm²'],['Wire',Math.round(RT.wl*nd.site[0]*1.2)+' µm'],['Process',nd.t],['Fault coverage',Math.round(TST.cov*100)+'%'],['NVIDIA Rubin has',(ratio>=1e9?(ratio/1e9).toFixed(1)+' billion':Math.round(ratio/1e6)+' million')+'× more transistors']].map(x=>'<div><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join('');}

function render(){if(!D)compile();chrome();
 if(S.step===0)rSpec();if(S.step===1)rCode();if(S.step===2&&ok())rVerify();if(S.step===3&&ok())rSynth();if(S.step===4&&ok()){synth();rPR();}if(S.step===5&&ok()){synth();rMask();}if(S.step===6){drawFab();rFab();}if(S.step===7&&S.fabbed){synth();rTest();}}
redraws.push(()=>{if(S.step===3)drawSch();if(S.step===4)drawLay();if(S.step===5)drawMask();if(S.step===6)drawFab();if(S.step===7&&TST){drawProbe();}});
compile();render();
})();
}
