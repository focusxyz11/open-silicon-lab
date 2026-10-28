/* Lab: FULL ADDER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function fa(){
const st={a:1,b:0,cin:1};
const and=(x,y)=>`M${x},${y-20} h28 a20,20 0 0 1 0,40 h-28 z`;
const or=(x,y)=>`M${x},${y-20} Q${x+16},${y} ${x},${y+20} Q${x+38},${y+20} ${x+58},${y} Q${x+38},${y-20} ${x},${y-20} Z`;
const xor=(x,y)=>or(x+6,y)+` M${x},${y-20} Q${x+16},${y} ${x},${y+20}`;
const W={
 a:['M40,60 H110 V75 H154','M110,60 H100 V140 H154'],
 b:['M40,110 H120 V95 H154','M120,110 V160 H154'],
 cin:['M40,240 H280 V120 H334','M280,210 H334'],
 p:['M212,85 H260 V100 H334','M260,100 V190 H334'],
 g:['M210,150 H440 V165 H474'],
 q:['M390,200 H440 V185 H474'],
 sum:['M392,110 H590'],
 cout:['M532,175 H590']
};
let svg='<svg viewBox="0 0 640 270" role="img" aria-label="Full adder gate diagram">';
for(const k in W)W[k].forEach(d=>{svg+=`<path data-s="${k}" d="${d}" fill="none" stroke-width="3" stroke-linejoin="round"/>`;});
const gates=[['xor',150,85,'XOR'],['and',150,150,'AND'],['xor',330,110,'XOR'],['and',330,200,'AND'],['or',470,175,'OR']];
gates.forEach(([g,x,y,l])=>{const d=g==='and'?and(x+4,y):g==='or'?or(x+4,y):xor(x+4,y);svg+=`<path d="${d}" class="gate" stroke-width="2"/><text x="${x+22}" y="${y+4}" class="gl">${l}</text>`;});
[['a',60,'A'],['b',110,'B'],['cin',240,'Cin']].forEach(([k,y,l])=>{svg+=`<g class="in" data-k="${k}" tabindex="0" role="button" aria-label="Toggle ${l}" style="cursor:pointer"><circle cx="28" cy="${y}" r="13" data-s="${k}" class="node"/><text x="28" y="${y+4}" class="nv" data-v="${k}">0</text><text x="${k==='cin'?2:6}" y="${y-18}" class="nl">${l}</text></g>`;});
[['sum',110,'Sum'],['cout',175,'Cout']].forEach(([k,y,l])=>{svg+=`<circle cx="604" cy="${y}" r="13" data-s="${k}" class="node"/><text x="604" y="${y+4}" class="nv" data-v="${k}">0</text><text x="592" y="${y-18}" class="nl">${l}</text>`;});
svg+='<text x="226" y="78" class="wl">P = A⊕B</text><text x="226" y="143" class="wl">G = A·B</text><text x="400" y="196" class="wl">Q</text></svg>';
$('#faWrap').innerHTML=svg;
const el=$('#faWrap svg');
const btns=$('#faBtns');
['a','b','cin'].forEach(k=>{const b=document.createElement('button');b.className='btn';b.dataset.k=k;b.addEventListener('click',()=>{st[k]^=1;upd();});btns.appendChild(b);});
el.querySelectorAll('.in').forEach(g=>{const k=g.dataset.k;g.addEventListener('click',()=>{st[k]^=1;upd();});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();st[k]^=1;upd();}});});
let tbl='<tr><th>A</th><th>B</th><th>Cin</th><th>Sum</th><th>Cout</th></tr>';
for(let i=0;i<8;i++){const a=i>>2&1,b=i>>1&1,c=i&1;tbl+=`<tr data-r="${i}"><td>${a}</td><td>${b}</td><td>${c}</td><td>${a^b^c}</td><td>${(a&b)|(c&(a^b))}</td></tr>`;}
$('#faTable').innerHTML=tbl;
function upd(){
 const p=st.a^st.b,g=st.a&st.b,q=p&st.cin,v={a:st.a,b:st.b,cin:st.cin,p,g,q,sum:p^st.cin,cout:g|q};
 el.querySelectorAll('[data-s]').forEach(n=>{const on=v[n.dataset.s];if(n.tagName==='path'){n.setAttribute('stroke',on?T.amber:T.muted);n.setAttribute('stroke-opacity',on?1:0.55);}else{n.setAttribute('fill',on?T['amber-fill']:T.surface);n.setAttribute('stroke',on?T.amber:T.muted);n.setAttribute('stroke-width','2');}});
 el.querySelectorAll('[data-v]').forEach(n=>{n.textContent=v[n.dataset.v];n.setAttribute('fill',T.ink);});
 el.querySelectorAll('.gate').forEach(n=>{n.setAttribute('fill',T.surface);n.setAttribute('stroke',T.ink);});
 el.querySelectorAll('.gl').forEach(n=>{n.setAttribute('fill',T.muted);n.setAttribute('font-size','10');n.setAttribute('font-family','IBM Plex Mono, monospace');});
 el.querySelectorAll('.nv').forEach(n=>{n.setAttribute('text-anchor','middle');n.setAttribute('font-size','13');n.setAttribute('font-weight','600');n.setAttribute('font-family','IBM Plex Mono, monospace');});
 el.querySelectorAll('.nl,.wl').forEach(n=>{n.setAttribute('fill',T.muted);n.setAttribute('font-size','12');n.setAttribute('font-family','IBM Plex Mono, monospace');});
 [...btns.children].forEach(b=>{const k=b.dataset.k;b.textContent=(k==='cin'?'Cin':k.toUpperCase())+' = '+st[k];b.setAttribute('aria-pressed',st[k]?'true':'false');});
 const row=st.a<<2|st.b<<1|st.cin;$('#faTable').querySelectorAll('tr[data-r]').forEach(r=>r.classList.toggle('cur',+r.dataset.r===row));
}
redraws.push(upd);upd();
})();
}
