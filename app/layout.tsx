import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'LiveResume · 在线简历编辑器',description:'在线编辑简历，实时 A4 预览，支持矢量图标与 PDF 导出。'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>;}
