/* Lab: PIPELINE */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function pp(){
const P=[{t:'lw   x1, 0(x10)',d:1,s:[10],ld:1},{t:'add  x2, x1, x3',d:2,s:[1,3]},{t:'sub  x4, x2, x5',d:4,s:[2,5]},{t:'addi x6, x6, 1',d:6,s:[6]},{t:'and  x7, x4, x6',d:7,s:[4,6]},{t:'sw   x7, 8(x10)',d:0,s:[7,10]}];
let now=0,timer=0;const fw=$('#ppFwd'),re=$('#ppRe');
function sched(){const fwd=fw.checked,ord=re.checked?[0,3,1,2,4,5]:[0,1,2,3,4,5];const prog=ord.map(i=>P[i]);const res=[],why=[];
 prog.forEach((ins,k)=>{const IF=k?res[k-1].IF+1:1;const ID=k?Math.max(IF+1,res[k-1].EX):2;let EX=Math.max(ID+1,k?res[k-1].EX+1:0);
  for(const r of ins.s){let p=-1;for(let j=k-1;j>=0;j--)if(prog[j].d===r){p=j;break;}if(p<0)continue;const pr=res[p],pi=prog[p];const need=fwd?(pi.ld?pr.MEM+1:pr.EX+1):pr.WB+1;
   if(need>ID+1){const n=need-ID-1;why.push('<b>'+ins.t.split(' ')[0]+'</b> needs x'+r+' from <b>'+pi.t.split(' ')[0]+'</b>: '+n+' stall cycle'+(n>1?'s':'')+(fwd&&pi.ld?'. A load\'s data only exists after the memory stage, so even forwarding must wait one cycle.':fwd?'.':'. Without forwarding it must wait for write-back.'));}
   EX=Math.max(EX,need);}
  res.push({IF,ID,EX,MEM:EX+1,WB:EX+2});});
 return {prog,res,why};}
function render(){const {prog,res,why}=sched();const T0=res[res.length-1].WB;
 let h='<tr><th></th>'+Array.from({length:T0},(_,c)=>'<th class="'+(c+1===now?'now':'')+'">'+(c+1)+'</th>').join('')+'</tr>';
 prog.forEach((ins,k)=>{const r=res[k];h+='<tr><td class="ins">'+ins.t+'</td>';for(let c=1;c<=T0;c++){let cl='',tx='';if(c===r.IF){cl='s-if';tx='IF';}else if(c>r.IF&&c<r.ID){cl='s-st';tx='·';}else if(c===r.ID){cl='s-id';tx='ID';}else if(c>r.ID&&c<r.EX){cl='s-st';tx='·';}else if(c===r.EX){cl='s-ex';tx='EX';}else if(c===r.MEM){cl='s-mem';tx='MEM';}else if(c===r.WB){cl='s-wb';tx='WB';}h+='<td class="'+cl+(c===now?' nowc':'')+'">'+tx+'</td>';}h+='</tr>';});
 $('#ppTab').innerHTML=h;
 const st=res.reduce((a,r)=>a+(r.EX-r.ID-1),0);$('#ppT').textContent=T0;$('#ppS').textContent=st;$('#ppC').textContent=((T0-4)/prog.length).toFixed(2);
 $('#ppCyc').textContent=now?'Cycle '+now+' of '+T0:'Ideal: 10 cycles for 6 instructions';
 $('#ppWhy').innerHTML=why.length?why.map(w=>'<li>'+w+'</li>').join(''):'<li>No stalls. Every instruction gets its inputs just in time.</li>';
 return T0;}
function stop(){clearInterval(timer);timer=0;now=0;$('#ppPlay').textContent='Play cycles';}
[fw,re].forEach(e=>e.addEventListener('change',()=>{stop();render();}));
$('#ppPlay').addEventListener('click',()=>{if(timer){stop();render();return;}now=1;$('#ppPlay').textContent='Stop';const T0=render();timer=setInterval(()=>{now++;if(now>T0){stop();}render();},420);});
render();
})();
}
