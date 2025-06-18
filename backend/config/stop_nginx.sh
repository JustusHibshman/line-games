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

# Delete the ingress controller
kctl delete namespace ingress-nginx
