#!/bin/bash

# V5 Migrations Application Script
# Applies migrations 014-020 to the remote Supabase database

SUPABASE_URL="https://yqetqeqxlimnbxwwmiyz.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZXRxZXF4bGltbmJ4d3dtaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzMjA4MiwiZXhwIjoyMDgwMDA4MDgyfQ.-qJM4mOB0k9fb8rEvuRsPrBYpmp9dGCd15buU3kHr58"

PROJECT_DIR="/Users/pavlenkoall/Desktop/SAAS/AudienceAuditAnalisys"
MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"

echo "Applying V5 migrations to Supabase..."

# Migration files in order
migrations=(
  "014_add_awareness_reasoning.sql"
  "015_fix_fk_constraints_and_indexes.sql"
  "016_channel_strategy.sql"
  "017_competitive_intelligence.sql"
  "018_pricing_psychology.sql"
  "019_trust_framework.sql"
  "020_jtbd_context.sql"
)

for migration in "${migrations[@]}"; do
  echo ""
  echo "Applying: $migration"

  SQL_FILE="$MIGRATIONS_DIR/$migration"

  if [ ! -f "$SQL_FILE" ]; then
    echo "ERROR: Migration file not found: $SQL_FILE"
    exit 1
  fi

  # Read SQL file and execute via Supabase SQL API
  SQL_CONTENT=$(cat "$SQL_FILE")

  response=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(jq -Rs . <<< "$SQL_CONTENT")}")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ] || [ "$http_code" -eq 204 ]; then
    echo "  ✓ SUCCESS"
  else
    echo "  ✗ FAILED (HTTP $http_code)"
    echo "  Response: $body"
  fi
done

echo ""
echo "Migration application complete!"
