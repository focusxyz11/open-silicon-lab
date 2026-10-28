/* Lab: SEMICONDUCTOR PLAYGROUND */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function semis(){
const cv=$('#phCv');if(!cv)return;
const kB=8.617e-5,EG=1.12,Q=1.602e-19,NSI=5e22;
const ni=Tk=>1e10*Math.pow(Tk/300,1.5)*Math.exp(-EG/(2*kB)*(1/Tk-1/300));
const mun=N=>68.5+1345/(1+Math.pow(N/9.2e16,0.711)),mup=N=>44.9+425/(1+Math.pow(N/2.23e17,0.719));
const sci=v=>{if(!isFinite(v)||v<=0)return '0';const e=Math.floor(Math.log10(v));const m=v/Math.pow(10,e);return (m>=9.95?'1.0':m.toFixed(1))+' × 10'+String(e+(m>=9.95?1:0)).replace(/-/g,'⁻').replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);};
const ohm=r=>r>=1e6?sci(r)+' Ω·cm':r>=1?(+r.toPrecision(3)).toLocaleString('en-US')+' Ω·cm':r>=1e-3?(+(r*1e3).toPrecision(3))+' mΩ·cm':sci(r)+' Ω·cm';
const MODES=[['pure','1 · Pure silicon'],['dope','2 · Doping'],['pn','3 · p–n junction'],['mos','4 · Field-effect switch']];
let mode='pure';const S={T:300,type:'n',N:16,Na:17,Nd:17,V:0,Vg:0.2,Vd:0.5};
const box=$('#phCtl');
$('#phMode').innerHTML=MODES.map(m=>'<button type="button" data-m="'+m[0]+'">'+m[1]+'</button>').join('');
$('#phMode').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.m;build();}));
const sl=(id,lab,min,max,step,val)=>'<div class="ctl"><label for="'+id+'">'+lab+' <output id="'+id+'O">–</output></label><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"></div>';
let parts=[];const R=rng(7);
function build(){$('#phMode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===mode?'true':'false'));
 let h='';
 if(mode==='pure')h=sl('phT','Temperature',150,650,5,S.T);
 if(mode==='dope')h='<div class="ctl"><span class="lbl">Dopant</span><div class="seg" id="phType"><button data-t="n">Phosphorus (n-type)</button><button data-t="p">Boron (p-type)</button></div></div>'+sl('phN','Dopant atoms per cm³',13,20,0.1,S.N);
 if(mode==='pn')h=sl('phNa','p-side doping (boron)',14,19,0.1,S.Na)+sl('phNd','n-side doping (phosphorus)',14,19,0.1,S.Nd)+sl('phV','Applied voltage',-3,0.8,0.01,S.V);
 if(mode==='mos')h=sl('phVg','Gate voltage',0,1.2,0.01,S.Vg)+sl('phVd','Drain voltage',0,1,0.01,S.Vd);
 box.innerHTML=h;
 box.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>{const k={phT:'T',phN:'N',phNa:'Na',phNd:'Nd',phV:'V',phVg:'Vg',phVd:'Vd'}[i.id];S[k]=+i.value;calc();}));
 const ty=$('#phType');if(ty)ty.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S.type=b.dataset.t;calc();}));
 parts=[];calc();}
