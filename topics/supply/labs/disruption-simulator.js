/* Lab: DISRUPTION SIMULATOR */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function disrupt(){
const cv=$('#dsCv');if(!cv)return;
const PR=['AI accelerators','Smartphones','PCs & servers','Cars','Industrial & IoT'];
const PC=()=>[T['amber-fill'],T.cyan,T.violet,T.rose,T.good];
const INV=[0.2,1,1.2,0.5,1.5];
/* key, title, exposure per product, qualify lead (months), backup share 2026/2030, restart months, defaults [sev,dur,buf], head, text */
const SC=[
 ['tw','Taiwan fabs offline',[.97,.8,.7,.5,.4],9,.12,.3,6,[100,6,1.5],'Taiwan held about two-thirds of advanced foundry capacity in 2024','A blockade, conflict or major earthquake that stopped Taiwan\'s fabs would hit almost every product at once, because Taiwan also makes many mature-node chips such as car microcontrollers. Other foundries could absorb only a small part: their leading-edge lines are full, and moving a design to a new fab takes most of a year. In April 2024 a magnitude 7.4 earthquake shook TSMC\'s fabs; most tools were running again within a day.'],
 ['euv','EUV scanner supply stops',[.95,.75,.55,.05,.05],99,0,0,4,[100,18,1.5],'ASML is the only maker of EUV scanners','Installed scanners keep working, so the damage starts slowly: spare parts and service engineers stop arriving, uptime falls month by month, and no new leading-edge capacity can be added. There is no second supplier to switch to. Products on older nodes, such as most car chips, barely notice.'],
 ['hbm','Korean memory fabs offline',[.8,.55,.55,.25,.2],6,.12,.25,4,[100,4,1.5],'SK hynix and Samsung make about three-quarters of HBM','Without Korean memory, AI accelerators stop at the packaging line even if the logic dies are ready. Phones and PCs also lose most of their DRAM. Micron, with about a fifth of HBM supply, cannot ramp quickly because HBM lines are booked a year ahead.'],
 ['pkg','Advanced packaging outage',[.92,.3,.15,0,.02],5,.25,.5,3,[100,4,1.5],'TSMC holds about 70% of CoWoS-class capacity','A fire or earthquake at the CoWoS lines would stop AI GPUs even with every fab running, as happened in effect during the 2024–26 shortages. Amkor, ASE and new US packaging plants can take over some of the work after requalification.'],
 ['mat','Critical minerals export ban',[.15,.35,.15,.6,.35],6,.3,.5,2,[100,8,3],'China produces almost all primary gallium and refines about 90% of rare earths','Gallium goes into the radio and power chips of phones, chargers and cars; rare earths into magnets for motors and fab tools. Stockpiles buy months, and other sources open slowly. Car exposure here includes motor magnets, not just chips. China\'s ban on gallium and germanium sales to the US is suspended until 27 November 2026, and its expanded rare-earth controls until 10 November 2026.'],
 ['osat','Southeast Asia assembly shutdown',[.1,.3,.4,.55,.5],3,.4,.5,2,[100,3,1.5],'Malaysia alone handles roughly an eighth of global assembly and test','Assembly and test plants are easier to replace than fabs, but cars and industrial equipment use thousands of low-cost chips with little inventory. In 2021, COVID lockdowns in Malaysia closed test plants and halted car production around the world.']
];
let si=0,yr='2026',sel=0;
const sevI=$('#dsSev'),durI=$('#dsDur'),bufI=$('#dsBuf');
$('#dsSc').innerHTML=SC.map((s,i)=>'<button type="button" data-i="'+i+'">'+s[1]+'</button>').join('');
$('#dsSc').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{si=+b.dataset.i;const d=SC[si][7];sevI.value=d[0];durI.value=d[1];bufI.value=d[2];run();}));
$('#dsYr').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{yr=b.dataset.y;run();}));
[sevI,durI,bufI].forEach(e=>e.addEventListener('input',run));
const leg=$('#dsLeg');
function sim(s,p,sev,D,B){const dt=.25,out=[];let inv=B*INV[p];const mit=yr==='2030'?s[5]:s[4];
 for(let t=0;t<=24+1e-9;t+=dt){let raw;
  if(s[0]==='euv'){const eff=Math.min(1,t/12)*.6;raw=t<D?sev*eff:Math.max(0,sev*Math.min(1,D/12)*.6*(1-(t-D)/s[6]));}
  else raw=t<D?sev:Math.max(0,sev*(1-(t-D)/s[6]));
  const m=mit*clamp((t-s[3])/6,0,1);const short=s[2][p]*raw*(1-m);let sup=1-short;
  if(inv>0&&short>0){const use=Math.min(inv,short*dt);inv-=use;sup+=use/dt;}
  out.push([t,clamp(sup,0,1)]);}
 return out;}
