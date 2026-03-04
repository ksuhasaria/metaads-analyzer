-- CreateTable
CREATE TABLE "meta_campaign_insights" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "cpm" DOUBLE PRECISION NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL,
    "roas" DOUBLE PRECISION NOT NULL,
    "purchases" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_campaign_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_adset_insights" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "adSetId" TEXT NOT NULL,
    "adSetName" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "age" TEXT,
    "gender" TEXT,
    "placement" TEXT,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL,
    "roas" DOUBLE PRECISION NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_adset_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_ad_insights" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "adId" TEXT NOT NULL,
    "adName" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL,
    "hookRate" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION NOT NULL,
    "creativeScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_ad_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_orders" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopify_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "dateRange" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meta_campaign_insights_date_idx" ON "meta_campaign_insights"("date");

-- CreateIndex
CREATE INDEX "meta_campaign_insights_campaignId_idx" ON "meta_campaign_insights"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "meta_campaign_insights_date_campaignId_key" ON "meta_campaign_insights"("date", "campaignId");

-- CreateIndex
CREATE INDEX "meta_adset_insights_date_idx" ON "meta_adset_insights"("date");

-- CreateIndex
CREATE INDEX "meta_adset_insights_campaignId_idx" ON "meta_adset_insights"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "meta_adset_insights_date_adSetId_age_gender_placement_key" ON "meta_adset_insights"("date", "adSetId", "age", "gender", "placement");

-- CreateIndex
CREATE INDEX "meta_ad_insights_date_idx" ON "meta_ad_insights"("date");

-- CreateIndex
CREATE INDEX "meta_ad_insights_campaignId_idx" ON "meta_ad_insights"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "meta_ad_insights_date_adId_key" ON "meta_ad_insights"("date", "adId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_orders_orderId_key" ON "shopify_orders"("orderId");

-- CreateIndex
CREATE INDEX "shopify_orders_utmSource_idx" ON "shopify_orders"("utmSource");

-- CreateIndex
CREATE INDEX "shopify_orders_createdAt_idx" ON "shopify_orders"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
