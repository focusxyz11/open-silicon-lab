/* Lab: QUANTIZATION LAB */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function qz(){
const FM={fp16:['FP16',5,10,65504,16,1],bf16:['BF16',8,7,3.39e38,16,1],e4m3:['FP8 E4M3',4,3,448,8,2],e5m2:['FP8 E5M2',5,2,57344,8,2],fp4:['FP4 E2M1',2,1,6,4,4]};
let fk='fp4',sc='tensor';const R=rng(42);const base=Array.from({length:4096},()=>gauss(R));const om=Array.from({length:4096},()=>R());
const fs=$('#qzFmt');Object.keys(FM).forEach(k=>{const b=document.createElement('button');b.textContent=FM[k][0];b.dataset.k=k;b.addEventListener('click',()=>{fk=k;run();});fs.appendChild(b);});
$('#qzScale').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{sc=b.dataset.v;run();}));$('#qzOut').addEventListener('input',run);
function Q(x,E,M,maxV){const a=Math.abs(x);if(a===0)return 0;const bias=2**(E-1)-1,emin=1-bias;let e=Math.floor(Math.log2(a));if(e<emin)e=emin;const st=2**(e-M);let q=Math.round(a/st)*st;if(q>maxV)q=maxV;return Math.sign(x)*q;}
function grid(E,M,maxV){const out=[0];const bias=2**(E-1)-1,emin=1-bias;for(let e=emin;e<=emin+40;e++){for(let m=0;m<2**M;m++){const v=(e===emin&&m===0)?0:(e===emin?m*2**(e-M):(2**M+m)*2**(e-M));if(v>maxV)return out;if(v>0)out.push(v);}if(out.length>400)return null;}return out;}
let S={};
function run(){const f=FM[fk],is16=f[4]===16,mode=is16?'tensor':sc;
 fs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===fk?'true':'false'));$('#qzScale').querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.v===mode?'true':'false');b.disabled=is16;});
 const share=+$('#qzOut').value/100;$('#qzOutO').textContent=(share*100).toFixed(1)+'% of weights';
 const X=base.map((v,i)=>om[i]<share?v*12:v),N=X.length,Y=new Float64Array(N);const scales=[];
 if(mode==='tensor'){let mx=0;X.forEach(v=>mx=Math.max(mx,Math.abs(v)));const s=is16?1:mx/f[3];scales.push(s);X.forEach((v,i)=>Y[i]=Q(v/s,f[1],f[2],f[3])*s);}
 else{const B=mode==='nv16'?16:32;for(let k=0;k<N;k+=B){let mx=0;for(let i=k;i<k+B;i++)mx=Math.max(mx,Math.abs(X[i]));let s=(mx/f[3])||1;if(mode==='mx32')s=2**Math.ceil(Math.log2(s));scales.push(s);for(let i=k;i<k+B;i++)Y[i]=Q(X[i]/s,f[1],f[2],f[3])*s;}}
 let num=0,den=0,zeros=0;for(let i=0;i<N;i++){num+=(Y[i]-X[i])**2;den+=X[i]**2;if(Y[i]===0&&X[i]!==0)zeros++;}const rel=Math.sqrt(num/den),snr=-20*Math.log10(Math.max(rel,1e-9));
 const bits=f[4]+(mode==='nv16'?0.5:mode==='mx32'?0.25:0);
 $('#qzBits').textContent=bits+' bits';$('#qzMem').textContent=(70*bits/8).toFixed(1)+' GB';$('#qzErr').textContent=(rel*100).toFixed(rel<0.01?3:1)+'%';$('#qzSnr').textContent=snr.toFixed(1)+' dB';$('#qzSpd').textContent=f[5]+'×';
 $('#qzTag').textContent=f[0]+(is16?'':' · '+({tensor:'per-tensor scale',nv16:'16-value blocks',mx32:'32-value blocks'}[mode]));
 $('#qzTxt').textContent=(rel<0.01?'Practically lossless: the rounding error is far below the noise in training. ':rel<0.06?'Small error. With careful calibration, models usually keep their accuracy. ':rel<0.2?'Noticeable error. Models need fine-tuning or finer-grained scaling to cope. ':'Too coarse. ')+(zeros/N>0.2?Math.round(zeros/N*100)+'% of the weights collapsed to zero, because the outliers stretched the scale. ':'')+(!is16&&mode==='tensor'&&fk==='fp4'?'Switch on block scaling to see how much it helps.':'');
 const sorted=scales.slice().sort((a,b)=>a-b);S={X,Y,f,s:sorted[Math.floor(sorted.length/2)],mode};draw();}
function draw(){if(!S.X)return;const {ctx:c,w,h}=fit($('#qzCv'));c.clearRect(0,0,w,h);const L=4.5,X0=12,X1=w-12,Xp=v=>X0+(X1-X0)*(v+L)/(2*L);const top=16,hb=h*0.6,eb0=hb+30,eb1=h-14;
 const bins=90,cnt=new Array(bins).fill(0);let out=0;S.X.forEach(v=>{if(Math.abs(v)>L){out++;return;}cnt[Math.min(bins-1,Math.floor((v+L)/(2*L)*bins))]++;});const mx=Math.max(...cnt);
 c.fillStyle=rgba(T.muted,0.35);cnt.forEach((n,i)=>{const x=X0+(X1-X0)*i/bins,bw=(X1-X0)/bins;const bh=(hb-top)*n/mx;c.fillRect(x,hb-bh,bw-1,bh);});
 const g=grid(S.f[1],S.f[2],S.f[3]);c.font='11px IBM Plex Mono, monospace';
 if(g){c.strokeStyle=rgba(T.amber,0.85);c.lineWidth=1;g.forEach(v=>{for(const sg of [1,-1]){const x=Xp(sg*v*S.s);if(x>=X0&&x<=X1){c.beginPath();c.moveTo(x,top);c.lineTo(x,hb);c.stroke();}}});c.fillStyle=T.amber;c.fillText('values this format can store'+(S.mode==='tensor'?'':' (typical block)'),X0,12);}
 else{c.fillStyle=T.amber;c.fillText('representable values are too fine to draw here',X0,12);}
 if(out){c.fillStyle=T.bad;c.textAlign='right';c.fillText(out+' outliers beyond ±4.5 →',X1,top+14);c.textAlign='left';}
 c.fillStyle=T.muted;c.fillText('weights (most are near zero)',X0,hb+14);
 let em=0;for(let i=0;i<1500;i++)if(Math.abs(S.X[i])<=L)em=Math.max(em,Math.abs(S.Y[i]-S.X[i]));em=em||1;const ym=(eb0+eb1)/2;
 c.strokeStyle=rgba(T.muted,0.4);c.beginPath();c.moveTo(X0,ym);c.lineTo(X1,ym);c.stroke();c.fillStyle=rgba(T.cyan,0.7);
 for(let i=0;i<1500;i++){const v=S.X[i];if(Math.abs(v)>L)continue;const e=S.Y[i]-v;c.fillRect(Xp(v)-1,ym-(e/em)*(eb1-eb0)/2-1,2,2);}
 c.fillStyle=T.muted;c.fillText('rounding error per weight (±'+em.toPrecision(2)+')',X0,eb0-4);}
watch($('#qzCv'),draw);run();
})();
}
