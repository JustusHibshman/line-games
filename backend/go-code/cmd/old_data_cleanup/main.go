package main

// Import the exported project types without a prefix
import . "linegames/backend/internal/types"

import (
    "linegames/backend/internal/database"
    "log"
    "math/rand"
    "time"
)

const (
    // Lobby games timeout after 30 minutes (measured in seconds)
    lobbyTimeout = 60 * 30 
    // Games being played timeout after 24 hours (measured in seconds)
    playTimeout = 60 * 60 * 24

    avgPause = 60  // One minute
)

func main() {
    var timeouts []Duration = []Duration{lobbyTimeout, playTimeout}
    var begun []bool =        []bool    {false,        true       }
    var title []string =      []string  {"pending",    "active"   }
    for {
        time.Sleep(time.Second * (avgPause + (-1) + time.Duration(rand.Int31n(3))))
        for i := 0; i < 2; i++ {
            games, err := database.GetOldGames(timeouts[i], begun[i])
            if err != nil {
                log.Printf("Error getting old %s games: %s", title[i], err.Error())
            } else {
                for j := 0; j < len(games); j++ {
                    err = database.DeleteAllGameData(games[i].ID)
                    if err != nil {
                        log.Printf("Error deleting old %s game: %s", title[i], err.Error())
                    }
                }
            }
        }
    }
}
