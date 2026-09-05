# LiveResume 本地数据库配置

本地服务通过服务端 API 连接 PostgreSQL；数据库账号、密码和连接地址只存在于 `.env.local`，不会进入浏览器代码。

1. 复制 `.env.example` 为 `.env.local`，填写 `DATABASE_URL`、`PGUSER`、`PGPASSWORD`。`DATABASE_URL` 可以只写主机和数据库，账号密码仍由单独环境变量提供，例如：

   ```text
   DATABASE_URL=postgresql://db.example.com:5432/liveresume
   PGUSER=liveresume_user
   PGPASSWORD=your-password
   PGSSLMODE=verify-full
   RESUME_SCHEMA=liveresume
   ```

2. 运行 `npm run db:migrate` 创建 `liveresume_drafts` 和 `liveresume_snapshots` 表。

3. 重启 `npm run dev`，打开 `http://localhost:3000/`。

草稿会自动保存，历史快照支持保存、加载、重命名和删除。数据库不可用时，页面会提示连接错误，并继续保留浏览器里的应急副本；不会把数据库密码发送给客户端。

`PGSSLMODE=verify-full` 默认校验证书。使用自签名 CA 时设置 `PGSSLROOTCERT` 为本机 PEM 文件的绝对路径；只有明确不需要 TLS 时才使用 `PGSSLMODE=disable`。
