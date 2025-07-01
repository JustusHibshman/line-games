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
    games = "( game_id INT8 PRIMARY KEY, num_players INT, begun BOOL, name VARCHAR(15), pwd VARCHAR(15), timestamp INT8 )"
    specs = "( id SERIAL PRIMARY KEY, game_id INT8 REFERENCES games, spec JSON )"
    players = "( player_id INT8 PRIMARY KEY, game_id INT8 REFERENCES games )"
    seats = "( id SERIAL PRIMARY KEY, game_id INT8 REFERENCES games, seat INT, type INT, claimed BOOL, player_id INT8 REFERENCES players )"
    moves = "( id SERIAL PRIMARY KEY, game_id INT8 REFERENCES games, turn INT, x INT, y INT )"
)

// Create the necessary tables if they are not already present
func init() {
    log.Printf("Ensuring necessary tables are present in database...\n")

    schemas :=    [5]string{ games,   specs,   players,   seats,   moves }
    tableNames := [5]string{"games", "specs", "players", "seats", "moves"}
    var success bool
    for i := 0; i < len(schemas); i++ {
        success = false
        for !success {
            _, lockErr := dbconn.Exec("SELECT pg_advisory_lock(1234);")
            if lockErr != nil {
                log.Printf("Locking attempt error:\n")
                log.Printf(lockErr.Error() + "\n")
                log.Printf("Trying again...\n")
                time.Sleep(1 * time.Second)
                continue
            }

            _, err := dbconn.Exec("CREATE TABLE IF NOT EXISTS " + tableNames[i] + " " + schemas[i] + ";")

            for {
                // Unlocking is more important than locking -- keep trying
                _, lockErr = dbconn.Exec("SELECT pg_advisory_unlock(1234);")
                if lockErr != nil {
                    log.Printf("Unlocking attempt error:\n")
                    log.Printf(lockErr.Error() + "\n")
                    log.Printf("Trying again...\n")
                    time.Sleep(1 * time.Second)
                } else {
                    break
                }
            }

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
