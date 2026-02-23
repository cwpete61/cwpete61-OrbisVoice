docker exec orbisvoice-postgres-prod psql -U postgres -d orbisvoice -c "SELECT email, username, \"passwordHash\" FROM \"User\" WHERE email = 'admin@orbisvoice.app';"
