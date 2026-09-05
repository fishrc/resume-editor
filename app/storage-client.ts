import type {ResumeState} from './snapshots';
export type Snapshot={id:string;name:string;createdAt:string;resume:ResumeState};
export type DatabaseState={draft:ResumeState|null;revision:number;snapshots:Snapshot[]};
export async function storageRequest<T=DatabaseState>(body?:object):Promise<T>{
 const response=await fetch('/api/storage',{method:body?'POST':'GET',headers:{'X-LiveResume':'1',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const result:unknown=await response.json();if(!response.ok)throw new Error((result as {error?:string})?.error||'数据库操作失败');return result as T;
}
