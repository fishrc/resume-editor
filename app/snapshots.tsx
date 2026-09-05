'use client';

import {useEffect,useState} from 'react';
import {storageRequest} from './storage-client';
import {AlertDialog,AlertDialogContent,AlertDialogTitle,AlertDialogDescription} from '@/components/ui/alert-dialog';

export type ResumeState={source:string;fontSize:number;leading:number;show:boolean;iconHeight:number;momentaHeight:number};
type Snapshot={id:string;name:string;createdAt:string;resume:ResumeState};
const KEY='liveresume-snapshots-v1';
function validResume(value:unknown):value is ResumeState {
 const r=value as ResumeState;
 return !!r&&typeof r.source==='string'&&typeof r.show==='boolean'&&
 [[r.fontSize,11,17],[r.leading,1.2,1.8],[r.iconHeight,8,28],[r.momentaHeight,6,20]].every(([n,min,max])=>Number.isFinite(n)&&n>=min&&n<=max);
}
function readSnapshots():Snapshot[]{
 const raw=localStorage.getItem(KEY);if(!raw)return [];
 const parsed:unknown=JSON.parse(raw);
 if(!Array.isArray(parsed)||!parsed.every(s=>s&&typeof s.id==='string'&&typeof s.name==='string'&&typeof s.createdAt==='string'&&Number.isFinite(Date.parse(s.createdAt))&&validResume(s.resume))||new Set(parsed.map(s=>s.id)).size!==parsed.length)throw new Error('快照数据无法读取，原数据已保留。');
 return parsed;
}
function timestamp(){return new Date().toLocaleString('zh-CN',{hour12:false});}
function createSnapshot(name:string,resume:ResumeState):Snapshot{return {id:crypto.randomUUID(),name,createdAt:new Date().toISOString(),resume:{...resume}};}

export function SnapshotPanel({current,onLoad}:{current:ResumeState;onLoad:(resume:ResumeState)=>void}){
 const [busy,setBusy]=useState(false);
 const [items,setItems]=useState<Snapshot[]>([]),[name,setName]=useState(''),[editing,setEditing]=useState<string|null>(null),[rename,setRename]=useState(''),[deleting,setDeleting]=useState<Snapshot|null>(null),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function refresh(){const data=await storageRequest();setItems(data.snapshots);}
 useEffect(()=>{refresh().catch(e=>setError(e.message));},[]);
 async function mutate(action:object,success:string){if(busy)return false;setBusy(true);setError('');try{await storageRequest(action);setMessage(success);await refresh();return true;}catch(e){setError(e instanceof Error?e.message:'数据库操作失败');return false;}finally{setBusy(false);}}
 async function save(){const title=name.trim()||`简历 · ${timestamp()}`;if(await mutate({action:'saveSnapshot',id:crypto.randomUUID(),name:title,resume:current},`已保存“${title}”到数据库`))setName('');}
 async function load(id:string){if(busy)return;setBusy(true);try{const data=await storageRequest<{resume:ResumeState}>({action:'load',id,current});onLoad(data.resume);setMessage('已加载快照；加载前的内容已备份到数据库。');setError('');await refresh();}catch(e){setError(e instanceof Error?e.message:'加载失败，当前编辑内容未改变。');}finally{setBusy(false);}}
 async function importLocal(){try{const raw=localStorage.getItem('liveresume-v1');const old=raw?JSON.parse(raw):null;const draft=old&&typeof old.source==='string'?{fontSize:13.5,leading:1.4,show:true,iconHeight:14,momentaHeight:9,...old}:null;await mutate({action:'import',snapshots:readSnapshots(),draft},'旧本机数据已导入，重复导入不会新增相同快照。');}catch{setError('本机旧数据无法读取，已保留原数据。');}}
 return <div className="snapshot-panel"><h2>历史快照</h2><p className="snapshot-hint">正文和全部排版设置保存在 PostgreSQL。加载前自动备份当前内容，数据库连接失败时不会覆盖当前编辑。</p>
 <div className="snapshot-actions"><button disabled={busy} onClick={()=>refresh().catch(e=>setError(e.message))}>刷新列表</button><button disabled={busy} onClick={importLocal}>导入旧本机数据</button></div><fieldset disabled={busy} className="snapshot-fieldset"><form className="snapshot-save" onSubmit={e=>{e.preventDefault();save();}}><label htmlFor="snapshot-name">快照名称</label><input id="snapshot-name" maxLength={80} placeholder="例如：小米后端实习版" value={name} onChange={e=>setName(e.target.value)}/><button type="submit" className="export-button">保存当前快照</button></form>
 {error?<p className="snapshot-error" role="alert">{error}</p>:<p className="snapshot-message" role="status">{message}</p>}
 <div className="snapshot-count">已保存 {items.length} 份<span>加载前自动备份当前内容</span></div>
 {items.length===0&&!error&&<div className="snapshot-empty">还没有快照<br/><span>保存一份，随时回到这个版本。</span></div>}
 <div className="snapshot-list">{items.map(item=><article key={item.id} className="snapshot-card" aria-label={`快照：${item.name}`}>
 {editing===item.id?<form className="snapshot-rename" onSubmit={async e=>{e.preventDefault();const title=rename.trim();if(!title){setError('名称不能为空。');return;}if(await mutate({action:'rename',id:item.id,name:title},'已重命名快照'))setEditing(null);}}><input aria-label="新快照名称" autoFocus maxLength={80} value={rename} onChange={e=>setRename(e.target.value)}/><div className="snapshot-actions"><button type="submit">确认重命名</button><button type="button" onClick={()=>setEditing(null)}>取消</button></div></form>:<h3>{item.name}</h3>}
 <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('zh-CN',{hour12:false})}</time><p>{item.resume.source.length.toLocaleString()} 字符 · 字号 {item.resume.fontSize} px · 行距 {item.resume.leading}</p>
 <div className="snapshot-actions"><button type="button" onClick={()=>load(item.id)}>加载</button><button type="button" onClick={()=>{setEditing(item.id);setRename(item.name);}}>重命名</button><button className="snapshot-danger" type="button" onClick={()=>setDeleting(item)}>删除</button></div></article>)}</div>
 </fieldset><AlertDialog open={deleting!==null} onOpenChange={open=>{if(!open)setDeleting(null);}}><AlertDialogContent className="snapshot-dialog"><AlertDialogTitle>删除这份快照？</AlertDialogTitle><AlertDialogDescription>“{deleting?.name}”将被永久删除。当前正在编辑的简历不受影响。</AlertDialogDescription><div className="snapshot-actions"><button onClick={()=>setDeleting(null)}>取消</button><button className="snapshot-danger" disabled={busy} onClick={async()=>{if(deleting&&await mutate({action:'delete',id:deleting.id},'已删除快照'))setDeleting(null);}}>确认删除</button></div>{error&&<p role="alert" className="snapshot-error">{error}</p>}</AlertDialogContent></AlertDialog>
 </div>;
}
