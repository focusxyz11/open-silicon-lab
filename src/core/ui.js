/* Shared helpers for every lab: DOM lookup, theme tokens, canvas fitting, formatting. */
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const T={};
function readTokens(){const cs=getComputedStyle(document.documentElement);['bg','surface','sunk','ink','muted','line','amber','amber-fill','cyan','cyan-fill','violet','good','bad','rose'].forEach(k=>{T[k]=cs.getPropertyValue('--'+k).trim()||'#888888';});}
readTokens();
const redraws=[];
function onTheme(){readTokens();redraws.forEach(f=>{try{f();}catch(e){}});}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',onTheme);
new MutationObserver(onTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
{const _arc=CanvasRenderingContext2D.prototype.arc;CanvasRenderingContext2D.prototype.arc=function(x,y,r,a,b,c){return _arc.call(this,x,y,Math.max(0,r||0),a,b,c);};}
function fit(cv){const r=cv.getBoundingClientRect();const d=Math.min(window.devicePixelRatio||1,2);const hiddenNow=r.width<2||r.height<2;const w=hiddenNow?640:Math.round(r.width),h=hiddenNow?360:Math.round(r.height);const W=Math.round(w*d),H=Math.round(h*d);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}const ctx=cv.getContext('2d');ctx.setTransform(d,0,0,d,0,0);return{ctx,w,h,d};}
function watch(cv,draw){redraws.push(draw);new ResizeObserver(()=>draw()).observe(cv);}
function rgba(hex,a){let h=hex.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}
function shade(hex,f){let h=hex.replace('#','');const n=parseInt(h,16);const r=Math.round((n>>16&255)*f),g=Math.round((n>>8&255)*f),b=Math.round((n&255)*f);return 'rgb('+clamp(r,0,255)+','+clamp(g,0,255)+','+clamp(b,0,255)+')';}
function fmtLen(m){if(m>=1)return (+m.toPrecision(3))+' m';if(m>=1e-2)return (+(m*100).toPrecision(3))+' cm';if(m>=1e-3)return (+(m*1e3).toPrecision(3))+' mm';if(m>=1e-6)return (+(m*1e6).toPrecision(3))+' µm';return (+(m*1e9).toPrecision(3))+' nm';}
function fmtNum(n){if(n>=1e6)return (n/1e6).toFixed(1)+'M';if(n>=1e4)return (n/1e3).toFixed(1)+'k';if(n>=100)return Math.round(n).toLocaleString('en-US');if(n>=10)return n.toFixed(1);return n.toFixed(2);}
function inView(el,cb){const io=new IntersectionObserver(es=>es.forEach(e=>cb(e.isIntersecting)),{threshold:0.05});io.observe(el);}
function fr(c,x0,y0,x1,y1){c.fillRect(Math.min(x0,x1),Math.min(y0,y1),Math.abs(x1-x0),Math.abs(y1-y0));}
function hexRGB(hex){let h=String(hex).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16)||0;return [n>>16&255,n>>8&255,n&255];}
function gauss(r){let u=0;while(!u)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
function big(n){if(n>=1e12)return (+(n/1e12).toPrecision(2))+' trillion';if(n>=1e9)return (+(n/1e9).toPrecision(2))+' billion';if(n>=1e6)return (+(n/1e6).toPrecision(2))+' million';if(n>=1e3)return Math.round(n).toLocaleString('en-US');return (+n.toPrecision(2)).toString();}
const LIMC={ai:'cyan',invent:'amber-fill',capital:'violet',people:'rose'};
export {$,clamp,RM,rng,T,readTokens,redraws,onTheme,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC};
