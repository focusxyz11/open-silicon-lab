/* Lab: PRICE LADDER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function ladder(){
const box=$('#ladder');if(!box)return;
const L=[
 [1.7e-7,'One transistor in an AI GPU','About $35,000 spread over 208 billion transistors'],
 [15,'One gigabyte of HBM','Roughly 5–10 times the price of ordinary DRAM'],
 [6400,'Making one Blackwell-class GPU','Epoch AI estimate'],
 [35000,'Buying one','Reported $30,000–40,000'],
 [3e6,'One AI rack of 72 GPUs','Reported, with CPUs, networking and cooling'],
 [2e7,'One mask set at 3–2 nm','Industry estimate, $15–25 million'],
 [2e8,'One EUV scanner','Low-NA; about $200 million'],
 [4e8,'One High-NA EUV scanner','About $400 million'],
 [5e8,'Designing a flagship chip','Hundreds of millions of dollars at 3–2 nm'],
 [2.5e10,'One leading-edge fab','$20–30 billion and more'],
 [6.2e10,'TSMC\'s capital spending in 2026','$60–64 billion guidance'],
 [9.62e10,'NVIDIA\'s revenue in one quarter','Quarter to July 2026'],
 [7e11,'Big Tech capital spending in 2026','Alphabet, Amazon, Meta and Microsoft, mostly for AI']
];
const lo=Math.log10(1e-7),hi=Math.log10(1e12);
const fmt=v=>v<1?'$'+v.toPrecision(2).replace(/0+$/,''):v<1e3?'$'+v:v<1e6?'$'+(v/1e3).toFixed(v<1e4?1:0).replace('.0','')+'k':v<1e9?'$'+(v/1e6).toFixed(0)+'M':v<1e12?'$'+(+(v/1e9).toPrecision(3))+'B':'$'+(v/1e12).toFixed(1)+'T';
function paint(){box.innerHTML=L.map(x=>{const p=(Math.log10(x[0])-lo)/(hi-lo)*100;return '<div class="lr"><div><b>'+x[1]+'</b><small>'+x[2]+'</small></div><div class="track"><i style="width:'+p.toFixed(1)+'%;background:'+(x[0]>=1e9?T['amber-fill']:T['cyan-fill'])+'"></i><span>'+fmt(x[0])+'</span></div></div>';}).join('');}
redraws.push(paint);paint();
})();
}
