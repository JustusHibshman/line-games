package database

// Import the exported project types without a prefix
import . "linegames/backend/internal/types"
import (
    "encoding/json"
    "fmt"
    "linegames/backend/internal/dbconn"
    "linegames/backend/internal/dbschema"
    "database/sql"
    "time"
)

// TODO: Remove the possibility of a SQL injection

func GetTime() (string, bool, error) {
    return singletonQuery[string]("SELECT CURRENT_TIME;", stringScanner)
}

func ValidLogin(gameID ID, password string) (bool, error) {
    queryStr := fmt.Sprintf("SELECT * FROM games WHERE game_id = %d AND password = %s;")
    _, found, err := singletonQuery[Game](queryStr, gameScanner)
    return found, err
}

func GetNonBegunGames() ([]Game, error) {
    return query[Game]("SELECT * FROM games WHERE begun = FALSE;", gameScanner)
}

func SetBegun(gameID ID) error {
    command := fmt.Sprintf("UPDATE games SET begun = true WHERE game_id = %d;", gameID)
    _, err := dbconn.Exec(command)
    return err
}

// Returns true if this query caused `claimed` to be set to true
func ClaimSeat(gameID ID, seat int) (bool, error) {
    command := fmt.Sprintf("UPDATE seats SET claimed = true WHERE game_id = %d AND seat = %d;", gameID, seat)
    result, err := dbconn.Exec(command)
    if err != nil {
        return false, err
    }
    ra, err2 := result.RowsAffected()
    return ra > 0, err2
}

func RefreshGameTimestamp(gameID ID) error {
    command := fmt.Sprintf("UPDATE games SET timestamp = %d WHERE game_id = %d;",
                            time.Now().Unix(), gameID)
    _, err := dbconn.Exec(command)
    return err
}

func DeleteAllGameData(gameID ID) error {
    // Delete in this order so that no REFERENCES relationships are broken
    errors := make([]error, 0)
    err := deleteFn("seats",  "game_id", gameID)
    if err != nil {
        errors = append(errors, err)
    }
    err = deleteFn("moves",   "game_id", gameID)
    if err != nil {
        errors = append(errors, err)
    }
    err = deleteFn("players", "game_id", gameID)
    if err != nil {
        errors = append(errors, err)
    }
    err = deleteFn("specs",   "game_id", gameID)
    if err != nil {
        errors = append(errors, err)
    }
    err = deleteFn("games",  "game_id", gameID)
    if err != nil {
        errors = append(errors, err)
    }
    if len(errors) == 0 {
        return nil
    }
    errString := errors[0].Error()
    for i := 1; i < len(errors); i++ {
        errString = errString + " | " + errors[i].Error()
    }
    return fmt.Errorf(errString)
}

// Get games that have existed for duration `d` or longer
func GetOldGames(d Duration, begun bool) ([]Game, error) {
    var now Time = Time(time.Now().Unix())
    then := now - Time(d)
    queryStr := fmt.Sprintf("SELECT * FROM games WHERE timestamp <= %d AND begun = %t;",
                            then, begun)
    return query[Game](queryStr, gameScanner)
}

func GetGame(gameID ID) (Game, bool, error) {
    queryStr := fmt.Sprintf("SELECT * FROM games WHERE game_id = %d;", gameID)
    return singletonQuery[Game](queryStr, gameScanner)
}

func GetSpec(gameID ID) (Spec, bool, error) {
    queryStr := fmt.Sprintf("SELECT * FROM specs WHERE game_id = %d;", gameID)
    return singletonQuery[Spec](queryStr, specScanner)
}

func GetPlayer(playerID ID) (Player, bool, error) {
    queryStr := fmt.Sprintf("SELECT * FROM players WHERE player_id = %d;", playerID)
    return singletonQuery[Player](queryStr, playerScanner)
}

func GetPlayers(gameID ID) ([]Player, error) {
    queryStr := fmt.Sprintf("SELECT * FROM players WHERE game_id = %d;", gameID)
    return query[Player](queryStr, playerScanner)
}

func GetMove(gameID ID, turn int) (Move, bool, error) {
    queryStr := fmt.Sprintf("SELECT * FROM moves WHERE game_id = %d AND turn = %d;", gameID, turn)
    return singletonQuery[Move](queryStr, moveScanner)
}

func GetEmptySeats(gameID ID) ([]Seat, error) {
    queryStr := fmt.Sprintf("SELECT * FROM seats WHERE game_id = %d AND claimed = FALSE;", gameID)
    return query[Seat](queryStr, seatScanner)
}

func InsertGame(game *Game) error {
    return insert[Game]("games", game, gameValuesFormatter)
}

func InsertSpec(spec *Spec) error {
    return insert[Spec]("specs", spec, specValuesFormatter)
}

