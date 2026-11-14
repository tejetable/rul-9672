/** Presentation only: never apply to ids, role values, queries or stored records. */
export function textoMiembros(text:string){
 return text.replace(/\bsoci(?:a|o)s?(?:\s*\/\s*(?:[ao]s?|os))?\b/gi,word=>{
  const plural=/s(?:\s*\/|$)/i.test(word)||/\/(?:os|as)$/i.test(word);
  return `${word[0]===word[0]?.toUpperCase()?'S':'s'}oci@${plural?'s':''}`;
 }).replace(/\b[Ss]oci@s? (?:activ[oa]s?)\b/g,word=>`${word.split(' ')[0]} en activo`).replace(/\b[Ss]oci@s? desactivad[oa]s?\b/g,word=>`${word.split(' ')[0]} de baja`).replace(/\b(?:Bienvenida\/o|Bienvenido\/a|Bienvenida|Bienvenido)\b/g,'Te damos la bienvenida');
}
export function textoAccesible(text:string){return textoMiembros(text).replace(/Soci@s/g,'Socios o socias').replace(/soci@s/g,'socios o socias').replace(/Soci@/g,'Socio o socia').replace(/soci@/g,'socio o socia');}