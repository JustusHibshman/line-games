package database

// Import the exported project types without a prefix
import . "linegames/backend/internal/types"
import (
    "fmt"
    "linegames/backend/internal/dbconn"
    "linegames/backend/internal/dbschema"
    "time"
)

func GetTimeString() (string, error) {
    var timeString string
    rows, err := dbconn.Query("SELECT CURRENT_TIME;")
    if err != nil {
        return "", err
    }
    for rows.Next() {
        rows.Scan(&timeString)
    }
    rows.Close()
    return timeString, nil
}

func CreateGame(game Game) error {
    if len(game.Name) > dbschema.MaxStrLen {
        return fmt.Errorf("Game name %s longer than max of %d characters", game.Name, dbschema.MaxStrLen)
    }
    if len(game.Password) > dbschema.MaxStrLen {
        return fmt.Errorf("Game password %s longer than max of %d characters", game.Password, dbschema.MaxStrLen)
    }

    // game_id, host_id, num_players, begun, name, password, time created
    command := fmt.Sprintf("INSERT INTO games VALUES (%d, %d, %d, %t, '%s', '%s', %d);",
                            game.ID,
                            game.HostID,
                            game.NumPlayers,
                            false,
                            game.Name,
                            game.Password,
                            time.Now().Unix())
    _, err := dbconn.Exec(command)
    return err
}

func GetAllNonBegunGames() ([]Game, error) {
    query := "SELECT * FROM games where begun = FALSE;"
    rows, err := dbconn.Query(query)
    if err != nil {
        return nil, err
    }
    result := make([]Game, 0)
    for rows.Next() {  // While another row remains
        var nextGame Game = Game{}
        var created int64
        rows.Scan(&(nextGame.ID), &(nextGame.HostID), &(nextGame.NumPlayers),
                  &(nextGame.Begun), &(nextGame.Name), &(nextGame.Password),
                  &created)
        result = append(result, nextGame)
    }
    return result, nil
}
