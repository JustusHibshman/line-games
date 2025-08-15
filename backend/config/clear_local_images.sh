#!/bin/bash

minikube delete
docker rm -vf $(docker ps -aq)
docker rmi -f $(docker images -aq)
minikube start
minikube stop
