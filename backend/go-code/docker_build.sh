#!/bin/bash

# Build this once to download the alpine image and the postgres golang library
# docker build --target dependencies -t lg_backend_dependencies:1.0 .

docker login --username justushibshman

docker build --target setup-server -t setup_server:0.2.4 .
docker tag      setup_server:0.2.4 justushibshman/jih_personal:setup_server-0.2.4
minikube image load justushibshman/jih_personal:setup_server-0.2.4
docker push                        justushibshman/jih_personal:setup_server-0.2.4

docker build --target lobby-server -t lobby_server:0.1.4 .
docker tag      lobby_server:0.1.4 justushibshman/jih_personal:lobby_server-0.1.4
minikube image load justushibshman/jih_personal:lobby_server-0.1.4
docker push                        justushibshman/jih_personal:lobby_server-0.1.4

docker build --target data-cleanup -t data_cleanup:0.1.4 .
docker tag      data_cleanup:0.1.4 justushibshman/jih_personal:data_cleanup-0.1.4
minikube image load justushibshman/jih_personal:data_cleanup-0.1.4
docker push                        justushibshman/jih_personal:data_cleanup-0.1.4

docker build --target gameplay-server -t gameplay_server:0.1.6 .
docker tag      gameplay_server:0.1.6 justushibshman/jih_personal:gameplay_server-0.1.6
minikube image load justushibshman/jih_personal:gameplay_server-0.1.6
docker push                        justushibshman/jih_personal:gameplay_server-0.1.6
