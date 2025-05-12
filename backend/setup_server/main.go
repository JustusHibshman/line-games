package main

import (
    "fmt"
    "html"
    "log"
    "net/http"
)

func basicReplyHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello %q", html.EscapeString(r.URL.Path));
}

func main() {
    http.HandleFunc("/http-call-worked", basicReplyHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
