import 'server-only';
import {S3Client,GetObjectCommand,HeadObjectCommand,PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {createPresignedPost} from '@aws-sdk/s3-presigned-post';import {getSignedUrl} from '@aws-sdk/s3-request-presigner';import {randomUUID} from 'node:crypto';import sharp from 'sharp';
import {pool} from '../../shared/database';import {Problem} from './api';
export const maxBytes=2097152;
const bucket=()=>process.env.S3_BUCKET||'profile';
let client:S3Client|undefined;
function s3(){if(!process.env.AWS_ENDPOINT_URL_S3||!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)throw new Problem(503,'Profile storage is not configured.');return client??=new S3Client({endpoint:process.env.AWS_ENDPOINT_URL_S3,region:process.env.AWS_REGION||'auto',forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY}})}
export function dimensions(mime:unknown,bytes:unknown){if(typeof mime!=='string'||!['image/png','image/jpeg','image/webp'].includes(mime))throw new Problem(415,'Choose a PNG, JPEG, or WebP image.');if(typeof bytes!=='number'||!Number.isInteger(bytes)||bytes<1||bytes>maxBytes)throw new Problem(413,'Choose an image under 2 MB.');return {mime,bytes}}
export async function upload(id:string,type:unknown,size:unknown){const {mime,bytes}=dimensions(type,size),key='users/'+id+'/uploads/'+randomUUID();const signed=await createPresignedPost(s3(),{Bucket:bucket(),Key:key,Expires:120,Fields:{'Content-Type':mime},Conditions:[['content-length-range',1,maxBytes],['eq','$Content-Type',mime]]});
 await pool().query("insert into bestie.avatar_uploads values($1,$2,$3,$4,now()+interval '3 minutes')",[key,id,mime,bytes]);return {...signed,key}}
export async function removeObject(key:string|null){if(key)await s3().send(new DeleteObjectCommand({Bucket:bucket(),Key:key}))}
export async function readAvatar(id:string,key:string|null){if(!key||!key.startsWith('users/'+id+'/avatars/'))return null;return getSignedUrl(s3(),new GetObjectCommand({Bucket:bucket(),Key:key}),{expiresIn:120})}
export async function complete(id:string,key:unknown){
 if(typeof key!=='string'||!key.startsWith('users/'+id+'/uploads/'))throw new Problem(403,'Invalid upload.');
 const pending=(await pool().query('select mime,bytes from bestie.avatar_uploads where key=$1 and user_id=$2 and expires_at>now()',[key,id])).rows[0];if(!pending)throw new Problem(404,'Upload expired.');
 const obj={Bucket:bucket(),Key:key};const head=await s3().send(new HeadObjectCommand(obj));if(head.ContentLength!==pending.bytes||head.ContentType!==pending.mime)throw new Problem(400,'Uploaded file metadata did not match.');
 const body=(await s3().send(new GetObjectCommand({...obj,IfMatch:head.ETag}))).Body;if(!body)throw new Problem(400,'Empty upload.');const bytes=await body.transformToByteArray();let safe:Buffer;
 try{const image=sharp(bytes,{limitInputPixels:16000000});const meta=await image.metadata();if('image/'+meta.format!==pending.mime)throw Error();safe=await image.rotate().resize(320,320,{fit:'cover'}).webp().toBuffer()}catch{throw new Problem(400,'Invalid or excessively large image dimensions.')}
 const finalKey='users/'+id+'/avatars/'+randomUUID()+'.webp';await s3().send(new PutObjectCommand({Bucket:bucket(),Key:finalKey,Body:safe,ContentType:'image/webp'}));
 const c=await pool().connect();let old:string|null=null;try{await c.query('begin');old=(await c.query('select avatar_object_key from bestie.player_profiles where id=$1 for update',[id])).rows[0].avatar_object_key;
 const claimed=await c.query('delete from bestie.avatar_uploads where key=$1 and user_id=$2 returning key',[key,id]);if(!claimed.rowCount)throw new Problem(409,'Upload already completed.');await c.query('update bestie.player_profiles set avatar_object_key=$2,updated_at=now() where id=$1',[id,finalKey]);await c.query('commit')}catch(e){await c.query('rollback');await removeObject(finalKey);throw e}finally{c.release()}
 await Promise.allSettled([removeObject(key),removeObject(old)]);return {url:await readAvatar(id,finalKey)}}
export async function eraseAvatar(id:string){const c=await pool().connect();try{await c.query('begin');const row=(await c.query('select avatar_object_key from bestie.player_profiles where id=$1 for update',[id])).rows[0];await removeObject(row?.avatar_object_key);await c.query('update bestie.player_profiles set avatar_object_key=null,updated_at=now() where id=$1',[id]);await c.query('commit')}catch(e){await c.query('rollback');throw e}finally{c.release()}}
