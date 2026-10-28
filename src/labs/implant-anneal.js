/* Lab: IMPLANT & ANNEAL */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function implant(){
const cv=$('#ipCv');if(!cv)return;
/* Rp=a*E^b nm, dRp=c*E^d nm, amorphization dose, solid solubility, D (cm2/s) at furnace/spike/laser */
const IONS={B:['Boron (p-type)',3.9,.96,4.6,.59,1e17,2e20,[1.5e-15,6e-14,1e-12]],P:['Phosphorus (n-type)',1.8,.92,1.08,.81,5e14,1e21,[2e-15,8e-14,1e-12]],As:['Arsenic (n-type)',1.74,.76,0.8,.7,2e14,2e21,[2e-16,1e-14,3e-13]]};
const AN=[['none','None'],['furnace','Furnace, 900 °C, 30 min'],['spike','Spike, 1,050 °C, ~1 s'],['laser','Laser, ~1,300 °C, 1 ms']];
const TIME={furnace:1800,spike:1.5,laser:1e-3},ACT={none:.03,furnace:.97,spike:.92,laser:.99},SOLX={none:1,furnace:1,spike:1,laser:3};
let ion='As',an='spike';const BG=1e17;
$('#ipIon').innerHTML=Object.entries(IONS).map(([k,v])=>'<button type="button" data-k="'+k+'">'+v[0]+'</button>').join('');
$('#ipAn').innerHTML=AN.map(a=>'<button type="button" data-k="'+a[0]+'">'+a[1]+'</button>').join('');
$('#ipIon').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ion=b.dataset.k;run();}));
$('#ipAn').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{an=b.dataset.k;run();}));
const E=()=>0.5*Math.pow(1000,+$('#ipE').value);
['#ipE','#ipDose'].forEach(s=>$(s).addEventListener('input',run));
const sci=v=>{const e=Math.floor(Math.log10(v));const m=v/Math.pow(10,e);return (m<1.05?'':m.toFixed(1)+' × ')+'10'+String(e).replace(/-/g,'⁻').replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);};
let G=null;
function run(){const I=IONS[ion],e=E(),dose=Math.pow(10,+$('#ipDose').value);const Rp=I[1]*Math.pow(e,I[2]),s0=I[3]*Math.pow(e,I[4]);
 const Dc=an==='none'?0:I[7][['furnace','spike','laser'].indexOf(an)];const add=an==='none'?0:Math.sqrt(2*Dc*TIME[an])*1e7;const s=Math.sqrt(s0*s0+add*add);
 const C=(x,sg)=>dose/(Math.sqrt(2*Math.PI)*sg*1e-7)*Math.exp(-(x-Rp)*(x-Rp)/(2*sg*sg));const pk=C(Rp,s);const sol=I[6]*SOLX[an];
 let xj=null;if(pk>BG){xj=Rp+s*Math.sqrt(2*Math.log(pk/BG));}
 const act=an==='none'?ACT.none:ACT[an]*Math.min(1,sol/pk*1.2+0.4*(pk>sol?0:1)) ;const actF=clamp(an==='none'?.03:(pk<=sol?ACT[an]:ACT[an]*Math.min(1,(sol/pk)*1.6)),0,1);
 G={Rp,s0,s,dose,pk,sol,xj,C};
 $('#ipEO').textContent=(e<10?e.toFixed(1):Math.round(e))+' keV';$('#ipDoseO').textContent=sci(dose)+' ions/cm²';
 $('#ipIon').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===ion?'true':'false'));$('#ipAn').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===an?'true':'false'));
 const nm=v=>v>=1000?(v/1000).toFixed(2)+' µm':v>=10?Math.round(v)+' nm':v.toFixed(1)+' nm';
 $('#ipRp').textContent=nm(Rp);$('#ipPk').textContent=sci(pk)+' /cm³';$('#ipXj').textContent=xj?nm(xj):'No junction';$('#ipAct').textContent=Math.round(actF*100)+'%';
 $('#imTag2').textContent=IONS[ion][0].split(' ')[0]+' · '+AN.find(a=>a[0]===an)[1].split(',')[0];
 let t='';if(dose>=I[5])t+='This dose turns the surface layer amorphous: the crystal is shattered. Annealing regrows it from the perfect crystal below. ';
 if(an==='none')t+='Without an anneal, most dopants sit between lattice sites and do nothing, and the damage scatters electrons. ';
 else if(an==='furnace')t+='A long furnace anneal repairs the crystal fully but lets dopants diffuse, deepening the junction. Fine for old nodes, too blurry for 2 nm transistors. ';
 else if(an==='spike')t+='A spike anneal heats the wafer for about a second, enough to activate dopants while limiting diffusion. ';
 else t+='Laser or flash annealing heats only the top micrometre for a millisecond, so dopants barely move and can exceed their normal solubility. ';
 if(pk>sol&&an!=='none')t+='The peak is above what silicon can dissolve at this temperature, so some dopants stay inactive. ';
 if(xj&&xj<20)t+='A junction this shallow suits the source and drain extensions of a modern transistor.';else if(xj&&xj>300)t+='A deep profile like this suits wells, the large doped regions that transistors sit in.';
 $('#ipTxt').textContent=t;draw();}
