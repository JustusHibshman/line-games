package dbschema

import (
    "linegames/backend/internal/dbconn"
    "log"
    "time"
)

// Table schemas
const (
    MaxStrLen = 15  // Max length of varchars
    // The value of `created` is supposed to be unix time in seconds
    games = "( game_id INT8 PRIMARY KEY, host_id INT8, num_players INT, begun BOOL, name VARCHAR(15), pwd VARCHAR(15), created INT8 )"
    players = "( player_id INT8 PRIMARY KEY, game_id INT8 REFERENCES games )"
    seats = "( id SERIAL PRIMARY KEY, game_id INT8 REFERENCES games, seat INT, player_id INT8 REFERENCES players )"
    moves = "( id SERIAL PRIMARY KEY, game_id INT8 REFERENCES games, turn INT, x INT, y INT )"
)

// Create the necessary tables if they are not already present
func init() {
    log.Printf("Ensuring necessary tables are present in database...\n")

    schemas :=    [4]string{ games,   players,   seats,   moves }
    tableNames := [4]string{"games", "players", "seats", "moves"}
    var success bool
    for i := 0; i < 4; i++ {
        success = false
        for !success {
            _, err := dbconn.Exec("CREATE TABLE IF NOT EXISTS " + tableNames[i] + " " + schemas[i] + ";")
            if err != nil {
                log.Printf("Attempt failed for table " + tableNames[i] + ":\n")
                log.Printf(err.Error() + "\n")
                log.Printf("Trying again...\n")
                time.Sleep(1 * time.Second)
            } else {
                success = true
            }
        }
    }
    log.Printf("...database tables are ready.\n")
}
