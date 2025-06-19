package main
 
// Import the exported project types without a prefix
import . "linegames/backend/internal/types"
import (
    "encoding/json"
    "linegames/backend/internal/database"
    "math/rand"
    "net/http"
    "time"
)
 
func main() {
    var currentTime *string
    currentTime = new(string)
    *currentTime = "Now"
    handler := func(w http.ResponseWriter, r *http.Request) {stringPasser(w, r, currentTime)}

    http.HandleFunc("/time", handler)
    go http.ListenAndServe(":8080", nil)

    var g1 Game = Game{ID: 1, Name: "Hi there", Password: "wat"}
    var g2 Game = Game{ID: 2, Name: "long form", Password: "way too long to be stored in the database"}
    var g3 Game = Game{ID: 3, Name: "Successful test", Password: "telephone"}
    
    var s = ""
    e1 := database.CreateGame(g1)
    if e1 != nil {
        s += " " + e1.Error()
    }
    e2 := database.CreateGame(g2)
    if e2 != nil {
        s += " " + e2.Error()
    }
    e3 := database.CreateGame(g3)
    if e3 != nil {
        s += " " + e3.Error()
    }

    for {
        var s2 string
        games, err := database.GetAllNonBegunGames()
        CheckError(err)
        if len(games) > 0 {
            s2 = games[rand.Int31n(int32(len(games)))].Name
        }
        *currentTime = s + " \n\n\n " + s2
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
