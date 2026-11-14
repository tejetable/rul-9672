import {useEffect,useRef,useState} from 'react';
import {Plus} from 'lucide-react';
import {createPortal} from 'react-dom';
import {Button} from './ui/button';

export function DirectivaFab({label,accessibleLabel,onClick,disabled=false}:{label:string;accessibleLabel?:string;onClick:()=>void;disabled?:boolean}){
 const [reduced,setReduced]=useState(false);
 const [mounted,setMounted]=useState(false);
 const previous=useRef(0);
 const buttonRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setMounted(true);previous.current=window.scrollY;const scroll=()=>{const current=window.scrollY;if(Math.abs(current-previous.current)>4){setReduced(current>previous.current&&current>64);previous.current=current;}};window.addEventListener('scroll',scroll,{passive:true});return()=>window.removeEventListener('scroll',scroll);},[]);
 useEffect(()=>{
  if(!mounted)return;
  let frame=0;
  const update=()=>{
   const button=buttonRef.current;if(!button)return;
   const fab=button.getBoundingClientRect();
   const viewport=window.visualViewport;
   const visibleBottom=viewport?viewport.height+viewport.offsetTop:window.innerHeight;
   let obstruction=0;
   for(const element of document.body.querySelectorAll<HTMLElement>('*')){
    if(element===button||button.contains(element)||getComputedStyle(element).position!=='fixed')continue;
    const rect=element.getBoundingClientRect();
    if(rect.height>0&&rect.height<visibleBottom/2&&rect.bottom>=visibleBottom-2&&rect.top<visibleBottom&&rect.right>fab.left&&rect.left<fab.right){
     obstruction=Math.max(obstruction,window.innerHeight-rect.top);
    }
   }
   button.style.setProperty('--fab-obstruction',`${obstruction}px`);
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  const sizes=new ResizeObserver(schedule);sizes.observe(document.body);
  window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule);
  schedule();return()=>{cancelAnimationFrame(frame);observer.disconnect();sizes.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule);window.visualViewport?.removeEventListener('resize',schedule);};
 },[mounted]);
 return mounted?createPortal(<Button ref={buttonRef} aria-label={accessibleLabel??label} title={label} disabled={disabled} onClick={onClick} className={`directiva-fab ${reduced?'is-reduced':''}`}><Plus aria-hidden="true"/></Button>,document.body):null;
}