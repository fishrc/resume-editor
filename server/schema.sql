CREATE TABLE IF NOT EXISTS liveresume_drafts (
 workspace text PRIMARY KEY,
 resume jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS liveresume_snapshots (
 workspace text NOT NULL,
 id uuid NOT NULL,
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
 resume jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (workspace,id)
);
CREATE INDEX IF NOT EXISTS liveresume_snapshots_created ON liveresume_snapshots(workspace,created_at DESC);
