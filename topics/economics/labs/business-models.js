/* Lab: BUSINESS MODELS */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function bizModels(){
const box=$('#bmBars');if(!box)return;
const NM=['Cost of production','R&D','Sales & admin','Operating profit'];
const COL=()=>[T.muted,T.violet,T.rose,T.good];
const M=[
 ['Fabless','NVIDIA',[25,7,2,66],'Designs chips and pays a foundry to make them, so it owns no factories. Almost all of its spending is on engineers and software, and its profit depends on having the best design. NVIDIA\'s operating income was $63.7 billion on $96.2 billion of revenue in the quarter to July 2026.','Low: well under 5% of revenue. TSMC builds the factories.'],
 ['Foundry','TSMC',[34,6,2,58],'Manufactures chips designed by others. Its gross margin of 66.4% is unusually high for a manufacturer, because only TSMC can make the most advanced chips at scale.','High: $60–64 billion in 2026, roughly a third of its revenue, to build new fabs years before they earn money.'],
 ['Integrated (IDM)','Intel, illustrative',[61,29,10,0],'Designs and makes its own chips. This keeps design and process tightly linked, but the company must fund both chip R&D and fabs, and a process stumble hurts everything. Intel has been close to break-even in recent years while rebuilding its manufacturing lead.','Very high: during a fab build-out, capital spending can exceed a third of revenue.'],
 ['Memory','SK hynix',[18,4,2,76],'Memory is a commodity whose price swings with supply. SK hynix lost money in 2023, then earned a record 76% operating margin in the second quarter of 2026 because HBM demand outran supply.','High and cyclical: memory makers add capacity in booms, which often causes the next price crash.'],
 ['IP licensing','Arm, illustrative',[3,48,24,25],'Sells designs and collects a royalty on every chip that uses them. It makes nothing physical, so it needs very little capital, but it spends heavily on engineers and depends on its licensees\' success.','Almost none.']
];
let cur=0;const col=COL();
box.innerHTML=M.map((m,i)=>'<button type="button" data-i="'+i+'"><span><b>'+m[0]+'</b><small>'+m[1]+'</small></span><div class="st">'+m[2].map((v,k)=>'<i data-k="'+k+'" style="width:'+v+'%">'+(v>=7?(k===3?v+'¢ profit':v+'¢'):'')+'</i>').join('')+'</div></button>').join('');
function paint(){const col=COL();box.querySelectorAll('.st i').forEach(i=>{i.style.background=rgba(col[+i.dataset.k],+i.dataset.k===0?.35:.6);});$('#bmLeg').innerHTML=NM.map((n,k)=>'<span><i style="background:'+rgba(col[k],k===0?.35:.6)+'"></i>'+n+'</span>').join('');}
function show(){box.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===cur?'true':'false'));const m=M[cur];$('#bmText').innerHTML='<h3>'+m[0]+' · '+m[1]+'</h3><p>'+m[3]+'</p>';$('#bmCapex').textContent=m[4];}
box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{cur=+b.dataset.i;show();}));
redraws.push(paint);paint();show();
})();
}
