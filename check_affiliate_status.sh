#!/bin/bash
# check_affiliate_status.sh
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'AffiliateStatus';"
