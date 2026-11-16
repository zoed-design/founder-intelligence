import {createMap} from '../src/map.js?v=brand-stories-2';
import {mascot} from '../src/crew.js?v=brand-stories-2';
const portraits=Object.fromEntries(['router','capture','curator','teamwork','commercial','content'].map(id=>[id,`assets/${id}.webp`]));
const map=document.querySelector('#vision-map');
if(map)createMap(map,{},portraits);
const container=document.querySelector('#landing-mascot');
if(container){
const digger=mascot(container,null);
const control=document.querySelector('#landing-dance');
const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
let dancing=!motion.matches,visible=true;
function sync(){
 if(!digger.ready){control.hidden=true;return;}
 if(motion.matches)dancing=false;control.disabled=motion.matches;
 control.textContent=motion.matches?'Motion reduced':dancing?'Pause dance':'Dance';control.setAttribute('aria-pressed',String(dancing));
 container.dataset.dancing=String(dancing&&!motion.matches);
 if(dancing&&visible&&!document.hidden)digger.dance();else digger.reset();
}
if(digger.ready){container.querySelector('.mascot-fallback').hidden=true;container.dataset.ready='true';}
control.addEventListener('click',()=>{dancing=!dancing;sync();});
motion.addEventListener('change',()=>{if(motion.matches)dancing=false;sync();});
const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.1});observer.observe(container);
document.addEventListener('visibilitychange',sync);
let timer;const startTimer=()=>{clearInterval(timer);timer=setInterval(()=>{if(dancing&&visible&&!document.hidden&&!motion.matches)digger.dance();},1500);};
window.addEventListener('pagehide',()=>clearInterval(timer));window.addEventListener('pageshow',()=>{startTimer();sync();});startTimer();
sync();

}
