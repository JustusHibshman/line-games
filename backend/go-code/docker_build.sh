#!/bin/bash

docker build --target db-test -t database_test:0.0.17 .
docker login --username justushibshman
docker tag      database_test:0.0.17 justushibshman/jih_personal:database_test-0.0.17
docker push                          justushibshman/jih_personal:database_test-0.0.17
