FROM golang:1.24.3-alpine3.22 AS dependencies

COPY ./go.mod ./go.mod
COPY ./go.sum ./go.sum

RUN go get github.com/lib/pq@v1.10.9


FROM lg_backend_dependencies:1.0 AS core

COPY ./internal ./internal


FROM core AS db-test

COPY ./cmd/database_test/main.go ./cmd/database_test/main.go
RUN cd cmd/database_test && go build

CMD ["cmd/database_test/database_test"]


FROM core AS setup-server

COPY ./cmd/setup_server/main.go ./cmd/setup_server/main.go
RUN cd cmd/setup_server && go build

CMD ["cmd/setup_server/setup_server"]


FROM core AS lobby-server

COPY ./cmd/lobby_list_server/main.go ./cmd/lobby_list_server/main.go
RUN cd cmd/lobby_list_server && go build

CMD ["cmd/lobby_list_server/lobby_list_server"]


FROM core AS data-cleanup

COPY ./cmd/old_data_cleanup/main.go ./cmd/old_data_cleanup/main.go
RUN cd cmd/old_data_cleanup && go build

CMD ["cmd/old_data_cleanup/old_data_cleanup"]
