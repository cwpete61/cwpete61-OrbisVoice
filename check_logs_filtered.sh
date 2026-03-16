#!/bin/bash
# check_logs_filtered.sh
docker logs orbisvoice-api-prod 2>&1 | grep -iE "error|exception|fail" -C 5 | tail -n 100