let R=[];
function run(){const s=SC[si];const sev=+sevI.value/100,D=+durI.value,B=+bufI.value;
 $('#dsSevO').textContent=sevI.value+'%';$('#dsDurO').textContent=D+(D===1?' month':' months');$('#dsBufO').textContent=B+(B===1?' month':' months');
 $('#dsSc').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===si?'true':'false'));
 $('#dsYr').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.y===yr?'true':'false'));
 R=PR.map((_,p)=>sim(s,p,sev,D,B));
 const c=PC();leg.innerHTML=PR.map((n,i)=>'<button type="button" class="lg" data-i="'+i+'" aria-pressed="'+(i===sel)+'"><i style="background:'+c[i]+'"></i>'+n+'</button>').join('');
 leg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{sel=+b.dataset.i;run();}));
 const r=R[sel];let mn=1,mnT=0,below=0,lost=0,rec=null;r.forEach(([t,v],k)=>{if(v<mn){mn=v;mnT=t;}if(v<.9)below+=.25;if(k)lost+=(1-v)*.25;});
 let lastBad=-1;r.forEach(([t,v],k)=>{if(v<.95)lastBad=k;});rec=lastBad<0?'Never dropped below':lastBad>=r.length-1?'Not within 2 years':'Month '+Math.ceil(r[lastBad+1][0]);
 $('#dsWho').textContent=PR[sel];$('#dsMin').textContent=Math.round(mn*100)+'% of demand';$('#dsMon').textContent=below?(below%1?below.toFixed(1):below)+' months':'None';$('#dsLost').textContent=Math.round(lost/24*100)+'%';$('#dsRec').textContent=rec;
 $('#dsTag').textContent=s[1];$('#dsHead').textContent=s[8];$('#dsTxt').textContent=s[9];draw();}
function draw(){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);const L=40,Rr=24,Tp=12,B=28,pw=w-L-Rr,ph=h-Tp-B;
 const X=t=>L+t/24*pw,Y=v=>Tp+(1-v)*ph;
 const D=+durI.value;c.fillStyle=rgba(T.bad,.08);c.fillRect(X(0),Tp,X(Math.min(24,D))-X(0),ph);
 c.strokeStyle=T.line;c.lineWidth=1;c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.textAlign='right';
 [0,.25,.5,.75,1].forEach(v=>{c.beginPath();c.moveTo(L,Y(v));c.lineTo(L+pw,Y(v));c.stroke();c.fillText(Math.round(v*100)+'%',L-6,Y(v)+4);});
 c.textAlign='center';[0,6,12,18,24].forEach(t=>c.fillText(t?t+' mo':'Shock',X(t),h-8));
 c.textAlign='left';c.fillStyle=T.bad;c.fillText('Outage',X(0)+5,Tp+13);
 const col=PC();R.forEach((r,i)=>{if(i===sel)return;c.strokeStyle=rgba(col[i],.55);c.lineWidth=1.5;c.beginPath();r.forEach(([t,v],k)=>k?c.lineTo(X(t),Y(v)):c.moveTo(X(t),Y(v)));c.stroke();});
 const r=R[sel];if(r){c.strokeStyle=col[sel];c.lineWidth=3;c.beginPath();r.forEach(([t,v],k)=>k?c.lineTo(X(t),Y(v)):c.moveTo(X(t),Y(v)));c.stroke();}}
watch(cv,draw);run();

