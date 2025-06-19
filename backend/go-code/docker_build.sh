#!/bin/bash

docker build --target db-test -t database-test:0.0.16 .
docker login --username justushibshman
docker tag      database-test:0.0.16 justushibshman/jih_personal:database-test-0.0.16
docker push                          justushibshman/jih_personal:database-test-0.0.16
