"use client";
import {useEffect,useState} from 'react';import {WorldMap} from '../world-map';
export default function Map(){const [data,D]=useState({max:1,progress:[]});useEffect(()=>{fetch('/api/player').then(r=>r.ok?r.json():null).then(d=>{if(d)D(d)})},[]);return <WorldMap max={data.max} progress={data.progress} onBack={()=>location.assign('/')} onSelect={n=>location.assign('/?level='+n)}/>}
