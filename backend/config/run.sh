#!/bin/bash

./create_secrets.sh

# Internal and external communication: ports and host/service names
kubectl apply -f database-service.yaml
kubectl apply -f setup-service.yaml

# Create volume claims
kubectl apply -f db-volume-claim.yaml

# Launch the deployments
kubectl apply -f database-deployment.yaml
kubectl apply -f setup-deployment.yaml
