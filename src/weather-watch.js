// Local, explicitly simulated weather only. No third-party weather requests are made.
export const WEATHER_DEMO_URL='sample-data/weather-demo.json';
export const WORK_STAGES={demolition:'Demolition',concreting:'Concreting',bricklaying:'Bricklaying',framing:'Framing',roofing:'Near lock-up / roofing',enclosed:'Enclosed / after lock-up'};
const HR=3600000;
export const forecastDay=s=>new Date(s+'T12:00:00Z').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const shift=(s,n)=>new Date(Date.parse(s+'T12:00:00Z')+n*24*HR).toISOString().slice(0,10);
export function usableWeather(w,now=Date.now()){
 if(w?.mode==='demo')return w.status==='ready'&&w.url===WEATHER_DEMO_URL&&/^weather-demo-\d{8}$/.test(w.id)&&Array.isArray(w.days)&&w.days.length===7&&w.days.every((d,i)=>/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&Number.isFinite(Date.parse(d.date))&&new Date(d.date).toISOString().slice(0,10)===d.date&&d.date===shift(w.days[0].date,i)&&d.complete===true&&Number.isFinite(d.rainMm)&&d.rainMm>=0&&d.rainMm<=2000)&&w.roofingAllowance?.minWorkingDays===0&&w.roofingAllowance?.maxWorkingDays===2;
 return false;
}
export function validateDemoWeather(raw){
 if(raw?.schemaVersion!==1||raw.mode!=='demo'||typeof raw.notice!=='string'||!Array.isArray(raw.days)||!raw.days.length)throw new Error('The weather example could not be loaded.');
 const data={...raw,status:'ready',url:WEATHER_DEMO_URL,id:'weather-demo-'+String(raw.days[0].date).replace(/-/g,''),days:raw.days.map(d=>({...d,complete:true}))};if(!usableWeather(data))throw new Error('Invalid weather example.');return data;
}
export function rainWatch(w,stage='roofing',now=Date.now()){
 if(!usableWeather(w,now))return {ready:false,rain:[],sensitive:false,stage};
 const sensitive=Object.hasOwn(WORK_STAGES,stage)&&stage!=='enclosed';const rain=w.days.filter(d=>d.complete&&d.rainMm>=1);
 return {ready:true,sensitive,rain,stage,window:`${forecastDay(w.days[0].date)}–${forecastDay(w.days.at(-1).date)}`,incomplete:w.days.some(d=>!d.complete)};
}
const actions={demolition:'Review site access, exposed areas and the demolition sequence with Digger before confirming the work plan.',concreting:'Check the pour plan, weather protection and readiness with Digger and the concrete contractor before confirming the pour.',bricklaying:'Review exposed masonry, material protection and the work sequence with Digger and the bricklaying contractor.',framing:'Review protection for exposed framing and coordinate the next weather-sensitive activities with Digger.',roofing:'Review exposed framing/roof areas, protection and the roofing sequence with Digger and the roofer before confirming work.'};
export function weatherReminder(w,stage='roofing',now=Date.now()){
 const a=rainWatch(w,stage,now);if(!a.ready||!a.sensitive||!a.rain.length)return null;
 return `${w.mode==='demo'?'SIMULATED WEATHER EXAMPLE — not a live forecast. ':''}Rain watch for Digger and Roo: ${a.rain.map(d=>`${forecastDay(d.date)} (${d.rainMm.toFixed(1)} mm ${w.mode==='demo'?'example rainfall':'model estimate'})`).join(', ')}. Reported stage: ${WORK_STAGES[stage]}. ${actions[stage]} This flags possible disruption; it does not confirm a work stoppage or an approved delay. This reminder is in the app only.`;
}
export function weatherSource(w,now=Date.now()){
 if(usableWeather(w,now)&&w.mode==='demo')return {id:w.id,title:'Simulated rainy-week example — not a live forecast',tier:'public',file:'Prototype illustration',url:WEATHER_DEMO_URL,locator:`Scenario week ${w.days[0].date}–${w.days.at(-1).date}`,evidence:`Invented example rainfall: ${w.days.map(d=>`${forecastDay(d.date)} ${d.rainMm} mm`).join('; ')}. The illustrative roofing allowance is 0–2 working days, a scenario assumption rather than a rainfall calculation or an approved program change. No live weather service is connected.`};
 return null;
}
export function weatherGuidance({weather,stage='roofing',project,kind='general',audience='workspace',now=Date.now()}={}){
 const a=rainWatch(weather,stage,now),client=audience==='client';
 if(!a.ready)return {text:'The weather example is unavailable. No live weather service is connected; the supplied program dates remain the reference.',citations:[]};
 let text=`SIMULATED WEATHER EXAMPLE — not a live forecast. The example week is ${a.window}. `;
 if(a.rain.length)text+=`Example rain is shown on ${a.rain.map(d=>forecastDay(d.date)).join(', ')}. `;
 else text+='The example does not show rain-watch days; this is not a prediction of actual dry weather. ';
 if(!Object.hasOwn(WORK_STAGES,stage))text+='The work stage has not been established; confirm it with Digger before assessing exposure. ';
 else if(!a.sensitive)text+='The reported stage is enclosed / after lock-up, so no automatic pre-lock-up reminder is raised. Review any remaining external work separately. ';
 if(kind==='roof'){
  const row=project?.schedule?.rows.find(r=>r.sourceRow===project.schedule.milestones.roofCovering);
  const overlap=row?.start&&row?.finish?weather.days.filter(d=>d.date>=row.start&&d.date<=row.finish):[];
  if(!overlap.length)text+='The example week does not overlap the scheduled roof-covering window, so it cannot support moving that finish date. ';
  else if(a.rain.length&&a.sensitive&&stage==='roofing'){text+=`${overlap.filter(d=>d.rainMm>=1).length} example rain-watch days overlap the scheduled roofing window. For demonstration, the scenario assumes a provisional 0–2 working-day roofing allowance. This allowance is invented, not calculated from rain or approved by Digger; the scheduled finish has not changed. `;}
 }
 if(a.rain.length&&a.sensitive)text+='Rain-watch days are not automatically lost working days. Actual impact depends on timing, site conditions, protection, drying and task dependencies. ';
 if(kind==='project')text+='This example cannot establish a revised whole-project completion date; the site manager needs to review the program and any confirmed disruption. ';
 text+=client?'If conditions like these affected your build, the site team would review the work sequence and confirm any material change. We’ll keep you posted as dates are confirmed, so you can plan with clearer information.':`${actions[stage]||'Confirm the work stage and exposed tasks with Digger.'} Record any confirmed disruption before revising dates or client wording.`;
 return {text,citations:[weather.id]};
}
export function isWeatherQuestion(q=''){return /\b(?:weather|rain\w*|forecast|wet weather|storm\w*)\b|下雨|降雨|天气/i.test(q);}
