-- CreateEnum
CREATE TYPE "SkillKind" AS ENUM ('HARD', 'SOFT');

-- CreateTable
CREATE TABLE "Job" (
    "id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "job" TEXT,
    "jobSlug" TEXT,
    "slug" TEXT,
    "title" TEXT,
    "companyName" TEXT,
    "city" TEXT,
    "region" TEXT,
    "long" DOUBLE PRECISION,
    "lat" DOUBLE PRECISION,
    "durationMonths" INTEGER,
    "durationYears" INTEGER,
    "remote" TEXT,
    "maxTjm" INTEGER,
    "minTjm" INTEGER,
    "experience" TEXT,
    "description" TEXT,
    "candidateProfile" TEXT,
    "companyDescription" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSkill" (
    "jobId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "kind" "SkillKind" NOT NULL,

    CONSTRAINT "JobSkill_pkey" PRIMARY KEY ("jobId","skillId","kind")
);

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_city_idx" ON "Job"("city");

-- CreateIndex
CREATE INDEX "Job_region_idx" ON "Job"("region");

-- CreateIndex
CREATE INDEX "Job_jobSlug_idx" ON "Job"("jobSlug");

-- CreateIndex
CREATE INDEX "Job_experience_idx" ON "Job"("experience");

-- CreateIndex
CREATE INDEX "Job_remote_idx" ON "Job"("remote");

-- CreateIndex
CREATE INDEX "Job_minTjm_idx" ON "Job"("minTjm");

-- CreateIndex
CREATE INDEX "Job_maxTjm_idx" ON "Job"("maxTjm");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "JobSkill_skillId_idx" ON "JobSkill"("skillId");

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
