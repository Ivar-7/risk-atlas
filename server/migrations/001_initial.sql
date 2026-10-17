CREATE TABLE IF NOT EXISTS model_runs (
    run_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    result JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS model_runs_created_at_idx ON model_runs(created_at DESC);
