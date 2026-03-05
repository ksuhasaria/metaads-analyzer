-- Add status field to campaign and ad insights for filtering by effective_status
ALTER TABLE "meta_campaign_insights" ADD COLUMN IF NOT EXISTS "status" TEXT;
CREATE INDEX IF NOT EXISTS "meta_campaign_insights_status_idx" ON "meta_campaign_insights"("status");

ALTER TABLE "meta_ad_insights" ADD COLUMN IF NOT EXISTS "status" TEXT;
CREATE INDEX IF NOT EXISTS "meta_ad_insights_status_idx" ON "meta_ad_insights"("status");
