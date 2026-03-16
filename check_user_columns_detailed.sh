#!/bin/bash
# check_user_columns_detailed.sh
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'User' ORDER BY column_name;"
