package main
 
import (
    "encoding/json"
    "linegames/backend/internal/dbconn"
    _ "linegames/backend/internal/dbschema"
    "net/http"
    "time"
)
 
func main() {
    var currentTime string
    currentTime = "Now"
    handler := func(w http.ResponseWriter, r *http.Request) {stringPasser(w, r, &currentTime)}

    http.HandleFunc("/time", handler)
    go http.ListenAndServe(":8080", nil)

    for {
        rows, latestErr := dbconn.Query("SELECT CURRENT_TIME;")
        CheckError(latestErr)
        for rows.Next() {
            rows.Scan(&currentTime)
        }
        rows.Close()
        time.Sleep(1 * time.Second)
    }
 
}

func stringPasser(w http.ResponseWriter, r *http.Request, text *string) {
    w.WriteHeader(http.StatusOK)
    marshaled, _ := json.Marshal(*text)
    w.Write(marshaled)
}
 
func CheckError(err error) {
    if err != nil {
        panic(err)
    }
}
