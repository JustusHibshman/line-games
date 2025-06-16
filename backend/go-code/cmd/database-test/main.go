package main
 
import (
    "database/sql"
    "encoding/json"
    "fmt"
    _ "github.com/lib/pq"
    "net/http"
    "os"
    "time"
)

const (
    port     = 5432
    user     = "postgres"
    dbname   = "postgres"
)
 
func main() {
    time.Sleep(10 * time.Second)

    host := os.Getenv("DATABASE_HOST")
    password_file := os.Getenv("POSTGRES_PASSWORD_FILE")
    password, err := os.ReadFile(password_file)
    CheckError(err)
    passwordString := string(password)

    // connection string
    psqlconn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
                            host, port, user, passwordString, dbname)

    // open database
    db, err := sql.Open("postgres", psqlconn)
    CheckError(err)

    // close database (eventually)
    defer db.Close()
 
    // check db
    err = db.Ping()
    CheckError(err)

    var currentTime string
    currentTime = "Now"
    handler := func(w http.ResponseWriter, r *http.Request) {stringPasser(w, r, &currentTime)}

    http.HandleFunc("/time", handler)
    go http.ListenAndServe(":8080", nil)

    for {
        rows, latestErr := db.Query("SELECT CURRENT_TIME;")
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
