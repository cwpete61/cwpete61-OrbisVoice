#!/bin/bash
# find_not_null_no_default.sh
docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND is_nullable = 'NO' 
    AND column_default IS NULL 
    AND table_name NOT LIKE '_prisma%';"
