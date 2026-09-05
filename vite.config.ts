import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import {defineConfig,loadEnv} from 'vite';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 for(const key of ['DATABASE_URL','PGHOST','PGPORT','PGDATABASE','PGUSER','PGPASSWORD','PGSSLMODE','PGSSLROOTCERT','RESUME_WORKSPACE'])if(process.env[key]===undefined&&env[key]!==undefined)process.env[key]=env[key];
 return {css:{postcss:{plugins:[tailwindcss()]}},server:{host:'127.0.0.1'},plugins:[vinext()]};
});
