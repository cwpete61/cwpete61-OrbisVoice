#!/bin/bash
# check_platform_settings.sh
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'PlatformSettings';"
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT * FROM \"PlatformSettings\" WHERE id = 'global';"
