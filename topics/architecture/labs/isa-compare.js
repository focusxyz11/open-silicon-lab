/* Lab: ISA COMPARE */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function isa(){
const L=1;
const D={
 x86:{label:'x86-64',cm:';',w:'Varies, 1–15 bytes',lines:[['sum:'],['  xor   eax, eax','s = 0',2],['  test  rsi, rsi','is n ≤ 0?',3],['  jle   .done','then skip the loop',2],['  xor   ecx, ecx','i = 0',2],['.loop:'],['  add   rax, [rdi+rcx*8]','s += a[i], reading memory directly',4,L],['  inc   rcx','i++',3,L],['  cmp   rcx, rsi','compare i with n',3,L],['  jl    .loop','repeat while i < n',2,L],['.done:'],['  ret','the result is in rax',1]],
  note:'CISC style: one add instruction both reads memory and adds. Instruction lengths vary, which keeps code small but makes the decoder work harder. Inside, modern x86 cores split instructions like this into simpler micro-operations.'},
 arm:{label:'Arm (AArch64)',cm:'//',w:'Fixed, 4 bytes',lines:[['sum:'],['  mov   x2, x0','p = a',4],['  mov   x0, #0','s = 0',4],['  cmp   x1, #0','is n ≤ 0?',4],['  b.le  .done','then skip the loop',4],['.loop:'],['  ldr   x3, [x2], #8','load a[i], then move p on 8 bytes',4,L],['  add   x0, x0, x3','s += a[i]',4,L],['  subs  x1, x1, #1','n--, and set the flags',4,L],['  b.ne  .loop','repeat while n ≠ 0',4,L],['.done:'],['  ret','the result is in x0',4]],
  note:'Load/store style: arithmetic works only on registers, so loading is a separate instruction. Every instruction is 4 bytes, which makes decoding simple and fast. Post-increment addressing folds the pointer update into the load.'},
 rv:{label:'RISC-V (RV64GC)',cm:'#',w:'4 bytes, or 2 with the C extension',lines:[['sum:'],['  li    a5, 0','s = 0',2],['  blez  a1, .done','if n ≤ 0, skip the loop',4],['.loop:'],['  ld    a4, 0(a0)','load a[i]',2,L],['  add   a5, a5, a4','s += a[i]',2,L],['  addi  a0, a0, 8','point to the next element',2,L],['  addi  a1, a1, -1','n--',2,L],['  bnez  a1, .loop','repeat while n ≠ 0',2,L],['.done:'],['  mv    a0, a5','return s',2],['  ret','',2]],
  note:'Minimal style: no condition flags and no fancy addressing, so the loop needs one more instruction. With the optional compressed (C) extension most instructions shrink to 2 bytes, making this the smallest code of the three (36 bytes without it).'}
};
let cur='x86';const seg=$('#isaSeg');
Object.keys(D).forEach(k=>{const b=document.createElement('button');b.textContent=D[k].label;b.dataset.k=k;b.addEventListener('click',()=>{cur=k;show();});seg.appendChild(b);});
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
function show(){const d=D[cur];[...seg.children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===cur?'true':'false'));
 $('#isaAsm').innerHTML=d.lines.map(l=>'<div'+(l[3]?' class="loop"':'')+'><span>'+esc(l[0])+'</span><span class="cm">'+(l[1]?esc(d.cm+' '+l[1]):'')+'</span><span class="by">'+(l[2]?l[2]+' B':'')+'</span></div>').join('');
 const ins=d.lines.filter(l=>l[2]);$('#isaN').textContent=ins.length;$('#isaL').textContent=ins.filter(l=>l[3]).length+' instructions';$('#isaB').textContent=ins.reduce((a,l)=>a+l[2],0)+' bytes';$('#isaW').textContent=d.w;$('#isaNote').textContent=d.note;}
show();
})();
}
