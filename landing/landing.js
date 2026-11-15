import {createMap} from '../src/map.js?v=client-stories-1';
const portraits=Object.fromEntries(['router','capture','curator','teamwork','commercial','content'].map(id=>[id,`assets/${id}.webp`]));
createMap(document.querySelector('#vision-map'),{},portraits);
