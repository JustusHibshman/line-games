#!/bin/bash

# Either pass minikube as an argument or pass nothing
if [ "$1" = "minikube" ]; then
    minikube addons enable ingress
    kctl() {
        minikube kubectl -- $@
    }
else
    kctl() {
        ./do_kubectl.sh $@
    }
fi

kctl apply -f nginx/deploy-v1.12.3.yaml