let M={};
function out(rows){$('#phOut').innerHTML=rows.map(r=>'<div><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('');}
function calc(){const set=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t;};
 if(mode==='pure'){const n=ni(S.T);const rho=1/(Q*n*(mun(1e13)+mup(1e13)));M={n};set('phTO',S.T+' K ('+Math.round(S.T-273)+' °C)');
  out([['Free electrons per cm³',sci(n)],['Bond electrons set free','1 in '+sci(4*NSI/n)],['Resistivity',ohm(rho)],['vs copper',sci(rho/1.7e-6)+'× worse']]);
  $('#phTag').textContent='Intrinsic silicon';
  $('#phText').innerHTML='<p>Each silicon atom shares its four outer electrons with four neighbours, so almost every electron is locked in a bond. Heat shakes a few loose: each one leaves behind a <b>hole</b>, a missing electron that behaves like a positive charge. Both can carry current. Warm the crystal and watch the number of free carriers climb steeply, because breaking a bond needs 1.12 eV, the <b>band gap</b>. Pure silicon is too unpredictable to build with: its conductivity depends on temperature.</p>';}
 if(mode==='dope'){const N=Math.pow(10,S.N),n0=ni(300);const maj=N/2+Math.sqrt(N*N/4+n0*n0),min=n0*n0/maj;const nn=S.type==='n'?maj:min,pp=S.type==='n'?min:maj;const rho=1/(Q*(nn*mun(N)+pp*mup(N)));M={N};
  set('phNO',sci(N));$('#phType').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===S.type?'true':'false'));
  out([['Majority carriers',sci(maj)+(S.type==='n'?' electrons':' holes')],['Minority carriers',sci(min)+(S.type==='n'?' holes':' electrons')],['Resistivity',ohm(rho)],['Dopant atoms','1 per '+sci(NSI/N)+' Si']]);
  $('#phTag').textContent=S.type==='n'?'n-type silicon':'p-type silicon';
  $('#phText').innerHTML='<p>'+(S.type==='n'?'Phosphorus has five outer electrons, one more than silicon needs. The spare one wanders free, so phosphorus-doped silicon conducts with negative carriers: <b>n-type</b>.':'Boron has only three outer electrons, so it leaves one bond short: a hole. Neighbouring electrons hop into it, so the hole moves like a positive charge: <b>p-type</b>.')+' Even one dopant per million silicon atoms makes the crystal conduct a thousand times better than pure silicon, and the effect barely changes with temperature. Doping is how designers decide, region by region, what the silicon will do.</p>';}
 if(mode==='pn'){const Na=Math.pow(10,S.Na),Nd=Math.pow(10,S.Nd),n0=ni(300),Vt=0.02585;const Vbi=Vt*Math.log(Na*Nd/(n0*n0));const eps=11.7*8.854e-14;const Vj=Math.max(0.02,Vbi-S.V);const W=Math.sqrt(2*eps*Vj*(Na+Nd)/(Q*Na*Nd));
  const I0=1e-14;let I=I0*(Math.exp(Math.min(S.V,0.8)/Vt)-1);I=Math.min(I,0.05);M={Vbi,W,I,xp:W*Nd/(Na+Nd),xn:W*Na/(Na+Nd)};
  set('phNaO',sci(Na));set('phNdO',sci(Nd));set('phVO',(S.V>=0?'+':'')+S.V.toFixed(2)+' V');
  const Emax=2*Vj/W;
  out([['Built-in voltage',Vbi.toFixed(2)+' V'],['Depletion width',W*1e7>=1000?(W*1e4).toFixed(2)+' µm':(W*1e7).toFixed(0)+' nm'],['Peak electric field',sci(Emax)+' V/cm'],['Current (1 mm² diode)',Math.abs(I)<1e-9?(I<0?'≈ 10 fA (blocked)':'≈ 0'):Math.abs(I)>=1e-3?(I*1e3).toFixed(1)+' mA':sci(Math.abs(I))+' A']]);
  $('#phTag').textContent=S.V>0.5?'Forward bias: conducting':S.V<0?'Reverse bias: blocking':'Near zero bias';
  $('#phText').innerHTML='<p>Join p-type and n-type silicon and electrons near the boundary fall into holes. That leaves a thin <b>depletion region</b> with no free carriers, held open by an electric field from the fixed dopant ions. Push forward (positive voltage on the p side) and the region shrinks until current floods across above about 0.6 V. Pull backward and it widens, blocking current. This one-way valve is a <b>diode</b>; every transistor contains two of them.</p>';}
 if(mode==='mos'){const Vt=0.45,ss=0.075;let Id;if(S.Vg<Vt)Id=1e-7*Math.pow(10,(S.Vg-Vt)/ss);else Id=1e-7+6e-4*Math.pow(S.Vg-Vt,1.3);Id*=Math.tanh(S.Vd/0.15)*(1+0.1*S.Vd);const st=S.Vg<Vt-0.1?'Off':S.Vg<Vt+0.05?'Turning on':'On';
  M={Id,ch:clamp((S.Vg-Vt+0.15)/0.8,0,1),st};set('phVgO',S.Vg.toFixed(2)+' V');set('phVdO',S.Vd.toFixed(2)+' V');
  out([['Switch state',st],['Channel electrons',S.Vg<Vt?'Almost none':'Layer about 1 nm thick'],['Drain current (1 µm wide)',Id>=1e-6?(Id*1e6).toFixed(1)+' µA':sci(Id)+' A'],['Threshold voltage',Vt.toFixed(2)+' V']]);
  $('#phTag').textContent='MOSFET: '+st;
  $('#phText').innerHTML='<p>Now build a switch. Two n-type islands, the <b>source</b> and <b>drain</b>, sit in p-type silicon, so two diodes back to back block any current. A metal <b>gate</b> sits above the gap on a few atoms of insulating oxide. Raise the gate voltage and its field pushes holes away and pulls electrons up to the surface, until a thin n-type channel forms and connects source to drain. The switch is on. No current flows into the gate, so holding it on or off costs almost nothing. This is a MOSFET, the switch inside every chip; <a href="#transistor">stage 05</a> shows how its shape evolved.</p>';}
 if(!parts.length)seed();if(!running)draw();}
