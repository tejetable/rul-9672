import {useEffect,useRef,useState} from 'react';
import {Plus} from 'lucide-react';
import {createPortal} from 'react-dom';
import {Button} from './ui/button';

export function DirectivaFab({label,onClick,disabled=false}:{label:string;onClick:()=>void;disabled?:boolean}){
 const [reduced,setReduced]=useState(false);
 const [mounted,setMounted]=useState(false);
 const previous=useRef(0);
 useEffect(()=>{setMounted(true);previous.current=window.scrollY;const scroll=()=>{const current=window.scrollY;if(Math.abs(current-previous.current)>4){setReduced(current>previous.current&&current>64);previous.current=current;}};window.addEventListener('scroll',scroll,{passive:true});return()=>window.removeEventListener('scroll',scroll);},[]);
 return mounted?createPortal(<Button aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`directiva-fab ${reduced?'is-reduced':''}`}><Plus aria-hidden="true"/></Button>,document.body):null;
}