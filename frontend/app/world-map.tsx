"use client";

import { useState, type CSSProperties } from "react";
import { ArrowLeft, Castle, Check, Clock3, Cloud, Flag, Gamepad2, Leaf, LockKeyhole, Map as MapIcon, Pizza, Play, Settings2, Star, Trophy, Users } from "lucide-react";
import { catalog, descriptions, worlds } from "../../shared/catalog";
import "./world-map.css";

type RecordEntry = {
  level_id: number;
  best_stars: number;
  best_time_ms: number | null;
  best_teamwork_score: number;
  completion_count: number;
};
type Props = {
  max: number;
  progress: RecordEntry[];
  onSelect: (level: number) => void;
  onBack: () => void;
};

const motifs = [Castle, Settings2, Leaf, Gamepad2, Cloud, Pizza];
const accents = ["#ffbf8c", "#ffd56c", "#94dcc0", "#d9aaff", "#a9d9ff", "#ffac9c"];
const points = [[9,66],[24,37],[40,59],[56,32],[73,53],[91,29]];
const difficulty = ["Easy", "Steady", "Tricky", "Tough", "Expert"];

function stars(n: number, size: number) {
  return [1, 2, 3].map((i) => <Star aria-hidden="true" key={i} size={size} fill={i <= n ? "currentColor" : "none"} />);
}
function duration(ms: number | null | undefined) {
  if (ms == null) return "—";
  const seconds = Math.round(ms / 1000);
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

export function WorldMap({ max, progress, onSelect, onBack }: Props) {
  const unlocked = Math.min(catalog.length, Math.max(1, max));
  const [selected, choose] = useState(unlocked);
  const active = catalog[selected - 1];
  const w = active.world;
  const stages = catalog.filter((item) => item.world === w);
  const saved = new Map(progress.map((item) => [item.level_id, item]));
  const record = saved.get(selected);
  const completed = progress.filter((item) => item.completion_count > 0).length;
  const collected = progress.reduce((total, item) => total + item.best_stars, 0);
  const earned = stages.reduce((total, item) => total + (saved.get(item.id)?.best_stars || 0), 0);
  const locked = selected > unlocked;
  const WorldIcon = motifs[w];

  return (
    <section className="wm-screen" style={{"--wm-accent":accents[w]} as CSSProperties} aria-label="Adventure map">
      <div className="wm-shell">
        <div className="wm-bar">
          <button className="wm-back" onClick={onBack}><ArrowLeft size={17}/> Back</button>
          <strong><MapIcon aria-hidden="true" size={23}/> Adventure map</strong>
          <span className="wm-score"><Trophy size={17}/>{completed} / {catalog.length}<span> cleared</span></span>
        </div>
        <nav className="wm-worlds" aria-label="Choose a world">
          {worlds.map((world, i) => {
            const Icon = motifs[i];
            const first = i * 6 + 1;
            return <button key={world} type="button" aria-pressed={i === w} onClick={() => choose(Math.max(first, Math.min(first + 5, unlocked)))}>
              <Icon size={18}/><span>{world}</span>{first > unlocked && <LockKeyhole size={13} aria-label="Locked world"/>}
            </button>;
          })}
        </nav>
        <div className="wm-layout">
          <div className="wm-map">
            <div key={w} className="wm-illustration" style={{backgroundImage:`url(/art/worlds/${w}.svg)`}}/>
            <div className="wm-heading">
              <span className="wm-tag"><WorldIcon size={15}/> World {w + 1} / {worlds.length}</span>
              <h1>{worlds[w]}</h1>
              <p>{descriptions[w]}</p>
            </div>
            <div className="wm-route" aria-label="Choose a level">
              <svg className="wm-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke="#302838" strokeWidth="7" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
                <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff1b9" strokeWidth="3" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
              </svg>
              {stages.map((stage, i) => {
                const r = saved.get(stage.id);
                const closed = stage.id > unlocked;
                return <button type="button" className={'wm-pin'+(closed?' wm-closed':'')} key={stage.id}
                  style={{left:points[i][0]+"%",top:points[i][1]+"%"}}
                  aria-label={`${stage.id}. ${stage.title}, ${closed?'locked':r?.completion_count?'cleared':'unlocked'}`}
                  aria-pressed={selected === stage.id} onClick={() => choose(stage.id)}>
                  <span>{String(stage.id).padStart(2,"0")}</span>
                  {closed ? <LockKeyhole className="wm-pin-mark" size={14}/> : r?.completion_count ? <Check className="wm-pin-mark" size={14}/> : <Flag className="wm-pin-mark" size={14}/>}
                </button>;
              })}
            </div>
            <div className="wm-map-foot">
              <span><Star size={16} fill="currentColor"/> {earned} / 18 world stars</span>
              <span>{stages.filter(s => (saved.get(s.id)?.completion_count || 0) > 0).length} / 6 cleared</span>
            </div>
          </div>
          <div className="wm-detail" aria-live="polite">
            <div className="wm-level-line"><span>Level {String(selected).padStart(2,"0")}</span><span className="wm-state">
              {locked ? <><LockKeyhole size={13}/> Locked</> : record?.completion_count ? <><Check size={14}/> Cleared</> : <><Flag size={13}/> Unlocked</>}
            </span></div>
            <h2>{active.title}</h2>
            <div className="wm-earned" aria-label={`${record?.best_stars || 0} of 3 stars`}>{stars(record?.best_stars || 0, 22)}</div>
            <p>{active.objective}</p>
            <div className="wm-rules"><span><Clock3 size={15}/> {active.limit}s limit</span><span><Flag size={15}/> {difficulty[active.difficulty - 1]}</span></div>
            <dl>
              <div><dt>Best time</dt><dd>{duration(record?.best_time_ms)}</dd></div>
              <div><dt>Best teamwork</dt><dd>{record?.completion_count ? record.best_teamwork_score : "—"}</dd></div>
              <div><dt>Completions</dt><dd>{record?.completion_count || 0}</dd></div>
            </dl>
            {locked && <small>Clear {catalog[selected - 2].title} to unlock.</small>}
            <button className="wm-launch" type="button" disabled={locked} onClick={() => onSelect(selected)}>
              {locked ? <LockKeyhole size={18}/> : <Play size={18} fill="currentColor"/>}
              {locked ? "Level locked" : "Select level"}
            </button>
          </div>
        </div>
        <div className="wm-summary"><span><Users size={16}/> Two-player adventure</span><span><Star size={16}/> {collected} / {catalog.length * 3} adventure stars</span></div>
      </div>
    </section>
  );
}