function seed(){parts=[];const n=mode==='pure'?Math.round(clamp((Math.log10(M.n||1e10)-6)*4,0,60)):mode==='dope'?Math.round(clamp((S.N-12)*7,0,60)):mode==='pn'?60:50;
 for(let i=0;i<n;i++)parts.push({x:R(),y:R(),vx:(R()-.5)*.004,vy:(R()-.5)*.004,k:R()<.5?'e':'h',a:R()});}
let running=false,raf=0,vis=false;
function step(){const n=mode==='pure'?Math.round(clamp((Math.log10(M.n)-6)*4,0,60)):mode==='dope'?Math.round(clamp((S.N-12)*7,4,60)):null;
 if(n!==null){while(parts.length<n)parts.push({x:R(),y:R(),vx:(R()-.5)*.004,vy:(R()-.5)*.004,k:R()<.5?'e':'h',a:R()});if(parts.length>n)parts.length=n;}
 parts.forEach(p=>{p.vx+=(R()-.5)*.0016;p.vy+=(R()-.5)*.0016;p.vx*=.96;p.vy*=.96;p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>1)p.vx*=-1;if(p.y<0||p.y>1)p.vy*=-1;p.x=clamp(p.x,0,1);p.y=clamp(p.y,0,1);});}
function loop(){if(!vis||RM){running=false;return;}running=true;step();draw();raf=requestAnimationFrame(loop);}
inView(cv,v=>{vis=v;if(v&&!running&&!RM)loop();});
function lattice(c,x0,y0,w,h,sp,mark){c.strokeStyle=rgba(T.muted,.35);c.lineWidth=1.5;const cols=Math.floor(w/sp),rows=Math.floor(h/sp);const ox=x0+(w-(cols-1)*sp)/2,oy=y0+(h-(rows-1)*sp)/2;
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=ox+i*sp,y=oy+j*sp;if(i<cols-1){c.beginPath();c.moveTo(x,y-2);c.lineTo(x+sp,y-2);c.moveTo(x,y+2);c.lineTo(x+sp,y+2);c.stroke();}if(j<rows-1){c.beginPath();c.moveTo(x-2,y);c.lineTo(x-2,y+sp);c.moveTo(x+2,y);c.lineTo(x+2,y+sp);c.stroke();}}
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=ox+i*sp,y=oy+j*sp;const m=mark?mark(i,j):null;c.fillStyle=m?m[0]:T.surface;c.strokeStyle=m?m[1]:T.muted;c.lineWidth=1.2;c.beginPath();c.arc(x,y,8,0,7);c.fill();c.stroke();c.fillStyle=m?T.bg:T.muted;c.font='600 8px IBM Plex Sans, sans-serif';c.textAlign='center';c.fillText(m?m[2]:'Si',x,y+3);}
 return {ox,oy,cols,rows};}
