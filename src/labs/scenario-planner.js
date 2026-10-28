/* Lab: SCENARIO PLANNER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function scenarios(){
const cv=$('#spCv');if(!cv)return;
const SW=[
 ['litho','High-NA EUV adoption',[['slow','Slow'],['on','On track'],['fast','Fast']]],
 ['cfet','Stacked CFET transistors arrive',[['2036','2036'],['2033','2033 (imec)'],['2031','2031']]],
 ['hbm','HBM and packaging supply',[['tight','Tight'],['bal','Balanced'],['ample','Ample']]],
 ['power','Electricity for data centers',[['con','Constrained'],['grow','Growing'],['abund','Abundant']]],
 ['ai','AI speeds up chip design',[['mod','Modestly'],['strong','Strongly'],['trans','Transformatively']]],
 ['pkg','3D stacking and optics',[['slow','Slow'],['on','On track'],['fast','Fast']]],
 ['wild','Beyond-silicon breakthrough by 2034',[['no','No'],['yes','Yes']]]];
const PRE=[['Steady progress',{litho:'on',cfet:'2033',hbm:'bal',power:'grow',ai:'strong',pkg:'on',wild:'no'}],['Power wall',{litho:'on',cfet:'2033',hbm:'bal',power:'con',ai:'strong',pkg:'on',wild:'no'}],['Memory crunch',{litho:'on',cfet:'2033',hbm:'tight',power:'grow',ai:'strong',pkg:'slow',wild:'no'}],['Slowdown',{litho:'slow',cfet:'2036',hbm:'tight',power:'con',ai:'mod',pkg:'slow',wild:'no'}],['Breakthrough decade',{litho:'fast',cfet:'2031',hbm:'ample',power:'abund',ai:'trans',pkg:'fast',wild:'yes'}]];
let S=Object.assign({},PRE[0][1]);
$('#spCtl').innerHTML=SW.map(s=>'<div class="ctl"><span class="lbl">'+s[1]+'</span><div class="seg" data-k="'+s[0]+'">'+s[2].map(o=>'<button type="button" data-v="'+o[0]+'">'+o[1]+'</button>').join('')+'</div></div>').join('');
$('#spCtl').querySelectorAll('.seg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S[g.dataset.k]=b.dataset.v;run();})));
$('#spPre').innerHTML=PRE.map((p,i)=>'<button type="button" data-i="'+i+'">'+p[0]+'</button>').join('');
$('#spPre').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S=Object.assign({},PRE[+b.dataset.i][1]);run();}));
const Y0=2026,Y1=2040;
function model(s){const out=[];let eff=1,cpd=1,powr=1,chip=1;const cf=+s.cfet;
 const arch0=s.ai==='mod'?0:s.ai==='strong'?0.03:0.06;
 const cg0=(s.hbm==='tight'?1.14:s.hbm==='bal'?1.24:1.34)*(s.pkg==='fast'?1.03:s.pkg==='slow'?0.98:1);
 const fleet=[];for(let k=3;k>=1;k--)fleet.push({n:Math.pow(cg0,-k),e:Math.pow(1.45,-k),p:Math.pow(1.12,-k)});
 let drawn0=null;
 for(let y=Y0;y<=Y1;y++){
  if(y>Y0){const t=y-Y0;
   let proc=y<=2030?Math.log(1.10):Math.log(1.06);if(y>=cf&&y<cf+5)proc=Math.log(1.11);else if(y>=cf+5)proc=Math.log(1.05);
   if(y>=2027&&y<=2035)proc+=s.litho==='fast'?0.02:s.litho==='slow'?-0.02:0;
   const arch=Math.log(1.08+0.17*Math.exp(-t/5))+arch0*Math.exp(-t/12);
   const pk=Math.log(s.pkg==='fast'?1.09:s.pkg==='slow'?1.03:1.06);
   const wild=(s.wild==='yes'&&y>=2034&&y<2038)?Math.log(1.12):0;
   const g=proc+arch+pk+wild;eff*=Math.exp(g);
   cpd*=Math.exp(0.85*g+(s.hbm==='tight'?-0.04:s.hbm==='ample'?0.025:0)+(s.ai==='trans'?0.02:s.ai==='strong'?0.01:0));
   powr*=s.power==='con'?1.10:s.power==='grow'?(y<=2032?1.22:1.10):(y<=2032?1.32:1.16);
   chip*=y<=2030?cg0:1+(cg0-1)*0.5;}
  const cp=y<=2030?Math.pow(1.12,y-Y0):Math.pow(1.12,4)*Math.pow(1.03,y-2030);
  fleet.push({n:chip,e:eff,p:cp});const live=fleet.slice(-4);
  const supply=live.reduce((t,f)=>t+f.n*f.e*f.p,0),drawn=live.reduce((t,f)=>t+f.n*f.p,0);if(drawn0===null)drawn0=drawn;
  const avail=powr*drawn0*1.1;const inst=supply*Math.min(1,avail/drawn);
  out.push({y,eff,cpd,raw:inst,lim:avail<drawn?'Electricity':'Chip and memory supply'});}
 const b0=out[0].raw;out.forEach(o=>o.inst=o.raw/b0);return out;}
let cur=[],base=[];
function run(){$('#spCtl').querySelectorAll('.seg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',S[g.dataset.k]===b.dataset.v?'true':'false')));
 const pi=PRE.findIndex(p=>Object.keys(p[1]).every(k=>p[1][k]===S[k]));$('#spPre').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===pi?'true':'false'));
 cur=model(S);base=model(PRE[0][1]);const at=y=>cur[y-Y0];
 const fx=v=>v>=100?Math.round(v).toLocaleString('en-US')+'×':v>=10?v.toFixed(0)+'×':v.toFixed(1)+'×';
 $('#spE30').textContent=fx(at(2030).eff);$('#spE40').textContent=fx(at(2040).eff);$('#spC40').textContent=fx(at(2040).cpd);$('#spLim').textContent=at(2035).lim;
 $('#spTag').textContent=pi>=0?PRE[pi][0]:'Custom scenario';
 const r=at(2040).inst/base[2040-Y0].inst;
 let t='By 2040 the world\'s installed AI computing power is '+fx(at(2040).inst)+' its 2026 level'+(pi===0?'.':', compared with '+fx(base[2040-Y0].inst)+' under steady progress.');
 t+=at(2035).lim==='Electricity'?' Power is the binding limit: chips could be built faster than grids can feed them, so efficiency gains translate directly into more computing.':' Chip, packaging and memory supply is the binding limit: power is available, but not enough accelerators can be built.';
 if(S.wild==='yes')t+=' The breakthrough wildcard assumes a beyond-silicon technique, such as analog or photonic inference, delivers a few years of extra efficiency gains from 2034.';
 if(S.cfet==='2036'&&S.litho==='slow')t+=' With slow lithography and late CFET, gains after 2030 rely mostly on architecture and packaging.';
 $('#spTxt').textContent=t;draw();}
function draw(){if(!cur.length)return;const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);const L=46,R=10,Tp=12,B=26;const X=y=>L+(y-Y0)/(Y1-Y0)*(w-L-R);
 const mx=Math.max(...cur.map(o=>Math.max(o.eff,o.inst,o.cpd)),...base.map(o=>Math.max(o.eff,o.inst,o.cpd)));const top=Math.ceil(Math.log10(mx));const Y=v=>Tp+(1-Math.log10(Math.max(v,1))/top)*(h-Tp-B);
 c.strokeStyle=T.line;c.font='11px IBM Plex Mono, monospace';c.fillStyle=T.muted;c.textAlign='right';for(let e=0;e<=top;e++){c.beginPath();c.moveTo(L,Y(Math.pow(10,e)));c.lineTo(w-R,Y(Math.pow(10,e)));c.stroke();c.fillText((e<4?Math.pow(10,e).toLocaleString('en-US'):'10'+String(e).replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]))+'×',L-6,Y(Math.pow(10,e))+4);}
 [2026,2030,2035,2040].forEach(y=>{c.textAlign=y===2040?'right':'center';c.fillText(y,X(y),h-8);});
 const SER=[['eff',T.violet,'AI chip efficiency'],['cpd',T['cyan-fill'],'AI compute per dollar'],['inst',T['amber-fill'],'Installed AI computing']];
 SER.forEach(([k,col])=>{c.strokeStyle=rgba(col,.55);c.lineWidth=1.3;c.setLineDash([4,4]);c.beginPath();base.forEach((o,i)=>i?c.lineTo(X(o.y),Y(o[k])):c.moveTo(X(o.y),Y(o[k])));c.stroke();c.setLineDash([]);c.strokeStyle=col;c.lineWidth=2.6;c.beginPath();cur.forEach((o,i)=>i?c.lineTo(X(o.y),Y(o[k])):c.moveTo(X(o.y),Y(o[k])));c.stroke();});
 $('#spLeg').innerHTML=SER.map(s=>'<span><i style="background:'+s[1]+'"></i>'+s[2]+'</span>').join('');}
watch(cv,draw);run();
})();
}
