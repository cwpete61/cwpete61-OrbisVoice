#!/bin/bash
# find_signup_errors.sh
docker logs orbisvoice-api-prod 2>&1 | grep -i "Signup error" -A 20
docker logs orbisvoice-api-prod 2>&1 | grep -i "Failed to apply" -A 20
