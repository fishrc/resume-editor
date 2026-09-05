'use client';

import {useEffect,useState} from 'react';
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
 const [items,setItems]=useState<Snapshot[]>([]),[name,setName]=useState(''),[editing,setEditing]=useState<string|null>(null),[rename,setRename]=useState(''),[deleting,setDeleting]=useState<Snapshot|null>(null),[message,setMessage]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const refresh=()=>{try{setItems(readSnapshots());setError('');}catch{setError('无法读取历史快照，原数据已保留，请勿清理浏览器数据。');}};refresh();const listener=(event:StorageEvent)=>{if(event.key===KEY||event.key===null)refresh();};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener);},[]);
 function mutate(update:(items:Snapshot[])=>Snapshot[],success:string){
  try{const next=update(readSnapshots());localStorage.setItem(KEY,JSON.stringify(next));setItems(next);setError('');setMessage(success);return true;}
  catch(e){setError(e instanceof Error&&e.message==='快照不存在，请刷新列表。'?e.message:'操作未完成：存储不可用、空间不足或快照数据损坏。原快照和当前编辑内容未改变。');return false;}
 }
 function save(){const title=name.trim()||`简历 · ${timestamp()}`;if(mutate(items=>[createSnapshot(title,current),...items],`已保存“${title}”`))setName('');}
 function load(id:string){let target:Snapshot|undefined;const ok=mutate(items=>{target=items.find(s=>s.id===id);if(!target)throw new Error('快照不存在，请刷新列表。');return JSON.stringify(target.resume)===JSON.stringify(current)?items:[createSnapshot(`加载前自动备份 · ${timestamp()}`,current),...items];},'已加载快照；加载前的编辑内容已保留。');if(ok&&target)onLoad({...target.resume});}
 return <div className="snapshot-panel"><h2>历史快照</h2><p className="snapshot-hint">保存正文和全部排版设置。快照仅存于当前浏览器，本地版和线上版不互通；清除网站数据会移除快照。</p>
 <form className="snapshot-save" onSubmit={e=>{e.preventDefault();save();}}><label htmlFor="snapshot-name">快照名称</label><input id="snapshot-name" maxLength={80} placeholder="例如：小米后端实习版" value={name} onChange={e=>setName(e.target.value)}/><button type="submit" className="export-button">保存当前快照</button></form>
 {error?<p className="snapshot-error" role="alert">{error}</p>:<p className="snapshot-message" role="status">{message}</p>}
 <div className="snapshot-count">已保存 {items.length} 份<span>加载前自动备份当前内容</span></div>
 {items.length===0&&!error&&<div className="snapshot-empty">还没有快照<br/><span>保存一份，随时回到这个版本。</span></div>}
 <div className="snapshot-list">{items.map(item=><article key={item.id} className="snapshot-card" aria-label={`快照：${item.name}`}>
 {editing===item.id?<form className="snapshot-rename" onSubmit={e=>{e.preventDefault();const title=rename.trim();if(!title){setError('名称不能为空。');return;}if(mutate(items=>{if(!items.some(s=>s.id===item.id))throw new Error('快照不存在，请刷新列表。');return items.map(s=>s.id===item.id?{...s,name:title}:s);},'已重命名快照'))setEditing(null);}}><input aria-label="新快照名称" autoFocus maxLength={80} value={rename} onChange={e=>setRename(e.target.value)}/><div className="snapshot-actions"><button type="submit">确认重命名</button><button type="button" onClick={()=>setEditing(null)}>取消</button></div></form>:<h3>{item.name}</h3>}
 <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('zh-CN',{hour12:false})}</time><p>{item.resume.source.length.toLocaleString()} 字符 · 字号 {item.resume.fontSize} px · 行距 {item.resume.leading}</p>
 <div className="snapshot-actions"><button type="button" onClick={()=>load(item.id)}>加载</button><button type="button" onClick={()=>{setEditing(item.id);setRename(item.name);}}>重命名</button><button className="snapshot-danger" type="button" onClick={()=>setDeleting(item)}>删除</button></div></article>)}</div>
 <AlertDialog open={deleting!==null} onOpenChange={open=>{if(!open)setDeleting(null);}}><AlertDialogContent className="snapshot-dialog"><AlertDialogTitle>删除这份快照？</AlertDialogTitle><AlertDialogDescription>“{deleting?.name}”将被永久删除。当前正在编辑的简历不受影响。</AlertDialogDescription><div className="snapshot-actions"><button onClick={()=>setDeleting(null)}>取消</button><button className="snapshot-danger" onClick={()=>{if(deleting&&mutate(items=>items.filter(s=>s.id!==deleting.id),'已删除快照'))setDeleting(null);}}>确认删除</button></div>{error&&<p role="alert" className="snapshot-error">{error}</p>}</AlertDialogContent></AlertDialog>
 </div>;
}
