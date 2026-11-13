import type {ReactNode} from 'react';
import escudo from '@/assets/escudo-rul-transparente.png.asset.json';
export function AccesoVisual({compact=false,children}:{compact?:boolean;children:ReactNode}){
 return <section className={`access-screen ${compact?'access-compact':''}`}><div className="access-identity"><div className="access-crest-wrap"><img src={escudo.url} alt="Escudo del Real Unión Lucense F.S." className="access-crest"/></div><h1 className="access-motto">Más que un club,<br/>un grupo de amigos.</h1><span className="access-gold" aria-hidden="true"/></div><div className="access-bottom">{children}</div></section>;
}