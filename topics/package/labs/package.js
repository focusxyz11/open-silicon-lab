/* Lab: PACKAGE */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function pkg(){
const Lz=[
 {id:'sub',name:'Package substrate',col:'#4C6A40',desc:'Organic laminate with copper layers that fans signals and power out to the board. Glass substrates are coming for flatter, finer wiring; Intel and others are moving them toward production.'},
 {id:'c4',name:'C4 solder bumps',col:'#B9C3CA',desc:'Thousands of solder balls join the interposer to the substrate.'},
 {id:'int',name:'Silicon interposer',col:'#7F8C97',desc:'A slab of silicon with very fine wiring that links the dies side by side, with through-silicon vias to the bumps below. CoWoS-L uses small silicon bridges in place of one giant interposer.'},
 {id:'ub',name:'Micro-bumps / hybrid bonds',col:'#D7B46A',desc:'Tiny connections only tens of micrometres apart. Hybrid bonding fuses copper pads directly with no solder for even denser links.'},
 {id:'die',name:'Compute dies (×2)',col:'#2A3944',desc:'Two reticle-size logic dies made on a leading-edge node, joined by a die-to-die link so software sees one GPU.'},
 {id:'hbm',name:'HBM4 stacks (×8)',col:'#5D6B78',desc:'Each stack is a logic base die plus up to 16 DRAM dies linked by through-silicon vias. HBM4 doubles the interface to 2,048 bits, and its base die is now made on a foundry logic process.'}
];
let sel=5;const list=$('#pkList');
Lz.forEach((l,i)=>{const b=document.createElement('button');b.innerHTML='<i style="background:'+l.col+'"></i><span><b>'+l.name+'</b><small>'+l.desc+'</small></span>';b.addEventListener('click',()=>{sel=i;upd();});list.appendChild(b);});
const E=$('#pkE');E.addEventListener('input',upd);
function upd(){[...list.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===sel?'true':'false'));$('#pkEO').textContent=Math.round(E.value*100)+'%';draw();}
function draw(){
 const {ctx:c,w,h}=fit($('#pkCv'));c.clearRect(0,0,w,h);
 const e=+E.value;const gap=e*18;const wide=w>560;
 const k=Math.min((wide?w*0.68:w)/240,h/(140+gap*5+40));const cos=0.866;
 const ox=(wide?w*0.68:w)/2+10*k,oy=h*0.36+gap*1.2*k;
 const P=(x,y,z)=>[ox+(x-y)*cos*k,oy+(x+y)*0.5*k-z*k];
 const poly=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();};
 const box=(x,y,z,W,D,Hh,col,hl)=>{
  poly([P(x+W,y,z),P(x+W,y+D,z),P(x+W,y+D,z+Hh),P(x+W,y,z+Hh)],shade(col,0.8));
  poly([P(x,y+D,z),P(x+W,y+D,z),P(x+W,y+D,z+Hh),P(x,y+D,z+Hh)],shade(col,0.62));
  poly([P(x,y,z+Hh),P(x+W,y,z+Hh),P(x+W,y+D,z+Hh),P(x,y+D,z+Hh)],col);
  if(hl){c.strokeStyle=T.amber;c.lineWidth=2;c.beginPath();[P(x,y,z+Hh),P(x+W,y,z+Hh),P(x+W,y+D,z+Hh),P(x,y+D,z+Hh)].forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.stroke();}
 };
 const bumps=(x0,y0,x1,y1,st,z,col,hl)=>{c.fillStyle=hl?T.amber:col;for(let x=x0;x<=x1;x+=st)for(let y=y0;y<=y1;y+=st){const p=P(x,y,z);c.fillRect(p[0]-1.2,p[1]-1.2,2.4,2.4);}};
 const z=[0,7+gap,9+gap*2,12+gap*3,13+gap*4];
 const anchors=[];
 box(0,0,0,130,110,7,Lz[0].col,sel===0);anchors.push(P(130,0,7));
 bumps(16,14,114,96,7,z[1],Lz[1].col,sel===1);anchors.push(P(114,14,z[1]));
 box(14,12,z[2],102,86,3,Lz[2].col,sel===2);anchors.push(P(116,12,z[2]+3));
 bumps(18,16,112,94,4,z[3],Lz[3].col,sel===3);anchors.push(P(112,16,z[3]));
 const tops=[];
 const hb=[];for(const x of [17,98])for(let j=0;j<4;j++)hb.push([x,15+j*20]);
 const items=[];hb.forEach(([x,y])=>items.push({t:'h',x,y}));items.push({t:'d',x:37,y:22},{t:'d',x:66,y:22});
 items.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
 items.forEach(it=>{
  if(it.t==='d')box(it.x,it.y,z[4],27,66,4,Lz[4].col,sel===4);
  else{const sl=13,ex=e*1.2;for(let s=0;s<sl;s++){const col=s===0?'#3E4954':(s%2?'#6A7885':'#5D6B78');box(it.x,it.y,z[4]+s*(0.75+ex),15,17,0.75,col,sel===5&&s===sl-1);}}
 });
 anchors.push(P(93,22,z[4]+4));anchors.push(P(113,15,z[4]+13*(0.75+e*1.2)));
 if(wide&&e>0.35){c.font='12px IBM Plex Sans, sans-serif';const lx=w*0.7;anchors.forEach((a,i)=>{const ly=a[1];c.strokeStyle=i===sel?T.amber:rgba(T.muted,0.6);c.lineWidth=1;c.beginPath();c.moveTo(a[0]+4,a[1]);c.lineTo(lx-6,ly);c.stroke();c.fillStyle=i===sel?T.ink:T.muted;c.fillText(Lz[i].name,lx,ly+4);});}
}
watch($('#pkCv'),upd);upd();
const BW=[['H100 · HBM3 · 2022',3.35],['H200 · HBM3E · 2024',4.8],['B200 · HBM3E · 2025',8],['Rubin · HBM4 · 2026',22]];
$('#bwBars').innerHTML=BW.map(([n,v],i)=>`<div class="bar"><span>${n}</span><div class="track"><div class="fill${i===3?' hot':''}" style="width:${v/25*100}%"></div><span class="val">${v} TB/s</span></div></div>`).join('');
})();
}
