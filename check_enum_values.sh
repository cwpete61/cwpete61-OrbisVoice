#!/bin/bash
# check_enum_values.sh
echo "--- UserRole ---"
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'UserRole';"

echo "--- CommissionLevel ---"
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'CommissionLevel';"
