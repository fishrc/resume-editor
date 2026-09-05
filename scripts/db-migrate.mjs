import {readFile} from 'node:fs/promises';
import {transaction,closePool} from '../server/db.mjs';
try{const sql=await readFile(new URL('../server/schema.sql',import.meta.url),'utf8');await transaction(async client=>{await client.query("SELECT pg_advisory_xact_lock(89203471)");await client.query(sql);});console.log('PostgreSQL schema ready.');}catch{console.error('Database initialization failed. Check .env.local, network, TLS certificate and CREATE TABLE permissions. No credentials were logged.');process.exitCode=1;}finally{await closePool();}
