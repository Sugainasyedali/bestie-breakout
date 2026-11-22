import pg from 'pg';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {catalog,worlds,descriptions,badges,badgeHints,slug} from '../shared/catalog.js';
export async function seed(q:(sql:string,params?:any[])=>Promise<any>){
 for(const [i,w] of worlds.entries())await q('insert into bestie.game_worlds(id,slug,name,description,world_number,thumbnail,background_asset,difficulty) values($1,$2,$3,$4,$1,$5,$6,$1) on conflict(id) do update set name=excluded.name,description=excluded.description',[i+1,slug(w),w,descriptions[i],'/art/m'+(i+1)+'.svg','/art/worlds/'+i+'.svg']);
 for(const l of catalog)await q('insert into bestie.game_levels(id,world_id,slug,level_number,title,description,objective,difficulty,mechanic_type,level_config,star_thresholds,prerequisites,content_version) values($1,$2,$3,$1,$4,$5,$5,$6,$7,$8,$9,$10,1) on conflict(id) do update set title=excluded.title,objective=excluded.objective,level_config=excluded.level_config,updated_at=now()',[l.id,l.world+1,l.slug,l.title,l.objective,l.difficulty,l.challenge?.stages[0].mode??'original',JSON.stringify(l.challenge??{legacyWorld:l.world}),JSON.stringify([0,65,85]),JSON.stringify(l.id>1?[l.id-1]:[])]);
 for(const [i,b] of badges.entries())await q('insert into bestie.achievements(id,slug,name,description,category,icon,unlock_condition) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do update set description=excluded.description',[i+1,slug(b),b,badgeHints[i],'campaign','★',JSON.stringify({rule:slug(b)})]);
}
export async function migrate(q:(sql:string,params?:any[])=>Promise<any>){await q('begin');try{
 await q('select pg_advisory_xact_lock(50367312)');await q('create schema if not exists bestie');await q('create table if not exists bestie.migrations(version int primary key,checksum text not null)');
 const source=await readFile(new URL('./migrations/001_campaign.sql',import.meta.url),'utf8'),hash=createHash('sha256').update(source).digest('hex');
 const existing=(await q('select checksum from bestie.migrations where version=1')).rows[0];
 if(!existing){await q(source);await q('insert into bestie.migrations values(1,$1)',[hash])}else if(existing.checksum!==hash)throw Error('Migration checksum mismatch');
 await q('alter table bestie.game_levels drop constraint if exists game_levels_level_number_check');
 await q('alter table bestie.game_levels add constraint game_levels_level_number_check check(level_number between 1 and 60)');
 await seed(q);await q('commit')}catch(e){await q('rollback');throw e}}
if(process.argv[1]?.endsWith('setup.ts')){if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL for migrations.');const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();try{await migrate(c.query.bind(c));console.log('Campaign schema ready. Six worlds and 60 levels seeded.')}finally{await c.end()}}
