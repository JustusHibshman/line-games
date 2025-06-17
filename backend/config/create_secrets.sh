#!/bin/bash

# Login in case we have not done so already
docker login --username justushibshman
kubectl create secret generic docker-credentials \
    --from-file=.dockerconfigjson=/home/user/.docker/config.json \
    --type=kubernetes.io/dockerconfigjson

kubectl create secret generic db-password \
    --from-file=secrets/postgres-password.txt
