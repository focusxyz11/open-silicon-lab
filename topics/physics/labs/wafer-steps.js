/* Lab: WAFER STEPS */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function waferSteps(){const box=$('#wfSteps');if(!box)return;
const W=[['Purify','Quartz sand is reduced to 98% silicon in arc furnaces, then refined through a gas (the Siemens process) to eleven-nines polysilicon.'],['Grow','A single-crystal ingot is pulled from the melt over a day or two.'],['Grind & notch','The ingot is ground to an exact 300 mm cylinder and notched to mark the crystal direction.'],['Slice','Diamond-coated wire saws cut hundreds of wafers at once, each 775 µm thick.'],['Lap & etch','Both faces are ground flat and acid-etched to remove saw damage.'],['Polish','Chemical-mechanical polishing leaves one mirror face smooth to a fraction of a nanometre.'],['Clean & inspect','Lasers scan every wafer for particles and defects tens of nanometres across.'],['Epitaxy','Many wafers get a thin, perfect crystal layer grown on top before shipping to the fab.']];
box.innerHTML=W.map((s,i)=>'<div><span class="code">'+String(i+1).padStart(2,'0')+'</span><b>'+s[0]+'</b><p>'+s[1]+'</p></div>').join('');})();
}
