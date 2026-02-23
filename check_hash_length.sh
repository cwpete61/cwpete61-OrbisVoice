docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT LENGTH(\"passwordHash\"), \"passwordHash\" FROM \"User\" WHERE email = 'admin@orbisvoice.app';"
