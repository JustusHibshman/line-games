#!/bin/bash

./create_secrets_minikube.sh

# Internal and external communication: ports and host/service names
minikube kubectl -- apply -f database-service.yaml
minikube kubectl -- apply -f setup-service.yaml

# Create volume claims
minikube kubectl -- apply -f db-volume-claim.yaml

# Launch the deployments
minikube kubectl -- apply -f database-deployment.yaml
minikube kubectl -- apply -f setup-deployment.yaml
