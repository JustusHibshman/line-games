#!/bin/bash

# Either pass minikube as an argument or pass nothing
if [ "$1" = "minikube" ]; then
    kctl() {
        minikube kubectl -- $@
    }
else
    kctl() {
        ./do_kubectl.sh $@
    }
fi

# Login, create the docker secret, then logout
docker login --username justushibshman
kctl create secret generic docker-credentials \
    --from-file=.dockerconfigjson=/home/user/.docker/config.json \
    --type=kubernetes.io/dockerconfigjson
docker logout

# Generate random 10-character database password, save it in a secret, then
#   delete the file.
mkdir -p secrets
tr -dc A-Za-z0-9 </dev/urandom | head -c 10 > secrets/postgres-password.txt
kctl create secret generic db-password \
    --from-file=secrets/postgres-password.txt
rm secrets/postgres-password.txt

# Internal and external communication: ports and host/service names
kctl apply -f database-service.yaml
kctl apply -f setup-service.yaml

# Create volume claims
kctl apply -f db-volume-claim.yaml

# Launch the deployments
kctl apply -f database-deployment.yaml
kctl apply -f setup-deployment.yaml
