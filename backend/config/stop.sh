#!/bin/bash

# Either pass minikube as an argument or pass nothing
if [ "$1" = "minikube" ]; then
    kctl() {
        minikube kubectl -- $@
    }
else
    kctl() {
        kubectl $@
    }
fi

# Stop the deployments
kctl delete deployment --all

# Remove the services
kctl delete service setup-service
kctl delete service database-service

# Delete the database volume claim
kctl delete pvc --all

# Delete the secrets
kctl delete secret --all
