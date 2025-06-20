package main

// Import the exported project types without a prefix
import . "linegames/backend/internal/types"

import (
    "encoding/json"
    "linegames/backend/internal/database"
    "log"
    "net/http"
    "time"
)

const (
    refreshRate = 5  // Update every 5 seconds
)

var lastUpdated Time
var preMarshalled []byte

type GamesList struct {
    Names []string `json:"names"`
    Ids   []ID     `json:"ids"`
}

func init() {
    lastUpdated = 0
}

func gamesListHandler(w http.ResponseWriter, r *http.Request) {
    var now Time = Time(time.Now().Unix())
    if lastUpdated == 0 || now - Time(refreshRate) > lastUpdated {
        // Time to update
        lobbyGames, err := database.GetNonBegunGames()
        if err != nil {
            w.WriteHeader(http.StatusInternalServerError)
            return
        }

        var gl GamesList
        gl.Names = make([]string, len(lobbyGames))
        gl.Ids =   make([]ID, len(lobbyGames))
        for i := 0; i < len(lobbyGames); i++ {
            gl.Names[i] = lobbyGames[i].Name
            gl.Ids[i] = lobbyGames[i].ID
        }
        preMarshalled, _ = json.Marshal(gl)

        lastUpdated = now
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    w.Write(preMarshalled)
}

func main() {
    http.HandleFunc("/games-list", gamesListHandler)
    log.Fatal(http.ListenAndServe(":1111", nil))
}
