// Imports stay in this browser session. Original image evidence is never replaced by indexing text.
function checkedAttachment(input){
 if(!input)return null;
 const {url,mime,hash,fileName}=input;
 let safe=false;try{if(typeof url==='string'&&url.startsWith('blob:')){const inner=new URL(url.slice(5));safe=['http:','https:'].includes(inner.protocol)&&!!inner.hostname;}}catch{}
 if(!safe||!['image/png','image/jpeg','image/webp'].includes(mime)||! /^[a-f0-9]{64}$/.test(hash||''))throw new Error('Choose a valid image attachment before adding it to the Wiki.');
 return {url,mime,hash,fileName:String(fileName||'WhatsApp screenshot')};
}
export function collectWhatsApp({text='',attachment=null,interpretation='',entries=[],projectId='demo-18-maroubra',fileName='Pasted WhatsApp message'}={}) {
 const value=String(text).replace(/\r\n/g,'\n').trim(),image=checkedAttachment(attachment);
 if(!value&&!image)throw new Error('Upload a WhatsApp screenshot or confirm message text before adding it to the Wiki.');
 if(value.length>32000)throw new Error('Please use a message shorter than 32,000 characters.');
 if(/(?:password|api[_ -]?key|access[_ -]?token|private[_ -]?key|recovery[_ -]?code)\s*[:=]\s*\S+/i.test(value))throw new Error('Remove credentials before adding this message.');
 const duplicate=entries.find(e=>image?e.attachment?.hash===image.hash:!e.attachment&&e.text===value);if(duplicate)return {entries,entry:duplicate,duplicate:true};
 const tags=['WhatsApp','Site update'];if(image)tags.push('Drawing attachment');
 for(const [test,label] of [[/roof|truss|rafter|fall|pitch/i,'Roofing'],[/800|height|takeoff|windows/i,'Takeoff review'],[/inspect|certif|\bOC\b/i,'Inspection & documents'],[/date|finish|schedule|\b20\d{2}\b/i,'Schedule query']])if(test.test(value))tags.push(label);
 const indexed=image&&interpretation==='reviewed-sample'&&!!value;
 const summary=image?(indexed?'Site-manager and admin discussion with an elevation and roof markup, organised for takeoff, estimating and quantity-order review.':'Original WhatsApp screenshot retained with its drawings. Visual interpretation is awaiting Digger’s review.') : value;
 const entry={id:`wiki-message-${entries.length+1}`,projectId,title:'Site manager ↔ construction admin',fileName:image?.fileName||fileName,text:value,summary,tags,tier:'internal',attachment:image,interpretation:image?(indexed?'reviewed-sample':'pending-review'):'text',status:image?(indexed?'Original image retained · reviewed demo indexing notes':'Original image retained · visual review pending'):'User-supplied · unverified'};
 return {entries:[...entries,entry],entry,duplicate:false};
}
export function wikiMessageSources(entries=[]) {return entries.map(e=>({id:e.id,title:e.title,file:e.fileName,locator:`Session Wiki · ${e.id} · ${e.status}`,evidence:e.attachment?e.summary:e.text,tier:'internal',...(e.attachment?{url:e.attachment.url,imageUrl:e.attachment.url,imageAlt:'Original WhatsApp screenshot, including the conversation and any embedded drawings'}:{})}));}
export function findWikiMessage(question,entries=[]) {
 const stop=new Set(['what','the','this','that','which','latest','message','whatsapp','said','say','did','and','about','please']);
 const terms=(String(question).toLowerCase().match(/[a-z0-9]{3,}/g)||[]).filter(t=>!stop.has(t));
 const scored=entries.map((entry,i)=>({entry,score:terms.filter(t=>(entry.text+' '+(entry.summary||'')).toLowerCase().includes(t)).length,i})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.i-a.i);
 return scored[0]?.entry||null;
}
