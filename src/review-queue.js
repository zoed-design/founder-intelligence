// Browser-session review workflow. It sends nothing and makes no approval decision.
export function queueReview(entries,{question,audience='workspace',reason='',citations=[]}){
 const value=String(question).trim();if(!value||!['workspace','admin','client','social'].includes(audience))throw new Error('A question and valid origin are required.');
 const existing=entries.find(e=>e.status==='pending'&&e.audience===audience&&e.question.toLowerCase()===value.toLowerCase());
 if(existing)return {entries,entry:existing,duplicate:true};
 const entry={id:'review-'+(entries.length+1),question:value,audience,reason,citations:[...new Set(citations)],status:'pending',reply:'',createdAt:new Date().toISOString()};return {entries:[...entries,entry],entry,duplicate:false};
}
export function resolveReview(entries,id,reply){
 const value=String(reply).trim();if(!value)throw new Error('Write a reviewed response before returning it.');
 const entry=entries.find(e=>e.id===id);if(!entry||entry.status!=='pending')throw new Error('This question is not waiting for review.');
 if(value.length>6000)throw new Error('Keep the reviewed response under 6,000 characters.');
 if(/(?:password|api[_ -]?key|access[_ -]?token|private[_ -]?key|recovery[_ -]?code)\s*[:=]\s*\S+/i.test(value))throw new Error('Remove credentials from the response.');
 if(['client','social'].includes(entry.audience)&&/\b(?:supplier margin|profit margin|lender details|internal only|private team|Mark|Kira)\b/i.test(value))throw new Error('Remove internal team or commercial details before returning this response.');
 return {entries:entries.map(e=>e.id===id?{...e,status:'answered',reply:value}:e),entry:{...entry,status:'answered',reply:value}};
}
