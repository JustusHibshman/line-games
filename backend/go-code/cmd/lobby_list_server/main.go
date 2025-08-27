package main

// Import the exported project types without a prefix
import . "linegames/backend/internal/types"

import (
    "encoding/json"
    "linegames/backend/internal/database"
    "log"
    "math/rand"
    "net/http"
    "strconv"
    "time"
)

const (
    avgRefreshRate = 5  // Update every 5 seconds on average
)

var nextRefresh Time
var preMarshalled []byte

type GamesList struct {
    Names []string `json:"names"`
    Ids   []ID     `json:"gameIDs"`
}

func init() {
    nextRefresh = 0
}

// Expects a GET request
func gamesListHandler(w http.ResponseWriter, r *http.Request) {
    var now Time = Time(time.Now().Unix())
    if now > nextRefresh {
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

        // Wait some amount between (aRR - 1) and (aRR + 1) seconds before
        //  refreshing again
        // Helps reduce the chance that multiple lobby servers query the whole
        //  database at the same time.
        nextRefresh = now + avgRefreshRate + (-1) + Time(rand.Int31n(3))
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    w.Header().Set("Cache-Control", "max-age=" + strconv.Itoa(avgRefreshRate)) // set cache life
    w.Write(preMarshalled)
}

func main() {
    // Wait a random time between 0 and aRR seconds.
    //
    // Helps reduce the chance that multiple lobby servers query the whole
    //  database at the same time.
    time.Sleep((time.Second * avgRefreshRate * time.Duration(rand.Int31n(1001))) / 1000)

    http.HandleFunc("/games-list", gamesListHandler)
    log.Fatal(http.ListenAndServe(":1111", nil))
}
