package main

import (
    "encoding/json"
    "html"
    "log"
    "net/http"
)

func basicReplyHandler(w http.ResponseWriter, r *http.Request) {
    jsonStr, err := json.Marshal("Hello " + html.EscapeString(r.URL.Path));
    if err == nil {
        w.Write(jsonStr);
    }
}

func main() {
    http.HandleFunc("/http-call-worked", basicReplyHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
