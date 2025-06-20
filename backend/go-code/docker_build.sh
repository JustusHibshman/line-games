#!/bin/bash

docker login --username justushibshman
docker build --target db-test -t database_test:0.0.18 .
docker tag      database_test:0.0.18 justushibshman/jih_personal:database_test-0.0.18
docker push                          justushibshman/jih_personal:database_test-0.0.18

docker build --target lobby-server -t lobby_server:0.0.2 .
docker tag      lobby_server:0.0.2 justushibshman/jih_personal:lobby_server-0.0.2
docker push                        justushibshman/jih_personal:lobby_server-0.0.2

docker build --target data-cleanup -t data_cleanup:0.0.2 .
docker tag      data_cleanup:0.0.2 justushibshman/jih_personal:data_cleanup-0.0.2
docker push                        justushibshman/jih_personal:data_cleanup-0.0.2
