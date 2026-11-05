/* Lab: SYSTOLIC ARRAY */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function sa(){
const N=4;let A,B,cyc=0,playing=false,timer=0;const cv=$('#saCv');
function gen(){const r=()=>Math.floor(Math.random()*5);A=[...Array(N)].map(()=>[...Array(N)].map(r));B=[...Array(N)].map(()=>[...Array(N)].map(r));cyc=0;}
const maxC=3*N-2;
function acc(i,j,c){let s=0;for(let k=0;k<N;k++)if(i+j+k<c)s+=A[i][k]*B[k][j];return s;}
function draw(){
 const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);
 const q=2*N-1;const cs=Math.min(w,h)/(N+q*0.55+0.4);const qs=cs*0.55;const gx=qs*q+cs*0.3,gy=qs*q+cs*0.3;
 c.font=Math.round(qs*0.42)+'px IBM Plex Mono, monospace';c.textAlign='center';c.textBaseline='middle';
 for(let i=0;i<N;i++)for(let k=0;k<N;k++){const d=i+k+1-cyc;if(d>=1&&d<=q){const x=gx-d*qs+qs*0.1,y=gy+(i+0.5)*cs;c.fillStyle=T.cyan;c.fillText(A[i][k],x-qs*0.4+qs*0.3,y);}}
 for(let j=0;j<N;j++)for(let k=0;k<N;k++){const d=j+k+1-cyc;if(d>=1&&d<=q){const x=gx+(j+0.5)*cs,y=gy-d*qs+qs*0.3;c.fillStyle=T.amber;c.fillText(B[k][j],x,y-qs*0.2);}}
 c.fillStyle=T.muted;c.textAlign='left';c.font='11px IBM Plex Mono, monospace';c.fillText('A rows →',4,gy-8);c.save();c.translate(gx-8,12);c.fillText('B columns ↓',0,0);c.restore();
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){
  const x=gx+j*cs,y=gy+i*cs,k=cyc-1-i-j,active=k>=0&&k<N,done=cyc-1-i-j>=N-1&&cyc>0&&cyc>=i+j+N;
  c.fillStyle=active?rgba(T['amber-fill'],0.35):done?rgba(T.good,0.18):T.surface;c.fillRect(x+2,y+2,cs-4,cs-4);
  c.strokeStyle=active?T.amber:T.line;c.lineWidth=active?2:1;c.strokeRect(x+2.5,y+2.5,cs-5,cs-5);
  c.textAlign='center';c.fillStyle=T.ink;c.font='600 '+Math.round(cs*0.3)+'px IBM Plex Mono, monospace';c.fillText(acc(i,j,cyc),x+cs/2,y+cs*0.58);
  if(active){c.font=Math.round(cs*0.17)+'px IBM Plex Mono, monospace';c.fillStyle=T.cyan;c.fillText(A[i][k],x+cs*0.24,y+cs*0.22);c.fillStyle=T.muted;c.fillText('×',x+cs/2,y+cs*0.22);c.fillStyle=T.amber;c.fillText(B[k][j],x+cs*0.76,y+cs*0.22);}
 }
 c.textAlign='left';c.textBaseline='alphabetic';
 $('#saCyc').textContent='Cycle '+cyc+' of '+maxC;
 mats();
}
function mats(){
 const t=(M,cls)=>'<table class="mat">'+M.map((r,i)=>'<tr>'+r.map((v,j)=>`<td class="${cls?cls(i,j):''}">${v}</td>`).join('')+'</tr>').join('')+'</table>';
 const Cm=[...Array(N)].map((_,i)=>[...Array(N)].map((_,j)=>cyc>=i+j+N?acc(i,j,cyc):'·'));
 $('#saMats').innerHTML=`<figure><figcaption>A</figcaption>${t(A)}</figure><span class="mono">×</span><figure><figcaption>B</figcaption>${t(B)}</figure><span class="mono">=</span><figure><figcaption>C (filled as cells finish)</figcaption>${t(Cm,(i,j)=>cyc>=i+j+N?'done':(cyc>i+j?'live':''))}</figure>`;
}
function stepC(){if(cyc<maxC)cyc++;else{playing=false;btn();}draw();}
function btn(){$('#saPlay').textContent=playing?'Pause':(cyc>=maxC?'Replay':'Play');}
$('#saPlay').addEventListener('click',()=>{if(!playing&&cyc>=maxC)cyc=0;playing=!playing;btn();clearInterval(timer);if(playing)timer=setInterval(()=>{stepC();if(!playing)clearInterval(timer);},850);draw();});
$('#saStep').addEventListener('click',()=>{playing=false;clearInterval(timer);btn();stepC();});
$('#saNew').addEventListener('click',()=>{playing=false;clearInterval(timer);gen();btn();draw();});
gen();cyc=5;btn();watch(cv,draw);
})();
}
