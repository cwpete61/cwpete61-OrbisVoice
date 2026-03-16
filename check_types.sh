#!/bin/bash
# check_types.sh
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT n.nspname as schema, t.typname as type FROM pg_type t LEFT JOIN pg_namespace n ON n.oid = t.typnamespace WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_class c WHERE c.oid = t.typrelid)) AND NOT EXISTS(SELECT 1 FROM pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid) AND n.nspname NOT IN ('pg_catalog', 'information_schema') AND t.typname NOT LIKE '\_%';"
