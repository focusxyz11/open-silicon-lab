/* Lab: RISC-V ENCODER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function enc(){
const OPS={add:['R','0000000','000'],sub:['R','0100000','000'],sll:['R','0000000','001'],slt:['R','0000000','010'],xor:['R','0000000','100'],srl:['R','0000000','101'],sra:['R','0100000','101'],or:['R','0000000','110'],and:['R','0000000','111'],addi:['I','','000'],slti:['I','','010'],xori:['I','','100'],ori:['I','','110'],andi:['I','','111']};
const ABI=['zero','ra','sp','gp','tp','t0','t1','t2','s0','s1','a0','a1','a2','a3','a4','a5','a6','a7','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','t3','t4','t5','t6'];
const R=rng(5);const regs=ABI.map((_,i)=>i===0?0:1+Math.floor(R()*60));
const op=$('#encOp'),rd=$('#encRd'),r1=$('#encRs1'),r2=$('#encRs2'),im=$('#encImm');
op.innerHTML=Object.keys(OPS).map(k=>'<option value="'+k+'">'+k+'</option>').join('');
const regOpt=from=>ABI.map((n,i)=>i<from?'':'<option value="'+i+'">x'+i+' ('+n+')</option>').join('');
rd.innerHTML=regOpt(1);r1.innerHTML=regOpt(0);r2.innerHTML=regOpt(0);rd.value='5';r1.value='6';r2.value='7';
[op,rd,r1,r2,im].forEach(e=>e.addEventListener('input',upd));
const bn=(v,n)=>((((v%(1<<n))+(1<<n))%(1<<n)).toString(2)).padStart(n,'0');
const bgc={muted:'muted',cyan:'cyan-fill',amber:'amber-fill',violet:'violet',good:'good'};
function upd(){
 const o=OPS[op.value],isI=o[0]==='I';r2.hidden=isI;im.hidden=!isI;$('#encR2L').textContent=isI?'Constant (−2048 to 2047)':'Source rs2';
 let imm=clamp(Math.round(+im.value||0),-2048,2047);
 const d=+rd.value,s1=+r1.value,s2=+r2.value;
 const F=isI?[['imm[11:0]',bn(imm,12),'amber',12,'constant '+imm],['rs1',bn(s1,5),'violet',5,'x'+s1],['funct3',o[2],'muted',3,'operation'],['rd',bn(d,5),'cyan',5,'x'+d],['opcode','0010011','good',7,'I-type math']]
  :[['funct7',o[1],'muted',7,'variant'],['rs2',bn(s2,5),'amber',5,'x'+s2],['rs1',bn(s1,5),'violet',5,'x'+s1],['funct3',o[2],'muted',3,'operation'],['rd',bn(d,5),'cyan',5,'x'+d],['opcode','0110011','good',7,'R-type math']];
 const bits=F.map(f=>f[1]).join('');
 $('#encBits').innerHTML='<div class="bitrow" style="grid-template-columns:'+F.map(f=>f[3]+'fr').join(' ')+'">'+F.map(f=>'<div class="bitf" style="background:color-mix(in srgb,var(--'+bgc[f[2]]+') 26%,transparent)"><span>'+f[0]+'</span><b>'+f[1]+'</b><span>'+f[4]+'</span></div>').join('')+'</div>';
 $('#encHex').textContent='0x'+parseInt(bits,2).toString(16).padStart(8,'0').toUpperCase();
 $('#encFmt').textContent=isI?'I-type format':'R-type format';
 $('#encAsm').textContent=op.value+' x'+d+', x'+s1+', '+(isI?imm:'x'+s2);
 const A=BigInt(regs[s1]),B=BigInt(isI?imm:regs[s2]),sh=B&63n;let r;
 switch(op.value){case 'add':case 'addi':r=A+B;break;case 'sub':r=A-B;break;case 'sll':r=A<<sh;break;case 'slt':case 'slti':r=A<B?1n:0n;break;case 'xor':case 'xori':r=A^B;break;case 'srl':r=BigInt.asUintN(64,A)>>sh;break;case 'sra':r=A>>sh;break;case 'or':case 'ori':r=A|B;break;default:r=A&B;}
 r=BigInt.asIntN(64,r);
 $('#encRes').textContent=d===0?'nothing: x0 is always 0':'x'+d+' ← '+r+'   (x'+s1+' = '+regs[s1]+(isI?'':', x'+s2+' = '+regs[s2])+')';
}
upd();
})();
}
