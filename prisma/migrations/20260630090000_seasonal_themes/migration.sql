CREATE TABLE IF NOT EXISTS "seasonal_themes" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seasonal_themes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "seasonal_themes_is_active_starts_at_ends_at_idx" ON "seasonal_themes"("is_active", "starts_at", "ends_at");
