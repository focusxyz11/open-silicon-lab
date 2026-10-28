/* A small RISC-V (RV32I + M + custom-0) assembler and simulator. Pure logic, no DOM. */
const RV=(function(){
const ABI=['zero','ra','sp','gp','tp','t0','t1','t2','s0','s1','a0','a1','a2','a3','a4','a5','a6','a7','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','t3','t4','t5','t6'];
const REG={};ABI.forEach((n,i)=>{REG[n]=i;REG['x'+i]=i;});REG.fp=8;
const R={add:[0,0x00,0x33],sub:[0,0x20,0x33],sll:[1,0,0x33],slt:[2,0,0x33],sltu:[3,0,0x33],xor:[4,0,0x33],srl:[5,0,0x33],sra:[5,0x20,0x33],or:[6,0,0x33],and:[7,0,0x33],
 mul:[0,1,0x33,'M'],mulh:[1,1,0x33,'M'],div:[4,1,0x33,'M'],rem:[6,1,0x33,'M'],mac:[0,0,0x0B,'MAC'],dot4:[1,0,0x0B,'DOT4']};
const I={addi:0,slti:2,sltiu:3,xori:4,ori:6,andi:7};
const SH={slli:[1,0],srli:[5,0],srai:[5,0x20]};
const LD={lb:0,lh:1,lw:2,lbu:4,lhu:5},ST={sb:0,sh:1,sw:2};
const BR={beq:0,bne:1,blt:4,bge:5,bltu:6,bgeu:7};
/* parse ------------------------------------------------------------- */
function assemble(src,opt){opt=opt||{};const ext=opt.ext||{};const syms=Object.assign({},opt.syms||{});const errs=[];const items=[];const labels={};
 const lines=src.split('\n');
 lines.forEach((raw,li)=>{let line=raw.replace(/(#|\/\/|;).*$/,'').trim();if(!line)return;
  let m;while((m=/^([A-Za-z_.][\w.]*)\s*:\s*/.exec(line))){if(labels[m[1]]!==undefined)errs.push({l:li+1,m:'Label "'+m[1]+'" is defined twice.'});labels[m[1]]=items.length;line=line.slice(m[0].length);}
  if(!line)return;const sp=line.search(/\s/);const op=(sp<0?line:line.slice(0,sp)).toLowerCase();const args=sp<0?[]:line.slice(sp).split(',').map(s=>s.trim()).filter(s=>s.length);
  items.push({op,args,l:li+1,src:raw.trim()});});
 /* expand pseudo-instructions (count first so labels index real instructions) */
 const out=[];const lab2={};const idxMap=[];
 const val=(s,l)=>{s=s.trim();let neg=false;if(s[0]==='-'){neg=true;s=s.slice(1);}let v;if(/^0x[0-9a-f]+$/i.test(s))v=parseInt(s,16);else if(/^0b[01]+$/i.test(s))v=parseInt(s.slice(2),2);else if(/^\d+$/.test(s))v=parseInt(s,10);else if(syms[s]!==undefined)v=syms[s];else if(/^'.'$/.test(s))v=s.charCodeAt(1);else return null;return neg?-v:v;};
 items.forEach((it,k)=>{idxMap[k]=out.length;const a=it.args;let o=it.op;const push=(op,args)=>out.push({op,args,l:it.l,src:it.src,pseudo:o!==op?o:null});
  switch(o){
   case 'nop':push('addi',['x0','x0','0']);break;
   case 'mv':push('addi',[a[0],a[1],'0']);break;
   case 'not':push('xori',[a[0],a[1],'-1']);break;
   case 'neg':push('sub',[a[0],'x0',a[1]]);break;
   case 'li':{const v=val(a[1]||'',it.l);if(v!==null&&(v<-2048||v>2047)){const lo=((v&0xfff)<<20)>>20;const hi=((v-lo)>>>12)&0xfffff;push('lui',[a[0],String(hi)]);if(lo)push('addi',[a[0],a[0],String(lo)]);}else push('addi',[a[0],'x0',a[1]||'']);break;}
   case 'la':{const v=val(a[1]||'',it.l);if(v!==null&&(v<-2048||v>2047)){const lo=((v&0xfff)<<20)>>20;const hi=((v-lo)>>>12)&0xfffff;push('lui',[a[0],String(hi)]);if(lo)push('addi',[a[0],a[0],String(lo)]);}else push('addi',[a[0],'x0',a[1]||'']);break;}
   case 'j':push('jal',['x0',a[0]]);break;
   case 'jr':push('jalr',['x0',a[0],'0']);break;
   case 'ret':push('jalr',['x0','ra','0']);break;
   case 'call':push('jal',['ra',a[0]]);break;
   case 'beqz':push('beq',[a[0],'x0',a[1]]);break;
   case 'bnez':push('bne',[a[0],'x0',a[1]]);break;
   case 'blez':push('bge',['x0',a[0],a[1]]);break;
   case 'bgez':push('bge',[a[0],'x0',a[1]]);break;
   case 'bltz':push('blt',[a[0],'x0',a[1]]);break;
   case 'bgtz':push('blt',['x0',a[0],a[1]]);break;
   case 'bgt':push('blt',[a[1],a[0],a[2]]);break;
   case 'ble':push('bge',[a[1],a[0],a[2]]);break;
   case 'bgtu':push('bltu',[a[1],a[0],a[2]]);break;
   case 'bleu':push('bgeu',[a[1],a[0],a[2]]);break;
   case 'jal':if(a.length===1)push('jal',['ra',a[0]]);else push('jal',a);break;
   default:push(o,a);}
 });
 Object.entries(labels).forEach(([n,k])=>{lab2[n]=k<items.length?idxMap[k]:out.length;});
 /* encode */
 const prog=[];
 const reg=(s,l)=>{const r=REG[(s||'').toLowerCase()];if(r===undefined){errs.push({l,m:'"'+s+'" is not a register. Use x0–x31 or names like a0, t1, s2.'});return 0;}return r;};
 const imm=(s,l,lo,hi,what)=>{const v=val(s||'',l);if(v===null){errs.push({l,m:'"'+s+'" is not a number'+(Object.keys(syms).length?' or known address ('+Object.keys(syms).join(', ')+')':'')+'.'});return 0;}if(v<lo||v>hi){errs.push({l,m:(what||'Immediate')+' '+v+' is out of range ('+lo+' to '+hi+').'+(what?'':' Use li for big numbers.')});return 0;}return v;};
 const target=(s,l,pc)=>{if(lab2[s]!==undefined)return lab2[s]*4-pc;const v=val(s||'',l);if(v!==null)return v;errs.push({l,m:'Label "'+s+'" is not defined.'});return 0;};
 const need=(n,it)=>{if(it.args.length!==n){errs.push({l:it.l,m:it.op+' needs '+n+' operand'+(n>1?'s':'')+', got '+it.args.length+'.'});return false;}return true;};
 out.forEach((it,k)=>{const pc=k*4,a=it.args,l=it.l,o=it.op;let e={op:o,l,src:it.src,pseudo:it.pseudo,pc};
  if(R[o]){const d=R[o];if(d[3]&&!ext[d[3]]){errs.push({l,m:(d[3]==='M'?'"'+o+'" needs the M (multiply) extension, which this core does not have yet.':'"'+o+'" is a custom instruction that this core does not have. Add it in the instruction designer.')});}
   if(!need(3,it))return;Object.assign(e,{f:'R',rd:reg(a[0],l),rs1:reg(a[1],l),rs2:reg(a[2],l),f3:d[0],f7:d[1],opc:d[2]});}
  else if(I[o]!==undefined){if(!need(3,it))return;Object.assign(e,{f:'I',rd:reg(a[0],l),rs1:reg(a[1],l),imm:imm(a[2],l,-2048,2047),f3:I[o],opc:0x13});}
  else if(SH[o]){if(!need(3,it))return;Object.assign(e,{f:'I',rd:reg(a[0],l),rs1:reg(a[1],l),imm:imm(a[2],l,0,31,'Shift amount'),f3:SH[o][0],f7:SH[o][1],opc:0x13});}
  else if(LD[o]!==undefined||ST[o]!==undefined){if(!need(2,it))return;const mm=/^(.*)\((.+)\)$/.exec(a[1]);let off='0',base;if(mm){off=mm[1].trim()||'0';base=mm[2];}else{errs.push({l,m:'Write memory operands as offset(register), e.g. 4(a0).'});return;}
   if(LD[o]!==undefined)Object.assign(e,{f:'I',rd:reg(a[0],l),rs1:reg(base,l),imm:imm(off,l,-2048,2047),f3:LD[o],opc:0x03});else Object.assign(e,{f:'S',rs2:reg(a[0],l),rs1:reg(base,l),imm:imm(off,l,-2048,2047),f3:ST[o],opc:0x23});}
  else if(BR[o]!==undefined){if(!need(3,it))return;Object.assign(e,{f:'B',rs1:reg(a[0],l),rs2:reg(a[1],l),imm:target(a[2],l,pc),f3:BR[o],opc:0x63,lab:a[2]});}
  else if(o==='jal'){if(!need(2,it))return;Object.assign(e,{f:'J',rd:reg(a[0],l),imm:target(a[1],l,pc),opc:0x6F,lab:a[1]});}
  else if(o==='jalr'){let rs=a[1],off=a[2]||'0';const mm=a[1]&&/^(.*)\((.+)\)$/.exec(a[1]);if(mm){off=mm[1]||'0';rs=mm[2];}Object.assign(e,{f:'I',rd:reg(a[0],l),rs1:reg(rs,l),imm:imm(off,l,-2048,2047),f3:0,opc:0x67});}
  else if(o==='lui'||o==='auipc'){if(!need(2,it))return;Object.assign(e,{f:'U',rd:reg(a[0],l),imm:imm(a[1],l,0,0xfffff,'Upper immediate'),opc:o==='lui'?0x37:0x17});}
  else if(o==='ebreak'||o==='ecall'){Object.assign(e,{f:'SYS',opc:0x73,imm:o==='ebreak'?1:0});}
  else{errs.push({l,m:'Unknown instruction "'+o+'".'});return;}
  e.word=encode(e);prog.push(e);});
 return {prog,errs,labels:lab2};}
function encode(e){const u=x=>x>>>0;const r=(v,n)=>v&((1<<n)-1);let w=0;switch(e.f){
 case 'R':w=(e.f7<<25)|(e.rs2<<20)|(e.rs1<<15)|(e.f3<<12)|(e.rd<<7)|e.opc;break;
 case 'I':w=(e.f7?((e.f7<<25)|(r(e.imm,5)<<20)):(r(e.imm,12)<<20))|(e.rs1<<15)|(e.f3<<12)|(e.rd<<7)|e.opc;break;
 case 'S':w=(r(e.imm>>5,7)<<25)|(e.rs2<<20)|(e.rs1<<15)|(e.f3<<12)|(r(e.imm,5)<<7)|e.opc;break;
 case 'B':{const i=e.imm;w=(r(i>>12,1)<<31)|(r(i>>5,6)<<25)|(e.rs2<<20)|(e.rs1<<15)|(e.f3<<12)|(r(i>>1,4)<<8)|(r(i>>11,1)<<7)|e.opc;break;}
 case 'J':{const i=e.imm;w=(r(i>>20,1)<<31)|(r(i>>1,10)<<21)|(r(i>>11,1)<<20)|(r(i>>12,8)<<12)|(e.rd<<7)|e.opc;break;}
 case 'U':w=(r(e.imm,20)<<12)|(e.rd<<7)|e.opc;break;
 case 'SYS':w=(e.imm<<20)|e.opc;break;}
 return u(w);}
/* fields for display */
function fields(e){switch(e.f){case 'R':return [['funct7',7,e.f7],['rs2',5,e.rs2],['rs1',5,e.rs1],['funct3',3,e.f3],['rd',5,e.rd],['opcode',7,e.opc]];
 case 'I':return [['imm[11:0]',12,e.imm&0xfff],['rs1',5,e.rs1],['funct3',3,e.f3],['rd',5,e.rd],['opcode',7,e.opc]];
 case 'S':return [['imm[11:5]',7,(e.imm>>5)&0x7f],['rs2',5,e.rs2],['rs1',5,e.rs1],['funct3',3,e.f3],['imm[4:0]',5,e.imm&31],['opcode',7,e.opc]];
 case 'B':return [['imm[12|10:5]',7,(e.word>>>25)&0x7f],['rs2',5,e.rs2],['rs1',5,e.rs1],['funct3',3,e.f3],['imm[4:1|11]',5,(e.word>>>7)&31],['opcode',7,e.opc]];
 case 'J':return [['imm[20|10:1|11|19:12]',20,(e.word>>>12)&0xfffff],['rd',5,e.rd],['opcode',7,e.opc]];
 case 'U':return [['imm[31:12]',20,e.imm&0xfffff],['rd',5,e.rd],['opcode',7,e.opc]];
 default:return [['system',25,e.word>>>7],['opcode',7,e.opc]];}}
/* machine ------------------------------------------------------------ */
const MEMSZ=0x2000;
function machine(prog,init){const m={pc:0,x:new Int32Array(32),mem:new Uint8Array(MEMSZ),cycles:0,steps:0,halted:false,err:null,last:null,counts:{}};
 if(init)init(m);m.x[2]=MEMSZ-16;return m;}
const s8=v=>(v<<24)>>24;
function ld(m,a,n,sg){if(a<0||a+n>MEMSZ){throw new Error('Load from address '+a+' is outside memory.');}if(n>1&&a%n)throw new Error('Misaligned '+(n===4?'word':'halfword')+' load at address '+a+'.');let v=0;for(let i=n-1;i>=0;i--)v=(v<<8)|m.mem[a+i];if(sg){if(n===1)v=(v<<24)>>24;else if(n===2)v=(v<<16)>>16;}else if(n<4)v=v>>>0;return v|0;}
function st(m,a,n,v){if(a<0||a+n>MEMSZ)throw new Error('Store to address '+a+' is outside memory.');if(n>1&&a%n)throw new Error('Misaligned store at address '+a+'.');for(let i=0;i<n;i++)m.mem[a+i]=(v>>(8*i))&255;}
const CYC={div:32,rem:32};
function step(m,prog){if(m.halted)return null;const idx=m.pc>>2;if(m.pc%4||idx<0||idx>=prog.length){m.halted=true;m.last=null;return null;}
 const e=prog[idx];const x=m.x;const a=x[e.rs1]|0,b=x[e.rs2]|0;let rd=null,val=null,next=m.pc+4,act={kind:e.f,op:e.op},memA=null;
 try{switch(e.op){
  case 'add':val=(a+b)|0;break;case 'sub':val=(a-b)|0;break;case 'sll':val=a<<(b&31);break;case 'slt':val=a<b?1:0;break;case 'sltu':val=(a>>>0)<(b>>>0)?1:0;break;case 'xor':val=a^b;break;case 'srl':val=a>>>(b&31);break;case 'sra':val=a>>(b&31);break;case 'or':val=a|b;break;case 'and':val=a&b;break;
  case 'mul':val=Math.imul(a,b);break;case 'mulh':val=Number((BigInt(a)*BigInt(b))>>32n);break;case 'div':val=b===0?-1:(a===-2147483648&&b===-1?a:(a/b)|0);break;case 'rem':val=b===0?a:(a===-2147483648&&b===-1?0:a%b);break;
  case 'mac':val=(x[e.rd]+Math.imul(a,b))|0;act.unit='ai';break;
  case 'dot4':{let s=0;for(let i=0;i<4;i++)s+=s8(a>>(8*i))*s8(b>>(8*i));val=(x[e.rd]+s)|0;act.unit='ai';break;}
  case 'addi':val=(a+e.imm)|0;break;case 'slti':val=a<e.imm?1:0;break;case 'sltiu':val=(a>>>0)<((e.imm|0)>>>0)?1:0;break;case 'xori':val=a^e.imm;break;case 'ori':val=a|e.imm;break;case 'andi':val=a&e.imm;break;
  case 'slli':val=a<<e.imm;break;case 'srli':val=a>>>e.imm;break;case 'srai':val=a>>e.imm;break;
  case 'lb':memA=(a+e.imm)|0;val=ld(m,memA,1,true);act.mem='r';break;case 'lbu':memA=(a+e.imm)|0;val=ld(m,memA,1,false);act.mem='r';break;case 'lh':memA=(a+e.imm)|0;val=ld(m,memA,2,true);act.mem='r';break;case 'lhu':memA=(a+e.imm)|0;val=ld(m,memA,2,false);act.mem='r';break;case 'lw':memA=(a+e.imm)|0;val=ld(m,memA,4,true);act.mem='r';break;
  case 'sb':memA=(a+e.imm)|0;st(m,memA,1,b);act.mem='w';break;case 'sh':memA=(a+e.imm)|0;st(m,memA,2,b);act.mem='w';break;case 'sw':memA=(a+e.imm)|0;st(m,memA,4,b);act.mem='w';break;
  case 'beq':act.taken=a===b;break;case 'bne':act.taken=a!==b;break;case 'blt':act.taken=a<b;break;case 'bge':act.taken=a>=b;break;case 'bltu':act.taken=(a>>>0)<(b>>>0);break;case 'bgeu':act.taken=(a>>>0)>=(b>>>0);break;
  case 'jal':val=m.pc+4;next=m.pc+e.imm;act.taken=true;break;case 'jalr':val=m.pc+4;next=(a+e.imm)&~1;act.taken=true;break;
  case 'lui':val=e.imm<<12;break;case 'auipc':val=(m.pc+(e.imm<<12))|0;break;
  case 'ebreak':case 'ecall':m.halted=true;act.halt=true;break;}
 }catch(err){m.err={l:e.l,m:err.message};m.halted=true;return null;}
 if(e.f==='B'&&act.taken)next=m.pc+e.imm;
 if(val!==null&&e.rd!==undefined&&e.f!=='S'&&e.f!=='B'){rd=e.rd;if(rd!==0)x[rd]=val;}
 const c=CYC[e.op]||1;m.cycles+=c;m.steps++;m.counts[e.op]=(m.counts[e.op]||0)+1;
 m.last={e,pc:m.pc,a,b,val,rd,memA,act,next,cyc:c};m.pc=next;return m.last;}
function run(m,prog,limit){limit=limit||200000;while(!m.halted&&m.steps<limit)step(m,prog);if(!m.halted&&m.steps>=limit){m.err={l:0,m:'Stopped after '+limit.toLocaleString('en-US')+' instructions. Is there a loop that never ends?'};m.halted=true;}return m;}
return {ABI,REG,assemble,encode,fields,machine,step,run,ld,st,MEMSZ,s8};
})();
export default RV;
