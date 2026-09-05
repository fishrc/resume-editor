import pg from 'pg';
import {readFileSync} from 'node:fs';
export function connectionConfig(env=process.env){
 let url;try{url=env.DATABASE_URL?new URL(env.DATABASE_URL):null;}catch{throw new Error('DATABASE_CONFIG');}
 if(url&&!['postgres:','postgresql:'].includes(url.protocol))throw new Error('DATABASE_CONFIG');
 const host=url?.hostname||env.PGHOST,database=decodeURIComponent(url?.pathname.slice(1)||env.PGDATABASE||'');
 const user=env.PGUSER||decodeURIComponent(url?.username||''),password=env.PGPASSWORD||decodeURIComponent(url?.password||'');
 if(!host||!database||!user||!password)throw new Error('DATABASE_CONFIG');
 const mode=env.PGSSLMODE||url?.searchParams.get('sslmode')||'verify-full';
 if(!['disable','require','verify-full','verify-ca'].includes(mode))throw new Error('DATABASE_CONFIG');
 const port=Number(url?.port||env.PGPORT||5432);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('DATABASE_CONFIG');
 return {host:host.replace(/^\[|\]$/g,''),port,database,user,password,ssl:mode==='disable'?false:{rejectUnauthorized:true,...(env.PGSSLROOTCERT?{ca:readFileSync(env.PGSSLROOTCERT,'utf8')}:{})},max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000,statement_timeout:10000,application_name:'liveresume-local'};
}
let pool;
export function getPool(){if(!pool){pool=new pg.Pool(connectionConfig());pool.on('error',()=>console.error('PostgreSQL idle connection failed'));}return pool;}
export async function transaction(work){const client=await getPool().connect();try{await client.query('BEGIN');const result=await work(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}}
export async function closePool(){if(pool){await pool.end();pool=undefined;}}
