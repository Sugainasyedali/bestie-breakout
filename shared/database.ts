import pg from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import {sql} from 'drizzle-orm';
import {randomUUID} from 'node:crypto';
import {catalog} from './catalog.js';
const globalDB=globalThis as typeof globalThis & {bestiePool?:pg.Pool};
export function pool(){if(!process.env.DATABASE_URL_POOLED)throw Error('Cloud saves are not configured.');return globalDB.bestiePool??=new pg.Pool({connectionString:process.env.DATABASE_URL_POOLED,connectionTimeoutMillis:5000,max:5,options:'-c search_path=bestie,public'})}
// Qualify all tables explicitly: transaction-mode poolers may discard session settings.
export async function profileFor(subject:string,name:string){
 const db=drizzle(pool());const r=await db.execute(sql`insert into bestie.player_profiles(auth_user_id,username,display_name) values(${subject},${'player_'+randomUUID().slice(0,8)},${name.slice(0,40)||'Bestie'}) on conflict(auth_user_id) do update set auth_user_id=excluded.auth_user_id returning *`);
 const profile=r.rows[0] as {id:string;auth_user_id:string;username:string;display_name:string;avatar_object_key:string|null;character_color:string;character_id:string;bio:string};
 await pool().query('insert into bestie.player_settings(user_id) values($1) on conflict do nothing',[profile.id]);await pool().query('insert into bestie.player_stats(user_id) values($1) on conflict do nothing',[profile.id]);return profile;
}
export async function unlocked(id:string){const r=await pool().query('select coalesce(min(l.id),60) as n from bestie.game_levels l where l.is_active and not exists(select 1 from bestie.player_level_progress p where p.user_id=$1 and p.level_id=l.id and p.completion_count>0)',[id]);return Number(r.rows[0].n)}
export type Attempt={id:string;session:string;round:number;level:number;hash:string;host:string|null;start:string;end:string;outcome:'win'|'loss'|'abandoned';seconds:number;score:number;stars:number;mistakes:number;players:{user:string|null;guest:string;character:string;role:number}[]};
export async function saveAttempt(a:Attempt,connection?:Pick<pg.PoolClient,'query'>){
 const client=connection??await pool().connect(),q=client.query.bind(client);
 try{await q('begin');await q('set local search_path=bestie,public');
 // Only retain account associations that still exist (including during queued retries after deletion).
 const people=[];for(const p of [...a.players].sort((x,y)=>(x.user||'').localeCompare(y.user||''))){const user=p.user?(await q('select id from player_profiles where id=$1 for update',[p.user])).rows[0]?.id:null;people.push({...p,user:user??null})}
 await q("insert into game_sessions(id,session_id,room_code_hash,host_user_id,status,started_at,ended_at) values($1,$1,$2,$3,'recorded',$4,$5) on conflict(id) do nothing",[a.session,a.hash,people.find(p=>p.user===a.host)?.user??null,a.start,a.end]);
 const inserted=await q('insert into level_attempts(id,session_id,level_id,attempt_number,outcome,duration_ms,mistakes,teamwork_score,stars_earned,created_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict do nothing returning id',[a.id,a.session,a.level,a.round,a.outcome,a.seconds*1000,a.mistakes,a.score,a.stars,a.end]);
 if(!inserted.rows.length){await q('commit');return}
 await q('update game_sessions set total_duration=total_duration+$2,ended_at=greatest(ended_at,$3),started_at=least(started_at,$4) where id=$1',[a.session,a.seconds,a.end,a.start]);
 for(const p of people){await q('insert into game_session_players(session_id,user_id,guest_player_id,player_role,character_id,joined_at,left_at) values($1,$2,$3,$4,$5,$6,$7) on conflict(session_id,guest_player_id) do update set left_at=greatest(game_session_players.left_at,excluded.left_at)',[a.session,p.user,p.guest,p.role,p.character,a.start,a.end]);
 if(!p.user)continue;const win=a.outcome==='win';
 await q('insert into level_attempt_players(attempt_id,user_id,player_character,individual_score,participation_status) values($1,$2,$3,$4,$5)',[a.id,p.user,p.character,a.score,a.outcome==='abandoned'?'interrupted':'played']);
 await q(`insert into player_level_progress as p(user_id,level_id,status,attempts_count,completion_count,best_time_ms,best_teamwork_score,best_stars,first_completed_at,last_played_at)
 values($1,$2,$3,1,$4,$5,$6,$7,$8,$9)
 on conflict(user_id,level_id) do update set attempts_count=p.attempts_count+1,completion_count=p.completion_count+excluded.completion_count,status=case when p.status='completed' then p.status else excluded.status end,best_time_ms=least(p.best_time_ms,excluded.best_time_ms),best_teamwork_score=greatest(p.best_teamwork_score,excluded.best_teamwork_score),best_stars=greatest(p.best_stars,excluded.best_stars),first_completed_at=least(p.first_completed_at,excluded.first_completed_at),last_played_at=greatest(p.last_played_at,excluded.last_played_at),updated_at=now()`,[p.user,a.level,win?'completed':'available',win?1:0,win?a.seconds*1000:null,a.score,a.stars,win?a.end:null,a.end]);
 const complete=(await q('select level_id,best_stars from player_level_progress where user_id=$1 and completion_count>0',[p.user])).rows;
 await q(`insert into player_stats as s(user_id,total_xp,total_stars,levels_completed,total_playtime_seconds,total_games,best_teamwork_score) values($1,$2,$3,$4,$5,1,$6) on conflict(user_id) do update set total_xp=s.total_xp+excluded.total_xp,total_stars=excluded.total_stars,levels_completed=excluded.levels_completed,total_playtime_seconds=s.total_playtime_seconds+excluded.total_playtime_seconds,total_games=s.total_games+1,best_teamwork_score=greatest(s.best_teamwork_score,excluded.best_teamwork_score),updated_at=now()`,[p.user,win?50+a.stars*15:0,complete.reduce((sum,row)=>sum+row.best_stars,0),complete.length,a.seconds,a.score]);
 if(!win)continue;
 const levels=new Set(complete.map(r=>r.level_id));const sessionWins=Number((await q("select count(distinct level_id) n from level_attempts a join level_attempt_players p on a.id=p.attempt_id where session_id=$1 and outcome='win' and user_id=$2",[a.session,p.user])).rows[0].n);
 const fullWorld=(w:number)=>catalog.filter(l=>l.world===w).map(l=>levels.has(l.id)).every(Boolean);
 const conditions=[true,a.mistakes===0,sessionWins>=6,fullWorld(3),a.seconds<catalog[a.level-1].limit/2,a.mistakes>=5,[0,1,2,3,4,5].some(fullWorld),levels.size===60];
 for(const [i,earned] of conditions.entries())if(earned){await q('insert into player_achievements(user_id,achievement_id) values($1,$2) on conflict do nothing',[p.user,i+1]);await q('insert into player_inventory(user_id,cosmetic_id,source) values($1,$2,$3) on conflict do nothing',[p.user,['scout-cap','star-pin','violet-dye','arcade-crown','wing-pin','party-hat','explorer-hat','gold-crown'][i],'achievement-'+(i+1)])}
 }
 await q('commit')
 }catch(e){await q('rollback');throw e}finally{if(!connection)(client as pg.PoolClient).release()}
}
