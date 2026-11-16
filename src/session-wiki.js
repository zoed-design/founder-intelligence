// Manual imports are local, unverified source records. Their text never runs as instructions.
export function collectWhatsApp({text='',entries=[],projectId='demo-18-maroubra',fileName='Pasted WhatsApp message'}={}) {
 const value=String(text).replace(/\r\n/g,'\n').trim();
 if(!value)throw new Error('Paste or confirm the message text before adding it to the Wiki.');
 if(value.length>32000)throw new Error('Please use a message shorter than 32,000 characters.');
 if(/(?:password|api[_ -]?key|access[_ -]?token|private[_ -]?key|recovery[_ -]?code)\s*[:=]\s*\S+/i.test(value))throw new Error('Remove credentials before adding this message.');
 const duplicate=entries.find(e=>e.text===value);if(duplicate)return {entries,entry:duplicate,duplicate:true};
 const tags=['WhatsApp','Site update'];
 for(const [test,label] of [[/roof|truss|rafter|fall|pitch/i,'Roofing'],[/800|height|takeoff|windows/i,'Takeoff review'],[/inspect|certif|\bOC\b/i,'Inspection & documents'],[/date|finish|schedule|\b20\d{2}\b/i,'Schedule query']])if(test.test(value))tags.push(label);
 const entry={id:`wiki-message-${entries.length+1}`,projectId,title:'Site manager ↔ construction admin',fileName,text:value,tags,tier:'internal',status:'User-supplied · unverified'};
 return {entries:[...entries,entry],entry,duplicate:false};
}
export function wikiMessageSources(entries=[]) {return entries.map(e=>({id:e.id,title:e.title,file:e.fileName,locator:`Session Wiki · ${e.id} · ${e.status}`,evidence:e.text,tier:'internal'}));}
export function findWikiMessage(question,entries=[]) {
 const stop=new Set(['what','the','this','that','which','latest','message','whatsapp','said','say','did','and','about','please']);
 const terms=(String(question).toLowerCase().match(/[a-z0-9]{3,}/g)||[]).filter(t=>!stop.has(t));
 const scored=entries.map((entry,i)=>({entry,score:terms.filter(t=>entry.text.toLowerCase().includes(t)).length,i})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.i-a.i);
 return scored[0]?.entry||null;
}
