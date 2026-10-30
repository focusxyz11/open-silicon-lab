/* Lab: GPU COST BREAKDOWN */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function gpuCost(){
const st=$('#gcStack');if(!st)return;
const I={w:$('#gcWafer'),a:$('#gcArea'),d:$('#gcD0'),h:$('#gcHbm'),hp:$('#gcHp'),py:$('#gcPy'),s:$('#gcSell')};
I.py.value=84;
const money=v=>'$'+Math.round(v).toLocaleString('en-US');
const COL=()=>[T.violet,T['cyan-fill'],T['amber-fill'],T.rose,T.muted];
const NAMES=['Compute dies','HBM memory','Packaging','Packaging yield loss','Board parts & test'];
function run(){const W=+I.w.value,A=+I.a.value,D0=+I.d.value,H=+I.h.value,HP=+I.hp.value,PY=+I.py.value/100,S=+I.s.value;
 const gross=Math.max(1,Math.floor(Math.PI*150*150/A-Math.PI*300/Math.sqrt(2*A)));const y=Math.exp(-A/100*D0);const good=Math.max(.5,gross*y);const die=W/good;
 const dies=2*die,hbm=H*HP,pk=1100,parts=dies+hbm+pk,loss=parts*(1/PY-1),aux=480,cost=parts+loss+aux;
 const v=[dies,hbm,pk,loss,aux];const col=COL();
 $('#gcWaferO').textContent=money(W);$('#gcAreaO').textContent=A+' mm²';$('#gcD0O').textContent=D0.toFixed(2)+' per cm²';$('#gcHbmO').textContent=H+' GB';$('#gcHpO').textContent='$'+HP.toFixed(HP%1?1:0);$('#gcPyO').textContent=Math.round(PY*100)+'%';$('#gcSellO').textContent=money(S);
 st.innerHTML=v.map((x,i)=>'<i style="width:'+(x/cost*100).toFixed(2)+'%;background:'+col[i]+'" title="'+NAMES[i]+'"></i>').join('');
 $('#gcLeg').innerHTML=v.map((x,i)=>'<span><i style="background:'+col[i]+'"></i>'+NAMES[i]+' '+money(x)+'</span>').join('');
 const gm=(S-cost)/S;const mx=Math.max(S,cost);
 $('#gcPrice').innerHTML='<small>Cost versus selling price</small><div class="pb"><i style="width:'+(cost/mx*100).toFixed(1)+'%;background:'+T.muted+'"></i><i style="left:'+(cost/mx*100).toFixed(1)+'%;width:'+(Math.max(0,S-cost)/mx*100).toFixed(1)+'%;background:'+rgba(T.good,.55)+'"></i><span style="left:8px">Cost '+money(cost)+'</span><span style="right:8px">'+(S>=cost?'Gross profit '+money(S-cost):'Loss '+money(cost-S))+'</span></div>';
 const memShare=(hbm/PY)/cost;
 $('#gcCost').textContent=money(cost);$('#gcMem').textContent=Math.round(memShare*100)+'%';$('#gcDies').textContent=Math.floor(good)+' of '+gross;$('#gcGm').textContent=Math.round(gm*100)+'%';
 $('#gcTag').textContent='Cost '+money(cost)+' · price '+money(S);
 let t;if(hbm>dies+pk+aux)t='Memory is the biggest cost: the HBM stacks cost more than the compute dies, packaging and test together. This is why HBM makers have become so profitable.';
 else if(dies>hbm)t='The compute dies now cost more than the memory. Large dies lose yield fast: each extra square millimetre raises the chance that a defect lands on the die.';
 else t='HBM and packaging together make up most of the cost, while the famous compute dies are a modest share.';
 if(PY<.8)t+=' At this packaging yield, every failed package also throws away its working HBM and dies, so losses climb quickly.';
 $('#gcTxt').textContent=t;}
Object.values(I).forEach(e=>e.addEventListener('input',run));redraws.push(run);run();
})();
}
