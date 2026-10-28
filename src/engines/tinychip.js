/* Tiny chip engine: parse, simulate, synthesize, place, route and fault-test small logic designs. */
/* ---- tiny chip engine: parse, simulate, synthesize, place, route, fault-test ---- */
const TC={};
(function(E){
/* projects */
const seg7={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc'};
E.PROJ=[
 {id:'half',t:'Half adder',lvl:'Start here',ins:['a','b'],outs:['sum','carry'],demo:'add',
  d:'Adds two 1-bit numbers: 0+0, 0+1, 1+0 and 1+1. It is the first building block of every calculator and processor.',
  f:v=>({sum:v.a^v.b,carry:v.a&v.b}),
  starter:'// Add two bits, a and b.\n// sum is 1 when exactly one input is 1.\n// carry is 1 when both are 1.\nsum = a ^ b;\ncarry = a & b;',
  sol:'sum = a ^ b;\ncarry = a & b;'},
 {id:'vote',t:'Majority voter',lvl:'Find the bug',ins:['a','b','c'],outs:['y'],demo:'lamp',
  d:'Spacecraft run three copies of a computer and trust whichever answer at least two agree on. The output is 1 when two or more inputs are 1. The starting code has a bug: verification will find it.',
  f:v=>({y:(v.a+v.b+v.c)>=2?1:0}),
  starter:'// y = 1 when at least two of a, b, c are 1.\ny = (a & b) | (b & c);',
  sol:'y = (a & b) | (b & c) | (a & c);'},
 {id:'full',t:'Full adder',lvl:'Find the bug',ins:['a','b','cin'],outs:['sum','cout'],demo:'add',
  d:'Adds three bits: a, b and a carry from the column to the right. Chain them and you can add numbers of any size. The sum line has a bug.',
  f:v=>({sum:v.a^v.b^v.cin,cout:(v.a+v.b+v.cin)>=2?1:0}),
  starter:'// Add a, b and the carry-in.\nsum = a ^ b;\ncout = (a & b) | (cin & (a ^ b));',
  sol:'p = a ^ b;          // a wire: reused twice\nsum = p ^ cin;\ncout = (a & b) | (cin & p);'},
 {id:'add2',t:'2-bit adder',lvl:'Bigger',ins:['a1','a0','b1','b0'],outs:['s2','s1','s0'],demo:'add2',
  d:'Adds two 2-bit numbers (0 to 3 each) to give a 3-bit result (0 to 6), by chaining a half adder and a full adder, exactly as processors chain adders for 64-bit numbers.',
  f:v=>{const s=(v.a1*2+v.a0)+(v.b1*2+v.b0);return {s2:s>>2&1,s1:s>>1&1,s0:s&1};},
  starter:'// Column 0: half adder\ns0 = a0 ^ b0;\nc0 = a0 & b0;\n// Column 1: full adder with carry c0\ns1 = a1 ^ b1 ^ c0;\ns2 = (a1 & b1) | (c0 & (a1 ^ b1));',
  sol:'s0 = a0 ^ b0;\nc0 = a0 & b0;\np1 = a1 ^ b1;\ns1 = p1 ^ c0;\ns2 = (a1 & b1) | (c0 & p1);'},
 {id:'seg',t:'Display decoder',lvl:'Challenge',ins:['x2','x1','x0'],outs:['a','b','c','d','e','f','g'],demo:'seg',
  d:'Turns a 3-bit number (0 to 7) into the seven segments of a digital display, like the ones in clocks and microwaves. Segments a, b and c are done; finish d to g, or let synthesis help.',
  f:v=>{const n=v.x2*4+v.x1*2+v.x0,o={};'abcdefg'.split('').forEach(s=>o[s]=seg7[n].includes(s)?1:0);return o;},
  starter:'// Segments: a top, b top-right, c bottom-right,\n// d bottom, e bottom-left, f top-left, g middle.\na = ~(~x2 & ~x1 & x0) & ~(x2 & ~x1 & ~x0);\nb = ~(x2 & ~x1 & x0) & ~(x2 & x1 & ~x0);\nc = ~(~x2 & x1 & ~x0);\nd = 0;\ne = 0;\nf = 0;\ng = 0;',
  sol:'a = ~(~x2 & ~x1 & x0) & ~(x2 & ~x1 & ~x0);\nb = ~(x2 & ~x1 & x0) & ~(x2 & x1 & ~x0);\nc = ~(~x2 & x1 & ~x0);\nd = ~(~x2 & ~x1 & x0) & ~(x2 & ~x1 & ~x0) & ~(x2 & x1 & x0);\ne = ~x0 & (~x2 | x1);\nf = (~x1 & ~x0) | (x2 & ~x1) | (x2 & ~x0);\ng = (~x2 & x1) | (x2 & ~x1) | (x2 & ~x0);'},
 {id:'free',t:'Your own design',lvl:'Free play',ins:['a','b','c','d'],outs:['y','z'],demo:'lamp',spec:false,
  d:'No specification: four inputs, two outputs, any logic you like. Verification shows what your circuit does instead of checking it.',
  f:null,starter:'// Write any logic using a, b, c and d.\ny = (a | b) & ~(c ^ d);\nz = a ^ b ^ c ^ d;   // 1 when an odd number of inputs are 1',sol:null}
];
/* cell library: transistors, width in sites, delay ps at 130 nm */
E.LIB={INV:[2,2,60],BUF:[4,3,110],NAND2:[4,3,80],NOR2:[4,3,110],AND2:[6,4,140],OR2:[6,4,160],XOR2:[12,6,200],XNOR2:[12,6,200],TIE0:[2,2,0],TIE1:[2,2,0]};

/* ---- parser ---- */
E.parse=function(src,ins,outs){
 const errs=[],asg={},order=[],lines=src.split('\n');
 const isName=s=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(s);
 lines.forEach((raw,li)=>{let line=raw.replace(/\/\/.*$/,'').trim();if(!line)return;
  line.split(';').map(x=>x.trim()).filter(Boolean).forEach(st=>{
   st=st.replace(/^(assign|wire|logic)\s+/,'');
   const m=/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/.exec(st);
   if(!m){errs.push({l:li+1,m:'Expected "name = expression".'});return;}
   const nm=m[1];if(ins.includes(nm)){errs.push({l:li+1,m:'"'+nm+'" is an input; inputs come from outside the chip and cannot be assigned.'});return;}
   if(asg[nm]){errs.push({l:li+1,m:'"'+nm+'" is assigned twice. In hardware each wire has exactly one driver.'});return;}
   let toks=[],s=m[2],i=0;
   while(i<s.length){const ch=s[i];if(/\s/.test(ch)){i++;continue;}
    if('&|^~()!'.includes(ch)){toks.push(ch==='!'?'~':ch);i++;continue;}
    if(ch==='+'){toks.push('|');i++;continue;}
    const mm=/^[A-Za-z_][A-Za-z0-9_]*|^[01]/.exec(s.slice(i));if(mm){toks.push(mm[0]);i+=mm[0].length;continue;}
    errs.push({l:li+1,m:'Unexpected character "'+ch+'". Use & (AND), | (OR), ^ (XOR) and ~ (NOT).'});return;}
   let p=0;const peek=()=>toks[p];
   const bad=msg=>{throw new Error(msg);};
   function prim(){const t=toks[p++];if(t===undefined)bad('The expression ends too early.');
    if(t==='~')return {op:'not',a:prim()};
    if(t==='('){const e=orx();if(toks[p++]!==')')bad('A closing bracket ")" is missing.');return e;}
    if(t==='0'||t==='1')return {op:'const',v:+t};
    if(isName(t))return {op:'var',n:t};
    bad('Unexpected "'+t+'".');}
   function andx(){let a=prim();while(peek()==='&'){p++;a={op:'and',a,b:prim()};}return a;}
   function xorx(){let a=andx();while(peek()==='^'){p++;a={op:'xor',a,b:andx()};}return a;}
   function orx(){let a=xorx();while(peek()==='|'){p++;a={op:'or',a,b:xorx()};}return a;}
   try{const e=orx();if(p<toks.length)bad('Unexpected "'+toks[p]+'". Is an operator missing?');asg[nm]={e,l:li+1};order.push(nm);}
   catch(x){errs.push({l:li+1,m:x.message});}
  });});
 const used=new Set();const walk=e=>{if(!e)return;if(e.op==='var')used.add(e.n);walk(e.a);walk(e.b);};
 Object.values(asg).forEach(a=>walk(a.e));
 used.forEach(n=>{if(!ins.includes(n)&&!asg[n])errs.push({l:Object.values(asg).find(a=>{let f=false;const w=e=>{if(!e)return;if(e.op==='var'&&e.n===n)f=true;w(e.a);w(e.b);};w(a.e);return f;}).l,m:'"'+n+'" is used but never defined. Inputs are '+ins.join(', ')+'.'});});
 outs.forEach(o=>{if(!asg[o])errs.push({l:0,m:'Output "'+o+'" is never assigned.'});});
 /* loops */
 const state={};let loop=null;const dfs=n=>{if(loop)return;if(state[n]===1){loop=n;return;}if(state[n]===2||!asg[n])return;state[n]=1;const deps=new Set();const w=e=>{if(!e)return;if(e.op==='var')deps.add(e.n);w(e.a);w(e.b);};w(asg[n].e);deps.forEach(dfs);state[n]=2;};
 Object.keys(asg).forEach(dfs);if(loop)errs.push({l:asg[loop].l,m:'"'+loop+'" depends on itself, making a loop. Logic without a clock must flow in one direction.'});
 const warns=[];Object.keys(asg).forEach(n=>{if(!outs.includes(n)&&!used.has(n))warns.push('"'+n+'" is computed but never used, so synthesis will remove it.');});
 return {errs,warns,asg,order};
};
E.evalDesign=function(d,v){const memo=Object.assign({},v);const ev=e=>{switch(e.op){case 'const':return e.v;case 'var':if(!(e.n in memo))memo[e.n]=ev(d.asg[e.n].e);return memo[e.n];case 'not':return 1-ev(e.a);case 'and':return ev(e.a)&ev(e.b);case 'or':return ev(e.a)|ev(e.b);case 'xor':return ev(e.a)^ev(e.b);}};
 const o={};Object.keys(d.asg).forEach(n=>{o[n]=ev({op:'var',n});});return o;};
E.vectors=ins=>{const n=ins.length,V=[];for(let k=0;k<(1<<n);k++){const v={};ins.forEach((x,i)=>v[x]=(k>>(n-1-i))&1);V.push(v);}return V;};

/* ---- synthesis ---- */
/* netlist: nodes[] {id,t:'IN'|'C0'|'C1'|op,ins:[ids],name?}; outs {name:id} */
function builder(){const nodes=[],key={};
 const add=(t,ins,name)=>{if(t==='and'||t==='or'||t==='xor')ins=ins.slice().sort((a,b)=>a-b);const k=t+':'+ins.join(',');if(t!=='IN'&&key[k]!==undefined)return key[k];const id=nodes.length;nodes.push({id,t,ins,name});if(t!=='IN')key[k]=id;return id;};
 const C=v=>add(v?'C1':'C0',[]);
 const mk=(t,a,b)=>{const na=nodes[a],nb=b!==undefined?nodes[b]:null;
  if(t==='not'){if(na.t==='C0')return C(1);if(na.t==='C1')return C(0);if(na.t==='not')return na.ins[0];return add('not',[a]);}
  const c0a=na.t==='C0',c1a=na.t==='C1',c0b=nb.t==='C0',c1b=nb.t==='C1';
  if(t==='and'){if(c0a||c0b)return C(0);if(c1a)return b;if(c1b)return a;if(a===b)return a;if((na.t==='not'&&na.ins[0]===b)||(nb.t==='not'&&nb.ins[0]===a))return C(0);}
  if(t==='or'){if(c1a||c1b)return C(1);if(c0a)return b;if(c0b)return a;if(a===b)return a;if((na.t==='not'&&na.ins[0]===b)||(nb.t==='not'&&nb.ins[0]===a))return C(1);}
  if(t==='xor'){if(c0a)return b;if(c0b)return a;if(c1a)return mk('not',b);if(c1b)return mk('not',a);if(a===b)return C(0);}
  return add(t,[a,b]);};
 return {nodes,add,mk,C};}
function fromDesign(d,ins,outs){const B=builder();const env={};ins.forEach(n=>env[n]=B.add('IN',[],n));
 const go=e=>{switch(e.op){case 'const':return B.C(e.v);case 'var':if(env[e.n]===undefined)env[e.n]=go(d.asg[e.n].e);return env[e.n];case 'not':return B.mk('not',go(e.a));default:return B.mk(e.op,go(e.a),go(e.b));}};
 const o={};outs.forEach(n=>o[n]=go({op:'var',n}));return {B,outs:o};}
/* Quine-McCluskey minimal SOP */
function qm(n,ones){if(!ones.length)return [];if(ones.length===(1<<n))return [{m:0,v:0}];
 let groups=ones.map(x=>({v:x,m:0,c:[x]}));let primes=[];
 while(groups.length){const used=new Set(),next=[],seen=new Set();
  for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){const a=groups[i],b=groups[j];if(a.m!==b.m)continue;const d=a.v^b.v;if(d&&(d&(d-1))===0){const t={v:a.v&~d,m:a.m|d,c:a.c.concat(b.c)};const k=t.v+'/'+t.m;used.add(i);used.add(j);if(!seen.has(k)){seen.add(k);next.push(t);}}}
  groups.forEach((g,i)=>{if(!used.has(i))primes.push(g);});groups=next;}
 const uniq={};primes.forEach(p=>{uniq[p.v+'/'+p.m]=p;});primes=Object.values(uniq);
 const covers=(p,x)=>(x&~p.m)===p.v;let left=new Set(ones),chosen=[];
 /* essential first, then greedy */
 let changed=true;while(changed){changed=false;for(const x of [...left]){const ps=primes.filter(p=>covers(p,x));if(ps.length===1&&!chosen.includes(ps[0])){chosen.push(ps[0]);ones.forEach(y=>{if(covers(ps[0],y))left.delete(y);});changed=true;}}}
 while(left.size){let best=null,bc=-1;primes.forEach(p=>{if(chosen.includes(p))return;let c=0;left.forEach(x=>{if(covers(p,x))c++;});const lits=n-popc(p.m);const score=c*10-lits;if(c>0&&score>bc){bc=score;best=p;}});chosen.push(best);[...left].forEach(x=>{if(covers(best,x))left.delete(x);});}
 return chosen;}
const popc=x=>{let c=0;while(x){c+=x&1;x>>=1;}return c;};
function fromSOP(d,ins,outs){const B=builder();const n=ins.length;const ids=ins.map(nm=>B.add('IN',[],nm));const V=E.vectors(ins);const o={};
 outs.forEach(on=>{const ones=[];V.forEach((v,k)=>{if(E.evalDesign(d,v)[on])ones.push(k);});const terms=qm(n,ones);
  if(!terms.length){o[on]=B.C(0);return;}
  let acc=null;terms.forEach(t=>{let p=null;if(t.m===(1<<n)-1){p=B.C(1);}for(let i=0;i<n;i++){const bit=1<<(n-1-i);if(t.m&bit)continue;const lit=(t.v&bit)?ids[i]:B.mk('not',ids[i]);p=p===null?lit:B.mk('and',p,lit);}acc=acc===null?p:B.mk('or',acc,p);});o[on]=acc;});
 return {B,outs:o};}
/* technology mapping to cells */
function mapCells(G,lib){const N=G.B.nodes;const live=new Set();const mark=id=>{if(live.has(id))return;live.add(id);N[id].ins.forEach(mark);};Object.values(G.outs).forEach(mark);
 const fan={};N.forEach(nd=>{if(live.has(nd.id))nd.ins.forEach(i=>fan[i]=(fan[i]||0)+1);});Object.values(G.outs).forEach(i=>fan[i]=(fan[i]||0)+1);
 const cells=[];const drv={};/* node id -> net id */
 let netN=0;const net=()=>netN++;
 const inputs=[];N.forEach(nd=>{if(nd.t==='IN'){const k=net();drv[nd.id]=k;inputs.push({name:nd.name,net:k});}});
 const emit=(type,insNets)=>{const o=net();cells.push({type,ins:insNets,out:o});return o;};
 const getNet=id=>{if(drv[id]!==undefined)return drv[id];const nd=N[id];let o;
  if(nd.t==='C0'||nd.t==='C1')o=emit(nd.t==='C0'?'TIE0':'TIE1',[]);
  else if(lib==='nand'){
   if(nd.t==='not'){const a=getNet(nd.ins[0]);o=emit('NAND2',[a,a]);}
   else if(nd.t==='and'){const a=getNet(nd.ins[0]),b=getNet(nd.ins[1]);const x=emit('NAND2',[a,b]);o=emit('NAND2',[x,x]);}
   else if(nd.t==='or'){const a=getNet(nd.ins[0]),b=getNet(nd.ins[1]);const na=emit('NAND2',[a,a]),nb=emit('NAND2',[b,b]);o=emit('NAND2',[na,nb]);}
   else if(nd.t==='xor'){const a=getNet(nd.ins[0]),b=getNet(nd.ins[1]);const x=emit('NAND2',[a,b]);const p=emit('NAND2',[a,x]),q=emit('NAND2',[b,x]);o=emit('NAND2',[p,q]);}
  }else{
   if(nd.t==='not'){const src=N[nd.ins[0]];if(['and','or','xor'].includes(src.t)&&fan[src.id]===1){const a=getNet(src.ins[0]),b=getNet(src.ins[1]);o=emit({and:'NAND2',or:'NOR2',xor:'XNOR2'}[src.t],[a,b]);}else o=emit('INV',[getNet(nd.ins[0])]);}
   else o=emit({and:'AND2',or:'OR2',xor:'XOR2'}[nd.t],[getNet(nd.ins[0]),getNet(nd.ins[1])]);
  }
  drv[id]=o;return o;};
 const outs=[];Object.entries(G.outs).forEach(([name,id])=>{let k=getNet(id);if(N[id].t==='IN'||outs.some(x=>x.net===k))k=emit('BUF',[k]);outs.push({name,net:k});});
 return {cells,inputs,outs,nets:netN};}
function stats(M,node){const f=E.NODE[node].dly;let tr=0;M.cells.forEach(c=>tr+=E.LIB[c.type][0]);
 const arr={};M.inputs.forEach(i=>arr[i.net]=0);const lvl={};M.inputs.forEach(i=>lvl[i.net]=0);
 const byOut={};M.cells.forEach(c=>byOut[c.out]=c);
 const at=n=>{if(arr[n]!==undefined)return arr[n];const c=byOut[n];const a=Math.max(0,...c.ins.map(at));lvl[n]=Math.max(0,...c.ins.map(i=>lvl[i]))+1;arr[n]=a+E.LIB[c.type][2]*f+10*f;return arr[n];};
 let crit=0,depth=0;M.outs.forEach(o=>{crit=Math.max(crit,at(o.net));depth=Math.max(depth,lvl[o.net]);});
 const ovh=450*f;return {cells:M.cells.length,tr,crit,depth,fmax:1e6/(crit+ovh)};}
E.NODE={'180':{t:'180 nm',dly:1.45,site:[0.56,5.04],masks:22,mask$:0.2,shuttle:true,wafer:200,d0:0.08,days:1.1},'130':{t:'130 nm',dly:1,site:[0.46,2.72],masks:26,mask$:0.4,shuttle:true,wafer:200,d0:0.1,days:1.1},'28':{t:'28 nm',dly:0.3,site:[0.136,1.2],masks:45,mask$:2,shuttle:true,wafer:300,d0:0.07,days:1.2},'3':{t:'3 nm',dly:0.1,site:[0.048,0.169],masks:80,mask$:18,shuttle:false,wafer:300,d0:0.1,days:1.4}};
E.synth=function(d,ins,outs,lib,opt,node){const A=mapCells(fromDesign(d,ins,outs),lib);let M=A,used='yours',alt=null;
 if(opt){const B=mapCells(fromSOP(d,ins,outs),lib);const ta=stats(A,node).tr,tb=stats(B,node).tr;alt={yours:ta,sop:tb};if(tb<ta){M=B;used='sop';}}
 return {M,used,alt,st:stats(M,node)};};
E.stats=stats;
E.simCells=function(M,v,fault){const val={};M.inputs.forEach(i=>val[i.net]=v[i.name]);if(fault&&val[fault.net]!==undefined)val[fault.net]=fault.v;
 M.cells.forEach(c=>{const x=c.ins.map(n=>val[n]);let o;switch(c.type){case 'INV':o=1-x[0];break;case 'BUF':o=x[0];break;case 'NAND2':o=1-(x[0]&x[1]);break;case 'NOR2':o=1-(x[0]|x[1]);break;case 'AND2':o=x[0]&x[1];break;case 'OR2':o=x[0]|x[1];break;case 'XOR2':o=x[0]^x[1];break;case 'XNOR2':o=1-(x[0]^x[1]);break;case 'TIE0':o=0;break;case 'TIE1':o=1;break;}
  if(fault&&fault.net===c.out)o=fault.v;val[c.out]=o;});
 const out={};M.outs.forEach(o=>out[o.name]=val[o.net]);return {out,val};};

/* ---- placement ---- */
E.place=function(M,util,seed){const R=(function(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(seed||1);
 const C=M.cells.map((c,i)=>({i,w:E.LIB[c.type][1]}));const tot=C.reduce((s,c)=>s+c.w,0);
 const area=tot/util;let rows=Math.max(1,Math.round(Math.sqrt(area/6)));let W=Math.ceil(area/rows);W=Math.max(W,Math.max(...C.map(c=>c.w))+1);
 /* rows as ordered lists */
 const rowsL=Array.from({length:rows},()=>[]);let r=0;C.slice().sort(()=>R()-.5).forEach(c=>{let tries=0;while(rowsL[r].reduce((s,x)=>s+x.w,0)+c.w>W&&tries<rows){r=(r+1)%rows;tries++;}if(tries>=rows){W+=c.w;}rowsL[r].push(c);r=(r+1)%rows;});
 const pos={};const pack=k=>{const L=rowsL[k];const used=L.reduce((s,x)=>s+x.w,0);const gap=(W-used)/(L.length+1);let x=gap;L.forEach(c=>{pos[c.i]={x:Math.round(x),r:k,w:c.w};x+=c.w+gap;});
  /* fix overlaps from rounding */let cur=0;L.forEach(c=>{if(pos[c.i].x<cur)pos[c.i].x=cur;cur=pos[c.i].x+c.w;});if(cur>W){let e=W;for(let j=L.length-1;j>=0;j--){const p=pos[L[j].i];if(p.x+p.w>e)p.x=e-p.w;e=p.x;}}};
 for(let k=0;k<rows;k++)pack(k);
 /* nets: driver cell/IO and sinks */
 const TR=util>=0.8?3:4,H=rows*TR+2,GW=W+4;
 const ioIn={},ioOut={};M.inputs.forEach((p,k)=>ioIn[p.net]={x:0,y:Math.round((k+1)*(H-1)/(M.inputs.length+1))});M.outs.forEach((p,k)=>ioOut[p.name]={x:GW-1,y:Math.round((k+1)*(H-1)/(M.outs.length+1)),net:p.net});
 let PP=null;const pinXY=(ci,pin)=>{const p=(PP||pos)[ci],c=M.cells[ci],w=p.w;const y=p.r*TR+2;let dx;if(pin==='o')dx=w-1;else{const n=c.ins.length;dx=n===1?0:(pin===0?0:Math.min(w-2,Math.max(1,Math.floor((w-1)/2))));}return {x:2+p.x+dx,y};};
 const netPins=(pp)=>{PP=pp||null;const P={};const addp=(n,pt,kind)=>{(P[n]=P[n]||[]).push(Object.assign({k:kind},pt));};
  M.inputs.forEach(p=>addp(p.net,ioIn[p.net],'d'));M.cells.forEach((c,ci)=>{addp(c.out,pinXY(ci,'o'),'d');c.ins.forEach((n,k)=>{if(k===1&&c.ins[0]===n)return;addp(n,pinXY(ci,k),'s');});});
  Object.values(ioOut).forEach(o=>addp(o.net,{x:o.x,y:o.y},'s'));PP=null;return P;};
 const hpwl=()=>{const P=netPins();let s=0;Object.values(P).forEach(L=>{if(L.length<2)return;const xs=L.map(p=>p.x),ys=L.map(p=>p.y);s+=Math.max(...xs)-Math.min(...xs)+Math.max(...ys)-Math.min(...ys);});return s;};
 const snapshot=()=>JSON.parse(JSON.stringify(pos));
 const anneal=(steps,cb)=>{let cost=hpwl(),T=Math.max(2,cost/8);const hist=[cost];
  for(let s=0;s<steps;s++){const r1=Math.floor(R()*rows),r2=Math.floor(R()*rows);const L1=rowsL[r1],L2=rowsL[r2];if(!L1.length||!L2.length)continue;const i1=Math.floor(R()*L1.length),i2=Math.floor(R()*L2.length);
   const a=L1[i1],b=L2[i2];if(a===b)continue;const u2=L2.reduce((t,x)=>t+x.w,0)-b.w+a.w,u1=L1.reduce((t,x)=>t+x.w,0)-a.w+b.w;if(r1!==r2&&(u1>W||u2>W))continue;
   L1[i1]=b;L2[i2]=a;pack(r1);if(r2!==r1)pack(r2);const nc=hpwl();if(nc<=cost||R()<Math.exp((cost-nc)/T)){cost=nc;}else{L1[i1]=a;L2[i2]=b;pack(r1);if(r2!==r1)pack(r2);}
   T*=0.995;if(s%Math.max(1,Math.floor(steps/40))===0){hist.push(cost);if(cb)cb(snapshot(),cost);}}
  return hist;};
 return {pos,rows,W,H,GW,TR,ioIn,ioOut,netPins,hpwl,anneal,snapshot};};

/* ---- routing: 2 layers (0: horizontal M2, 1: vertical M3) ---- */
E.route=function(PL){const {GW,H}=PL;const P=PL.netPins();const occ=new Int32Array(GW*H*2).fill(-1);const idx=(x,y,l)=>(y*GW+x)*2+l;
 const pinOwn=new Int32Array(GW*H).fill(-1);Object.entries(P).forEach(([n,L])=>L.forEach(p=>{pinOwn[p.y*GW+p.x]=+n;}));
 const nets=Object.entries(P).filter(([n,L])=>L.length>=2).map(([n,L])=>({n:+n,L,h:Math.max(...L.map(p=>p.x))-Math.min(...L.map(p=>p.x))+Math.max(...L.map(p=>p.y))-Math.min(...L.map(p=>p.y))}));
 const paths={},failed=[];
 const routeNet=(nt)=>{const tree=new Set();const segs=[];const d=nt.L.find(p=>p.k==='d')||nt.L[0];const rest=nt.L.filter(p=>p!==d).sort((a,b)=>(Math.abs(a.x-d.x)+Math.abs(a.y-d.y))-(Math.abs(b.x-d.x)+Math.abs(b.y-d.y)));
  [0,1].forEach(l=>tree.add(idx(d.x,d.y,l)));let ok=true;
  for(const t of rest){/* dijkstra from tree to target */const N=GW*H*2,dist=new Float32Array(N).fill(1e9),prev=new Int32Array(N).fill(-1);const Q=[];
   tree.forEach(i=>{dist[i]=0;Q.push([0,i]);});const tgt=new Set([idx(t.x,t.y,0),idx(t.x,t.y,1)]);let found=-1;
   while(Q.length){let bi=0;for(let k=1;k<Q.length;k++)if(Q[k][0]<Q[bi][0])bi=k;const [dd,i]=Q[bi];Q[bi]=Q[Q.length-1];Q.pop();if(dd>dist[i])continue;if(tgt.has(i)){found=i;break;}
    const l=i%2,cell=(i-l)/2,x=cell%GW,y=(cell-x)/GW;const nb=[];if(l===0){if(x>0)nb.push([x-1,y,0,1]);if(x<GW-1)nb.push([x+1,y,0,1]);}else{if(y>0)nb.push([x,y-1,1,1]);if(y<H-1)nb.push([x,y+1,1,1]);}nb.push([x,y,1-l,2.5]);
    for(const [nx,ny,nl,c] of nb){const j=idx(nx,ny,nl);const own=occ[j];if(own!==-1&&own!==nt.n)continue;const po=pinOwn[ny*GW+nx];if(po!==-1&&po!==nt.n)continue;const nd2=dd+c;if(nd2<dist[j]){dist[j]=nd2;prev[j]=i;Q.push([nd2,j]);}}}
   if(found<0){ok=false;continue;}
   let k=found;const path=[];while(k!==-1&&!tree.has(k)){path.push(k);k=prev[k];}if(k!==-1)path.push(k);path.reverse();path.forEach(i=>{tree.add(i);occ[i]=nt.n;});segs.push(path);}
  return {ok,segs};};
 const order=nets.slice().sort((a,b)=>a.h-b.h);
 order.forEach(nt=>{const r=routeNet(nt);paths[nt.n]=r.segs;if(!r.ok)failed.push(nt.n);});
 let ordc=order;for(let it=0;it<5&&failed.length;it++){/* rip up and reroute, failed nets first */occ.fill(-1);const f=new Set(failed);failed.length=0;ordc=ordc.filter(n=>f.has(n.n)).concat(ordc.filter(n=>!f.has(n.n)));ordc.forEach(nt=>{const r=routeNet(nt);paths[nt.n]=r.segs;if(!r.ok)failed.push(nt.n);});}
 let wl=0,vias=0;Object.values(paths).forEach(S=>S.forEach(p=>{for(let k=1;k<p.length;k++){if(p[k]%2!==p[k-1]%2)vias++;else wl++;}}));
 return {paths,failed,wl,vias,GW,H,P};};

/* ---- fault coverage: stuck-at on every net ---- */
E.faults=function(M,vecs){const golden=vecs.map(v=>E.simCells(M,v).out);const F=[];for(let n=0;n<M.nets;n++)for(const sv of [0,1])F.push({net:n,v:sv});
 let det=0;const detected=F.map(f=>{for(let k=0;k<vecs.length;k++){const o=E.simCells(M,vecs[k],f).out;for(const key in o)if(o[key]!==golden[k][key])return k;}return -1;});detected.forEach(x=>{if(x>=0)det++;});
 return {F,detected,cov:F.length?det/F.length:1};};
})(TC);
export default TC;
