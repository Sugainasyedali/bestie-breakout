-- Preserve all existing level IDs, attempts and accumulated progress.
ALTER TABLE bestie.level_attempts ADD COLUMN IF NOT EXISTS content_version int NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS bestie.game_level_versions (
 level_id int NOT NULL REFERENCES bestie.game_levels(id),
 content_version int NOT NULL,
 title text NOT NULL,
 level_config jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(level_id,content_version)
);