/* real disruptions */
const H=[
 ['2011','Natural','Tōhoku earthquake and tsunami','Renesas\'s Naka fab, a major source of car microcontrollers, was out for about three months, and carmakers worldwide cut output.'],
 ['2020–23','Demand','Pandemic chip shortage','Carmakers cancelled orders, then demand rebounded faster than fabs could respond. AlixPartners estimated the shortage cost automakers $210 billion in revenue in 2021.'],
 ['2021','Natural','Texas winter storm','Power cuts shut Samsung, NXP and Infineon fabs in Austin for weeks in February.'],
 ['2021','Accident','Renesas Naka fire','A fire in a cleanroom took about a month to restart and around three months to recover full output.'],
 ['2022','Geopolitics','War in Ukraine','Ukraine had purified about half of the world\'s semiconductor-grade neon. Chipmakers drew on stockpiles and new suppliers in time.'],
 ['2022–25','Geopolitics','US export controls','Rules from October 2022, tightened in 2023 and 2024, restrict sales of advanced AI chips, HBM and chipmaking tools to China.'],
 ['2023–24','Geopolitics','Gallium and germanium controls','China required export licenses from August 2023 and banned sales to the US in December 2024.'],
 ['2024','Natural','Hualien earthquake','A magnitude 7.4 quake shook Taiwan in April. TSMC evacuated fabs but had most tools running again within a day.'],
 ['2024','Natural','Hurricane Helene','Floods cut off Spruce Pine, North Carolina, the main source of the ultra-pure quartz used to grow silicon ingots, for weeks.'],
 ['2024–26','Demand','CoWoS and HBM shortages','Packaging and memory capacity, not chip design or fabs, set how many AI GPUs could ship.'],
 ['2025','Geopolitics','Nexperia dispute','The Dutch government took control of chipmaker Nexperia; China then blocked exports from its Chinese plants, and carmakers warned of shutdowns until exemptions began in November.'],
 ['2025','Geopolitics','Rare-earth controls','China added licensing for seven rare earths in April and a much broader regime in October, then suspended the October rules for a year after US–China talks.'],
 ['Nov 2026','Watch','Pauses due to expire','China\'s suspensions of the rare-earth rules (10 November) and the US gallium ban (27 November) run out this month. In late September, Beijing said its trade arrangements with the US were extended to 10 January 2027.']
];
const TK={Natural:'ship',Accident:'ann',Geopolitics:'proj',Demand:'out',Watch:'ann'};
$('#dsHist').innerHTML=H.map(x=>'<div class="it"><span class="y">'+x[0]+'</span><span class="trk">'+x[1]+'</span><div><b>'+x[2]+'</b><p>'+x[3]+'</p></div><span class="pill '+TK[x[1]]+'">'+x[1]+'</span></div>').join('');

/* advanced capacity bars */
const CAP=[['Taiwan',66,55],['United States',10,22],['South Korea',11,8],['China & others',13,15]];
$('#capBars').innerHTML=CAP.map(c=>'<div class="capgrp"><b>'+c[0]+'</b><div class="bar" style="grid-template-columns:44px minmax(0,1fr);gap:8px"><span class="yr">2024</span><div class="track"><div class="fill" style="width:'+c[1]/70*100+'%"></div><span class="val">'+c[1]+'%</span></div></div><span></span><div class="bar" style="grid-template-columns:44px minmax(0,1fr);gap:8px"><span class="yr">2027 est.</span><div class="track"><div class="fill hot" style="width:'+c[2]/70*100+'%"></div><span class="val">'+c[2]+'%</span></div></div></div>').join('');
const FB=[
 ['TSMC Arizona','Phoenix, United States','ship','Producing','4 nm in volume since late 2024; 3 nm and 2 nm fabs under construction, part of a plan now worth $265 billion.'],
 ['Intel Fab 52','Chandler, United States','ship','Producing','Intel 18A, the first US 2 nm-class process, in production for Panther Lake processors.'],
 ['Samsung Taylor','Texas, United States','ann','Ramping','2 nm fab; Tesla signed a $16.5 billion deal in 2025 for chips made here.'],
 ['JASM (TSMC)','Kumamoto, Japan','ship','Producing','12–28 nm chips since late 2024 for Sony, Denso and others; a second fab is being built.'],
 ['Rapidus IIM-1','Chitose, Japan','ann','Pilot line','A new Japanese company making 2 nm on a pilot line since 2025, aiming for mass production in 2027.'],
 ['ESMC (TSMC)','Dresden, Germany','ann','Building','TSMC with Bosch, Infineon and NXP; 12–28 nm chips for European cars and industry, targeting 2027.'],
 ['Micron ID1','Boise, United States','ann','Building','The first new US memory fab in decades; first DRAM output expected around 2027.'],
 ['Tata–PSMC','Dholera, India','ann','Building','India\'s first commercial fab, for 28–110 nm chips used in cars, power and consumer devices.'],
 ['SK hynix Indiana','West Lafayette, United States','proj','Planned','HBM advanced packaging plant next to Purdue University, targeted for 2028.'],
 ['Amkor Arizona','Peoria, United States','proj','Planned','Advanced packaging for chips from TSMC Arizona, so US-made GPUs need not fly back to Taiwan.']
];
$('#fabList').innerHTML=FB.map(f=>'<div><span class="pill '+f[2]+'">'+f[3]+'</span><b>'+f[0]+'</b><small>'+f[1]+'</small><p>'+f[4]+'</p></div>').join('');
})();
}
