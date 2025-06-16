#!/bin/bash

docker build -t database-test:0.0.1 .
docker login --username justushibshman
docker tag      database-test:0.0.1 justushibshman/jih_personal:database-test-0.0.1
docker push                         justushibshman/jih_personal:database-test-0.0.1
