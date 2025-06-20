FROM golang:1.24.3-alpine3.22 AS db-test

COPY . .

RUN cd cmd/database_test && go build

CMD cmd/database_test/database_test
