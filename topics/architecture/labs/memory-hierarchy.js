/* Lab: MEMORY HIERARCHY */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function mh(){
const M=[['Register','0.3 ns','A few kB inside each core',0.3],['L1 cache','~1 ns','32–64 kB per core',1],['L2 cache','~4 ns','1–4 MB per core',4],['L3 cache','~15 ns','Tens to hundreds of MB, shared',15],['DRAM (DDR5)','~90 ns','Gigabytes to terabytes',90],['HBM','~100 ns','Up to 288 GB per GPU at ~20 TB/s',100],['Another server over the network','~5 µs','Fast data-center links (RDMA)',5000],['NVMe SSD','~80 µs','Terabytes of storage',80000]];
const box=$('#mhBars'),cb=$('#mhH');
function hum(s){if(s<60)return (+s.toPrecision(2))+' s';if(s<3600)return (+(s/60).toPrecision(2))+' min';if(s<86400)return (+(s/3600).toPrecision(2))+' hours';return (+(s/86400).toPrecision(2))+' days';}
function upd(){const H=cb.checked;box.innerHTML=M.map(m=>{const wd=(Math.log10(m[3])+1)/6*100;return '<div class="bar mh"><span>'+m[0]+'<small>'+m[2]+'</small></span><div class="track"><div class="fill'+(m[0]==='HBM'?' hot':'')+'" style="width:'+wd.toFixed(1)+'%"></div><span class="val">'+(H?hum(m[3]):m[1])+'</span></div></div>';}).join('');}
cb.addEventListener('change',upd);upd();
})();
}