func InsertPlayer(player *Player) error {
    return insert[Player]("players", player, playerValuesFormatter)
}

func InsertSeat(seat *Seat) error {
    return insert[Seat]("seats", seat, seatValuesFormatter)
}

func InsertMove(move *Move) error {
    return insert[Move]("moves", move, moveValuesFormatter)
}

/////////////////////////// Non-Exported Functions ////////////////////////////

func deleteFn(table string, key string, value ID) error {
    command := fmt.Sprintf("DELETE FROM %s WHERE %s = %d;", table, key, value)
    _, err := dbconn.Exec(command)
    return err
}

func insert[T any](table string, t *T, valuesFormatter func(x *T) (string, error)) error {
    values, err := valuesFormatter(t)
    if err != nil {
        return err
    }
    command := fmt.Sprintf("INSERT INTO %s VALUES (%s);", table, values)
    _, err = dbconn.Exec(command)
    return err
}

func gameValuesFormatter(g *Game) (string, error) {
    if len(g.Name) > dbschema.MaxStrLen {
        return "", fmt.Errorf("Game name %s longer than max of %d characters",
                                g.Name, dbschema.MaxStrLen)
    }
    if len(g.Password) > dbschema.MaxStrLen {
        return "", fmt.Errorf("Game password %s longer than max of %d characters",
                                g.Password, dbschema.MaxStrLen)
    }
    return fmt.Sprintf("%d, %d, %t, '%s', '%s', %d",
                        g.ID, g.NumPlayers, g.Begun, g.Name,
                        g.Password, time.Now().Unix()), nil
}
func specValuesFormatter(s *Spec) (string, error) {
    marshalled, err := json.Marshal(s.Spec)
    return fmt.Sprintf("DEFAULT, %d, %s", s.GameID, marshalled), err
}
func playerValuesFormatter(p *Player) (string, error) {
    return fmt.Sprintf("%d, %d", p.ID, p.GameID), nil
}
func seatValuesFormatter(s *Seat) (string, error) {
    return fmt.Sprintf("DEFAULT, %d, %d, %d", s.GameID, s.Seat, s.Type, s.Claimed, s.PlayerID), nil
}
func moveValuesFormatter(m *Move) (string, error) {
    return fmt.Sprintf("DEFAULT, %d, %d, %d, %d", m.GameID, m.Turn, m.X, m.Y), nil
}

func stringScanner(r *sql.Rows, s *string) {
    r.Scan(s)
}
func gameScanner(r *sql.Rows, g *Game) {
    r.Scan(&(g.ID), &(g.NumPlayers), &(g.Begun),
           &(g.Name), &(g.Password), &(g.Timestamp))
}
func specScanner(r *sql.Rows, s *Spec) {
    r.Scan(&(s.ID), &(s.GameID), &(s.Spec))
}
func playerScanner(r *sql.Rows, p *Player) {
    r.Scan(&(p.ID), &(p.GameID)) 
}
func seatScanner(r *sql.Rows, s *Seat) {
    r.Scan(&(s.ID), &(s.GameID), &(s.Seat), &(s.Type), &(s.Claimed), &(s.PlayerID)) 
}
func moveScanner(r *sql.Rows, m *Move) {
    r.Scan(&(m.ID), &(m.GameID), &(m.Turn), &(m.X), &(m.Y)) 
}

func consumeRows[T any](rows *sql.Rows, scanner func(r *sql.Rows, t *T)) []T {
    result := make([]T, 0)
    for rows.Next() {
        var nextT T
        scanner(rows, &nextT)
        result = append(result, nextT)
    }
    rows.Close()
    return result
}

func query[T any](queryStr string, scanner func(r *sql.Rows, t *T)) ([]T, error) {
    rows, err := dbconn.Query(queryStr)
    if err != nil {
        return nil, err
    }
    return consumeRows[T](rows, scanner), nil
}

// Returns the single T, true iff exactly 1 result was found, and an error if
//      the query was faulty or if the query returned multiple rows
func firstOfSlice[T any](s []T, err error, queryStr string) (T, bool, error) {
    if (err != nil) {
        return *new(T), false, err
    }
    if len(s) == 0 {
        return *new(T), false, nil
    } else if len(s) > 1 {
        return *new(T), false, fmt.Errorf("Supposed singleton query \"%s\" returned more than one row", queryStr)
    }
    return s[0], true, nil
}

// Returns the single T, true iff exactly 1 result was found, and an error if
//      the query was faulty or if the query returned multiple rows
func singletonQuery[T any](queryStr string, scanner func(r *sql.Rows, t *T)) (T, bool, error) {
    s, err := query[T](queryStr, scanner)
    return firstOfSlice[T](s, err, queryStr)
}