function draw(){if(!G)return;const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);const L=56,R=12,Tp=12,B=32;const maxX=Math.max(20,(G.Rp+4.5*G.s)*1.15);const lo=15,hi=22.5;
 const X=x=>L+x/maxX*(w-L-R),Y=v=>Tp+(1-(Math.log10(Math.max(v,1e15))-lo)/(hi-lo))*(h-Tp-B);
 c.strokeStyle=T.line;c.lineWidth=1;c.font='11px IBM Plex Mono, monospace';c.fillStyle=T.muted;c.textAlign='right';
 for(let e=15;e<=22;e++){c.beginPath();c.moveTo(L,Y(Math.pow(10,e)));c.lineTo(w-R,Y(Math.pow(10,e)));c.stroke();c.fillText('10'+String(e).replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]),L-6,Y(Math.pow(10,e))+4);}
 for(let i=0;i<=4;i++){c.textAlign=i===4?'right':i===0?'left':'center';const x=maxX*i/4;c.fillText((x>=1000?(x/1000).toFixed(1)+' µm':Math.round(x)+' nm'),X(x),h-14);}
 c.textAlign='center';c.fillText('depth below the surface',(L+w-R)/2,h-2);
 c.fillStyle=rgba(T.muted,.15);c.fillRect(L,Y(5e22),w-L-R,Y(G.sol)-Y(5e22)>0?Y(G.sol)-Y(5e22):0);c.fillStyle=T.muted;c.textAlign='left';c.fillText('solid solubility limit',L+6,Y(G.sol)-4);
 c.strokeStyle=T.muted;c.setLineDash([2,4]);c.beginPath();c.moveTo(L,Y(1e17));c.lineTo(w-R,Y(1e17));c.stroke();c.setLineDash([]);c.fillText('background doping',L+6,Y(1e17)-4);
 const curve=(sg,col,dash,wd)=>{c.strokeStyle=col;c.lineWidth=wd;c.setLineDash(dash);c.beginPath();for(let i=0;i<=200;i++){const x=maxX*i/200;const v=G.C(x,sg);const y=Y(v);i?c.lineTo(X(x),y):c.moveTo(X(x),y);}c.stroke();c.setLineDash([]);};
 if(G.s>G.s0*1.02)curve(G.s0,rgba(T.muted,.8),[5,4],1.5);curve(G.s,T.violet,[],2.5);
 if(G.xj){c.strokeStyle=T['amber-fill'];c.lineWidth=1.5;c.beginPath();c.moveTo(X(G.xj),Tp);c.lineTo(X(G.xj),h-B);c.stroke();c.fillStyle=T.amber;c.textAlign='left';c.fillText('junction',X(G.xj)+4,Tp+12);}
 c.save();c.translate(12,(Tp+h-B)/2);c.rotate(-Math.PI/2);c.fillStyle=T.muted;c.textAlign='center';c.fillText('atoms per cm³',0,0);c.restore();}
watch(cv,draw);run();
})();
}
