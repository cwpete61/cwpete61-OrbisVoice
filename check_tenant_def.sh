#!/bin/bash
# check_tenant_def.sh
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "
SELECT 
    column_name, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'Tenant' 
    AND column_name = 'updatedAt';"
