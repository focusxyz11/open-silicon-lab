/* Lab: CZOCHRALSKI PULLER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function czochralski(){
const cv=$('#czCv');if(!cv)return;
const I={p:$('#czPull'),t:$('#czTemp'),r:$('#czRot')};
const PH=[['dip','Dip the seed'],['neck','Neck: thin to shed defects'],['shoulder','Shoulder: widen'],['body','Body: hold 300 mm'],['tail','Tail: taper off']];
$('#czPhase').innerHTML=PH.map((p,i)=>'<button type="button" disabled data-p="'+p[0]+'"><span>'+(i+1)+'</span>'+p[1]+'</button>').join('');
let st;function reset(){st={D:5,L:0,t:0,hist:[[0,5]],melt:400,mass:0,neckMin:99,neckOk:null,usable:0,phase:'dip',done:false,msg:'',run:false,auto:false,shock:false};$('#czGo').textContent='Start growing';upd();draw();}
const target=(p,T)=>clamp(300*Math.exp(-0.8*(p-1)-0.19*(T-8)),2,460);
function phaseOf(){if(st.done)return 'tail';if(st.L<5)return 'dip';if(st.neckOk===null)return 'neck';if(!st.body&&st.melt>40)return 'shoulder';if(st.melt>40)return 'body';return 'tail';}
function tick(dt){if(st.done)return;let p=+I.p.value,T=+I.t.value;
 if(st.auto){const ph=phaseOf();if(ph==='dip'||ph==='neck'){p=3.6;T=18;}else if(ph==='shoulder'){p=0.75;T=7.5;}else if(ph==='body'){const e=(st.D-305)/300;p=clamp(1.0+e*6,0.4,2.5);T=8;}else{p=3;T=16;}I.p.value=p;I.t.value=T;}
 const Dt=target(p,T);st.D+= (Dt-st.D)*Math.min(1,dt/25);if(st.neckOk&&st.D>=290)st.body=true;const dL=p*dt;const area=Math.PI*Math.pow(st.D/20,2);const g=area*dL/10*2.33/1000;st.mass+=g;st.melt-=g;st.L+=dL;st.t+=dt;
 if(st.L>5&&st.L<80)st.neckMin=Math.min(st.neckMin,st.D);if(st.neckOk===null&&st.L>=80){st.neckOk=st.neckMin<=6;}
 if(st.D>=300&&st.D<=312&&st.neckOk)st.usable+=dL;
 if(st.hist.length===0||st.L-st.hist[st.hist.length-1][0]>=4)st.hist.push([st.L,st.D]);
 if(st.melt<=8){st.done=true;st.run=false;if(st.D>120){st.shock=true;st.usable=Math.max(0,st.usable-st.D);}}}
let last=0,raf=0;
function loop(ts){if(!st.run){raf=0;return;}const dt=Math.min(0.1,(ts-(last||ts))/1000);last=ts;const ph0=phaseOf();const sp=ph0==='body'?80:ph0==='shoulder'?24:ph0==='tail'?30:7;for(let i=0;i<4;i++)tick(dt*sp/4);upd();draw();raf=requestAnimationFrame(loop);}
$('#czGo').addEventListener('click',()=>{if(st.done)reset();st.run=!st.run;$('#czGo').textContent=st.run?'Pause':'Resume';if(st.run){last=0;if(!raf)raf=requestAnimationFrame(loop);}});
$('#czReset').addEventListener('click',()=>{st.run=false;reset();});
$('#czAuto').addEventListener('click',()=>{st.auto=!st.auto;$('#czAuto').setAttribute('aria-pressed',st.auto?'true':'false');$('#czAuto').textContent=st.auto?'Autopilot on':'Autopilot';if(!st.run&&!st.done){st.run=true;$('#czGo').textContent='Pause';last=0;if(!raf)raf=requestAnimationFrame(loop);}});
Object.values(I).forEach(e=>e.addEventListener('input',()=>{if(st.auto){st.auto=false;$('#czAuto').setAttribute('aria-pressed','false');$('#czAuto').textContent='Autopilot';}upd();if(!st.run)draw();}));
inView(cv,v=>{if(!v&&st.run){st.run=false;$('#czGo').textContent='Resume';}});
function upd(){const p=+I.p.value,T=+I.t.value,r=+I.r.value;$('#czPullO').textContent=p.toFixed(2)+' mm/min';$('#czTempO').textContent=T.toFixed(1)+' °C';$('#czRotO').textContent=r+' rpm';
 const ph=phaseOf();$('#czPhase').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===ph?'true':'false'));
 $('#czD').textContent=st.D.toFixed(st.D<20?1:0)+' mm';$('#czL').textContent=(st.usable/10).toFixed(0)+' cm';$('#czW').textContent=st.mass.toFixed(1)+' kg';
 const waf=st.neckOk===false?0:Math.floor(st.usable/0.975);$('#czWaf').textContent=waf.toLocaleString('en-US');
 $('#czTag').textContent=st.done?'Finished':st.run?'Pulling · '+Math.floor(st.t/60)+' h '+Math.floor(st.t%60)+' min':'Ready';
 let t='';
 if(st.neckOk===false)t='The neck never got thinner than 6 mm, so dislocations from the seed kept running into the crystal. Real growers would melt it back and start again. Pull the neck fast and hot.';
 else if(st.done)t=st.shock?'You lifted the crystal off the melt at full width. The thermal shock sends dislocations back up about one diameter, so the last 30 cm was scrapped. Taper the tail first next time.':'Done: a dislocation-free ingot. It will be ground to exactly 300 mm, sliced into about '+waf+' wafers, and each wafer may carry hundreds of chips.';
 else if(ph==='dip'||ph==='neck')t='Pull fast and keep the melt hot so the neck narrows to about 3–5 mm. Any dislocations from the seed grow out of the thin neck and vanish (the Dash necking technique).';
 else if(ph==='shoulder')t='Neck done'+(st.neckOk?' and dislocation-free':'')+'. Now slow the pull and cool the melt slightly so the crystal spreads out toward 300 mm.';
 else if(ph==='body')t=st.D<300?'Too thin: below 300 mm the crystal can\'t be ground to a full wafer. Slow down or cool the melt.':st.D>312?'Too wide: usable, but extra silicon is ground away and wasted. Speed up a little.':'In tolerance. Every millimetre grown now becomes wafers.';
 else t='The melt is running out. Speed up and heat the melt to taper the crystal to a point before lifting it off.';
 if(r<5)t+=' Rotation is very slow, so heat and dopants spread unevenly (striations).';if(r>22)t+=' Rotation this fast stirs up turbulence in the melt.';
 $('#czTxt').textContent=t;}
function draw(){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);const pw=Math.min(w*0.42,260);
 /* puller */
 const cx=pw/2,cw=Math.min(90,(pw-28)/2),meltTop=h-70+clamp((400-st.melt)/400,0,1)*28,crTop=h-80;
 c.strokeStyle=T.line;c.lineWidth=1;c.strokeRect(8,8,pw-16,h-16);
 c.fillStyle=rgba(T.muted,.3);c.beginPath();c.moveTo(cx-cw,crTop);c.lineTo(cx-cw,h-30);c.quadraticCurveTo(cx,h-6,cx+cw,h-30);c.lineTo(cx+cw,crTop);c.lineTo(cx+cw-6,crTop);c.lineTo(cx+cw-6,h-34);c.quadraticCurveTo(cx,h-14,cx-cw+6,h-34);c.lineTo(cx-cw+6,crTop);c.closePath();c.fill();
 const g=c.createLinearGradient(0,meltTop,0,h-20);g.addColorStop(0,'#F7B34A');g.addColorStop(1,'#E0562E');c.fillStyle=g;c.beginPath();c.moveTo(cx-cw+6,meltTop);c.lineTo(cx+cw-6,meltTop);c.lineTo(cx+cw-6,h-34);c.quadraticCurveTo(cx,h-14,cx-cw+6,h-34);c.closePath();c.fill();
 c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.textAlign='center';c.fillText('melt '+Math.max(0,st.melt).toFixed(0)+' kg',cx,h-36);
 /* crystal drawn from interface upward; scale */
 const maxL=Math.max(400,st.L+50),sy=(meltTop-30)/maxL,sx=Math.min(0.28,(pw-40)/2/240);
 c.fillStyle=rgba(T.muted,.8);c.fillRect(cx-1.5,8,3,meltTop-st.L*sy-8);
 if(st.hist.length>1){c.beginPath();const pts=st.hist.concat([[st.L,st.D]]);pts.forEach(([L,D],i)=>{const y=meltTop-(st.L-L)*sy;const x=cx-D/2*sx-1;i?c.lineTo(x,y):c.moveTo(x,y);});for(let i=pts.length-1;i>=0;i--){const [L,D]=pts[i];c.lineTo(cx+D/2*sx+1,meltTop-(st.L-L)*sy);}c.closePath();const g2=c.createLinearGradient(cx-40,0,cx+40,0);g2.addColorStop(0,'#5d6b78');g2.addColorStop(.5,'#cfd8df');g2.addColorStop(1,'#4a5662');c.fillStyle=g2;c.fill();}
 c.fillStyle=T.muted;c.textAlign='left';c.fillText('not to scale',14,24);
 if(st.run&&!RM){c.strokeStyle=rgba(T.amber,.6);c.beginPath();c.ellipse(cx,meltTop,st.D/2*sx+6,4,0,0,7);c.stroke();}
 /* chart */
 const x0=pw+40,x1=w-10,y0=20,y1=h-34;if(x1-x0<80)return;const maxX=Math.max(2400,st.L+100);const X=L=>x0+L/maxX*(x1-x0),Y=D=>y1-D/360*(y1-y0);
 c.fillStyle=rgba(T.good,.15);c.fillRect(x0,Y(312),x1-x0,Y(300)-Y(312));c.strokeStyle=T.line;c.beginPath();c.moveTo(x0,y1);c.lineTo(x1,y1);c.moveTo(x0,y0);c.lineTo(x0,y1);c.stroke();
 c.fillStyle=T.muted;c.textAlign='right';[0,100,200,300].forEach(d=>{c.fillText(d+'',x0-6,Y(d)+4);});c.save();c.translate(x0-30,(y0+y1)/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('diameter, mm',0,0);c.restore();
 c.textAlign='center';((x1-x0)<220?[0,1000,2000]:[0,500,1000,1500,2000]).forEach(L=>{if(L<=maxX)c.fillText(L/1000+' m',X(L),y1+14);});c.fillText('crystal length',(x0+x1)/2,y1+28);
 c.fillStyle=T.good;c.textAlign='left';c.fillText('target 300–312 mm',x0+6,Y(312)-6);
 c.strokeStyle=T['amber-fill'];c.lineWidth=2.2;c.beginPath();st.hist.concat([[st.L,st.D]]).forEach(([L,D],i)=>i?c.lineTo(X(L),Y(D)):c.moveTo(X(L),Y(D)));c.stroke();}
watch(cv,draw);reset();
})();
}
