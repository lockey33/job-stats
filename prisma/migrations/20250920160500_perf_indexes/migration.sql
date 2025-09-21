-- Enable useful extensions (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Full-text search expression GIN index matching our query expression
CREATE INDEX IF NOT EXISTS "Job_tsv_idx" ON "Job" USING GIN (
  to_tsvector('simple',
    COALESCE("title", '') || ' ' || COALESCE("companyName", '') || ' ' || COALESCE("city", '') || ' ' ||
    COALESCE("description", '') || ' ' || COALESCE("candidateProfile", '') || ' ' || COALESCE("companyDescription", '')
  )
);

-- Trigram indexes for LIKE %...% patterns (case-insensitive via LOWER(...))
CREATE INDEX IF NOT EXISTS "Job_city_trgm" ON "Job" USING GIN (LOWER("city") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Job_title_trgm" ON "Job" USING GIN (LOWER("title") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Job_company_trgm" ON "Job" USING GIN (LOWER("companyName") gin_trgm_ops);

-- Expression indexes for case-insensitive equality on categorical columns
CREATE INDEX IF NOT EXISTS "Job_region_lower_idx" ON "Job" (LOWER("region"));
CREATE INDEX IF NOT EXISTS "Job_jobSlug_lower_idx" ON "Job" (LOWER("jobSlug"));
CREATE INDEX IF NOT EXISTS "Job_experience_lower_idx" ON "Job" (LOWER("experience"));
CREATE INDEX IF NOT EXISTS "Job_remote_lower_idx" ON "Job" (LOWER("remote"));

-- Speed up common analytics joins with kind predicate
CREATE INDEX IF NOT EXISTS "JobSkill_kind_skillId_idx" ON "JobSkill" ("kind", "skillId");
CREATE INDEX IF NOT EXISTS "JobSkill_kind_jobId_idx" ON "JobSkill" ("kind", "jobId");

-- Useful for LOWER(sk.name) comparisons
CREATE INDEX IF NOT EXISTS "Skill_name_lower_idx" ON "Skill" (LOWER("name"));

