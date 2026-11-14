import {emailSchema} from './email-validation';
export function googleEmail(email:string){const parsed=emailSchema.safeParse(email);return parsed.success&&/@(?:gmail|googlemail)\.com$/.test(parsed.data);}
export function canRemovePassword(email:string,googleIdentity=false){return googleIdentity||googleEmail(email);}