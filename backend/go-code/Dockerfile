FROM golang:1.24.3-alpine3.22

COPY . .

RUN cd cmd/database-test && go build

CMD cmd/database-test/database-test