function dot(c,x,y,k){if(k==='e'){c.fillStyle=T.cyan;c.beginPath();c.arc(x,y,3.6,0,7);c.fill();}else{c.strokeStyle=T['amber-fill'];c.lineWidth=2;c.beginPath();c.arc(x,y,3.8,0,7);c.stroke();}}
function draw(){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);c.font='11px IBM Plex Mono, monospace';
 if(mode==='pure'||mode==='dope'){const sp=34;let dop=null;
  if(mode==='dope'){const nd=Math.round(clamp((S.N-12)*1.6,1,12));const r2=rng(3);const set=new Set();for(let i=0;i<nd;i++)set.add(Math.floor(r2()*14)+','+Math.floor(r2()*9));dop=(i,j)=>set.has(i+','+j)?(S.type==='n'?[T.cyan,T.cyan,'P']:[T['amber-fill'],T.amber,'B']):null;}
  lattice(c,0,0,w,h-20,sp,dop);
  parts.forEach(p=>dot(c,8+p.x*(w-16),8+p.y*(h-36),mode==='dope'?(S.type==='n'?(p.a<.95?'e':'h'):(p.a<.95?'h':'e')):p.k));
  c.fillStyle=T.muted;c.textAlign='left';c.fillText(mode==='pure'?'● free electron   ○ hole':(S.type==='n'?'P = phosphorus donor   ● free electron':'B = boron acceptor   ○ hole'),8,h-6);}
 if(mode==='pn'){const top=30,bot=h-120,mid=w/2,scale=Math.min(1,0.4/Math.max(1e-6,M.W*1e4))*w*0.4/0.4;const Wpx=clamp(M.W*1e4/2*w,6,w*0.8);const xp=Wpx*M.xp/M.W,xn=Wpx*M.xn/M.W;
  c.fillStyle=rgba(T['amber-fill'],.12);c.fillRect(0,top,mid-xp,bot-top);c.fillStyle=rgba(T.cyan,.12);c.fillRect(mid+xn,top,w-mid-xn,bot-top);c.fillStyle=rgba(T.muted,.12);c.fillRect(mid-xp,top,xp+xn,bot-top);
  c.strokeStyle=T.line;c.strokeRect(0.5,top,w-1,bot-top);
  c.fillStyle=T.ink;c.font='600 12px IBM Plex Sans, sans-serif';c.textAlign='left';c.fillText('p-type (boron)',8,top-10);c.textAlign='right';c.fillText('n-type (phosphorus)',w-8,top-10);c.textAlign='center';c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('depletion region',mid,bot+14);
  for(let y=top+14;y<bot;y+=20)for(let x=mid-xp+6;x<mid+xn-4;x+=14){const neg=x<mid;c.fillStyle=neg?T.amber:T.cyan;c.font='600 11px IBM Plex Mono, monospace';c.fillText(neg?'−':'+',x,y+4);}
  const flow=S.V>0.45;parts.forEach((p,i)=>{const isH=i%2===0;let x;if(isH){x=p.x*(mid-xp-10)+5;if(flow)x=(p.x*w*1.0);}else{x=mid+xn+5+p.x*(w-mid-xn-10);if(flow)x=w-p.x*w;}const y=top+6+p.y*(bot-top-12);if(!flow&&x>mid-xp&&x<mid+xn)return;dot(c,x,y,isH?'h':'e');});
  if(flow&&!RM)parts.forEach(p=>{p.x+=0.003*(1+S.V);if(p.x>1)p.x-=1;});
  /* IV inset */
  const ix=40,iy=h-95,iw=w-60,ih=80;c.strokeStyle=T.line;c.beginPath();c.moveTo(ix,iy+ih*0.75);c.lineTo(ix+iw,iy+ih*0.75);c.moveTo(ix+iw*(3/3.8),iy);c.lineTo(ix+iw*(3/3.8),iy+ih);c.stroke();
  const X=v=>ix+(v+3)/3.8*iw,Y=i=>iy+ih*0.75-clamp(i/0.05,-.05,1)*ih*0.72;c.strokeStyle=T.violet;c.lineWidth=2;c.beginPath();for(let v=-3;v<=0.8;v+=0.01){const i=1e-14*(Math.exp(v/0.02585)-1);const yy=Y(Math.min(i,0.05));v===-3?c.moveTo(X(v),yy):c.lineTo(X(v),yy);}c.stroke();
  c.fillStyle=T['amber-fill'];c.beginPath();c.arc(X(S.V),Y(M.I),5,0,7);c.fill();c.fillStyle=T.muted;c.textAlign='left';c.font='11px IBM Plex Mono, monospace';c.fillText('current vs voltage',ix,iy-4);c.textAlign='right';c.fillText('0 V',X(0)-4,iy+ih*0.75+12);}
 if(mode==='mos'){const sub=h*0.42,gx0=w*0.32,gx1=w*0.68;c.fillStyle=rgba(T['amber-fill'],.12);c.fillRect(0,sub,w,h-sub);
  c.fillStyle=rgba(T.cyan,.25);c.fillRect(w*0.06,sub,w*0.27,h*0.2);c.fillRect(w*0.67,sub,w*0.27,h*0.2);
  c.fillStyle=rgba(T.muted,.35);c.fillRect(gx0,sub-8,gx1-gx0,8);c.fillStyle=T.violet;c.fillRect(gx0,sub-48,gx1-gx0,40);
  c.fillStyle=T.bg;c.font='600 12px IBM Plex Sans, sans-serif';c.textAlign='center';c.fillText('Gate '+S.Vg.toFixed(2)+' V',(gx0+gx1)/2,sub-24);
  c.fillStyle=T.ink;c.fillText('Source (n)',w*0.195,sub+h*0.1+4);c.fillText('Drain (n)',w*0.805,sub+h*0.1+4);c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('p-type silicon',w/2,h-10);c.fillText('oxide',(gx0+gx1)/2,sub+12+(M.ch>0?14:0));
  const dep=clamp(S.Vg/0.45,0,1)*h*0.18;c.fillStyle=rgba(T.muted,.12);c.fillRect(gx0,sub,gx1-gx0,dep);
  const ne=Math.round(M.ch*40);const r3=rng(11);for(let i=0;i<ne;i++){let x=gx0+r3()*(gx1-gx0),y=sub+2+r3()*6;if(!RM&&S.Vd>0.02&&M.st!=='Off'){const t=(performance.now()/1000*(0.3+S.Vd)*(M.ch)+r3())%1;x=w*0.3+t*(w*0.4);}dot(c,x,y,'e');}
  const r4=rng(5);for(let i=0;i<26;i++){const x=r4()*w,y=sub+dep+10+r4()*(h-sub-dep-30);if(x>w*0.06&&x<w*0.33&&y<sub+h*0.2)continue;if(x>w*0.67&&x<w*0.94&&y<sub+h*0.2)continue;dot(c,x,y,'h');}
  c.fillStyle=M.st==='On'?T.good:M.st==='Off'?T.bad:T.amber;c.font='600 13px IBM Plex Sans, sans-serif';c.textAlign='left';c.fillText(M.st==='On'?'Channel formed: current flows':M.st==='Off'?'No channel: switch is off':'Channel forming',8,18);}
}
watch(cv,draw);build();
})();
}
