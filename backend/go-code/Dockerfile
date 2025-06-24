FROM golang:1.24.3-alpine3.22 AS core

COPY . .


FROM core AS db-test

RUN cd cmd/database_test && go build

CMD cmd/database_test/database_test


FROM core AS setup-server

RUN cd cmd/setup_server && go build

CMD cmd/setup_server/setup_server


FROM core AS lobby-server

RUN cd cmd/lobby_list_server && go build

CMD cmd/lobby_list_server/lobby_list_server


FROM core AS data-cleanup

RUN cd cmd/old_data_cleanup && go build

CMD cmd/old_data_cleanup/old_data_cleanup
