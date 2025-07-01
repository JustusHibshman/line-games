package main

// Import the exported project types without a prefix
import . "linegames/backend/internal/types"
import (
    "encoding/json"
    "fmt"
    "linegames/backend/internal/database"
    "linegames/backend/internal/random"
    "linegames/backend/internal/util"
    "log"
    "math/rand"
    "net/http"
    // "strings"
    "io"
)

const (
    maxPlayers = 6
)


type CreateRequest struct {
    Name string          `json:"name"`
    Password string      `json:"password"`
    SeatTypes []SeatType `json:"seatTypes"`
    Spec GameSpec        `json:"spec"`
}
type AssignedSeat struct {
    Seat int      `json:"seat"`
    PlayerID ID   `json:"playerID"`
    Type SeatType `json:"type"`
}
// NOTE: `Seats` only contains the seat(s) assigned in the process of handling a
//  particular request -- not all the seats that a client occupies.
type SuccessResponse struct {
    GameID ID            `json:"gameID"`
    Seats []AssignedSeat `json:"seats"`
    Spec GameSpec        `json:"spec"`
    NumPlayers int       `json:"numPlayers"`
}
type SeatRequest struct {
    GameID ID       `json:"gameID"`
    Password string `json:"password"`
}
type DeleteRequest struct {
    GameID ID   `json:"gameID"`
    PlayerID ID `json:"playerID"`
}

// Assumes that sr already has the game ID and the seat info -- adds the spec
//  and the number of players.
func fillInGameDetails(sr *SuccessResponse) error {
    var err error
    var found bool
    var game Game
    var spec Spec
    spec, found, err = database.GetSpec(sr.GameID)
    if err != nil {
        return err
    } else if !found {
        return fmt.Errorf("Game Spec for game_id %d not found.", sr.GameID)
    }
    sr.Spec = spec.Spec
    game, found, err = database.GetGame(sr.GameID)
    if err != nil {
        return err
    } else if !found {
        return fmt.Errorf("Game for game_id %d not found.", sr.GameID)
    }
    sr.NumPlayers = game.NumPlayers
    return nil
}

func newGameHandler(w http.ResponseWriter, r *http.Request) {

    log.Printf("Received a create-game request")
    // buf := new(strings.Builder)
    // io.Copy(buf, r.Body)
    // log.Println(buf.String())

    newGame := new(CreateRequest)
    err := json.NewDecoder(r.Body).Decode(newGame)
    if (err != nil && err != io.EOF) {
        log.Printf("Could not json decode")
        log.Printf(err.Error())
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    if len(newGame.SeatTypes) == 0 || len(newGame.SeatTypes) > maxPlayers {
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    for i := 0; i < len(newGame.SeatTypes); i++ {
        if newGame.SeatTypes[i] != Human && newGame.SeatTypes[i] != AI {
            w.WriteHeader(http.StatusBadRequest)
            return
        }
    }

    /// Rotate the seat types so that human vs. AI starting order is random ///
    newGame.SeatTypes = util.Rotated[SeatType](newGame.SeatTypes,
                                               int(rand.Int31n(int32(len(newGame.SeatTypes)))))

    /// First, create all the information locally ///
    g := new(Game)
    g.Name     = newGame.Name
    g.Password = newGame.Password
    g.NumPlayers = len(newGame.SeatTypes)
    g.Begun = false

    var alreadyPresent bool = true
    for alreadyPresent {  // Ensure the game id is new
        g.ID = random.Random64()
        _, alreadyPresent, _ = database.GetGame(g.ID)
    }

    playerIDs := make([]ID, g.NumPlayers)
    players   := make([]Player, g.NumPlayers)
    var playerId ID
    for i := 0; i < g.NumPlayers; i++ {
        alreadyPresent = true
        for alreadyPresent || util.Contains[ID](playerIDs, playerId) {
            playerId = random.Random64()
            _, alreadyPresent, _ = database.GetPlayer(playerId)
        }
        playerIDs[i] = playerId
        players[i].ID = playerId
        players[i].GameID = g.ID
    }

    seats := make([]Seat, g.NumPlayers)
    humanSeats := make([]int, 0)
    aiSeats := make([]int, 0)
    for i := 0; i < g.NumPlayers; i++ {
        seats[i].GameID = g.ID
        seats[i].PlayerID = playerIDs[i]
        seats[i].Seat = i
        seats[i].Type = newGame.SeatTypes[i]
        if seats[i].Type == Human {
            seats[i].Claimed = false
            humanSeats = append(humanSeats, i)
        } else {
            seats[i].Claimed = true
            aiSeats = append(aiSeats, i)
        }
    }

    // Give the host a seat so that we can determine the host ID
    if len(humanSeats) == 0 {
        w.WriteHeader(http.StatusBadRequest)
        return
    }
    if len(humanSeats) == 1 {
        g.Begun = true  // No need to appear in the lobby list
    }
    hSeat := int(rand.Int31n(int32(len(humanSeats))))
    seats[hSeat].Claimed = true

    spec := new(Spec)
    spec.GameID = g.ID
    spec.Spec = newGame.Spec

    /// Then, put the information in the database ///

    err = database.InsertGame(g)
    if (err != nil) {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }
    err = database.InsertSpec(spec)
    if (err != nil) {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }
    for i := 0; i < g.NumPlayers; i++ {
        err = database.InsertPlayer(&players[i])
        if err != nil {
            w.WriteHeader(http.StatusServiceUnavailable)
            return
        }
    }
    for i := 0; i < g.NumPlayers; i++ {
        err = database.InsertSeat(&seats[i])
        if err != nil {
            w.WriteHeader(http.StatusServiceUnavailable)
            return
        }
    }

    var result SuccessResponse
    result.GameID = g.ID
    result.NumPlayers = g.NumPlayers
    result.Spec = newGame.Spec
    result.Seats = make([]AssignedSeat, 1 + len(aiSeats))
    result.Seats[0].Seat =     seats[hSeat].Seat
    result.Seats[0].Type =     seats[hSeat].Type
    result.Seats[0].PlayerID = seats[hSeat].PlayerID
    for i := 0; i < len(aiSeats); i++ {
        result.Seats[i + 1].Seat =     seats[aiSeats[i]].Seat
        result.Seats[i + 1].Type =     seats[aiSeats[i]].Type
        result.Seats[i + 1].PlayerID = seats[aiSeats[i]].PlayerID
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(result)
    w.Write(marshalled)
}

func deleteGameHandler(w http.ResponseWriter, r *http.Request) {

    toDelete := new(DeleteRequest)
    err := json.NewDecoder(r.Body).Decode(toDelete)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    player, found, err := database.GetPlayer(toDelete.PlayerID)
    if !found || player.GameID != toDelete.GameID {
        w.WriteHeader(http.StatusBadRequest)
        return
    }
    if err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
    }

    database.DeleteAllGameData(toDelete.GameID)

    w.WriteHeader(http.StatusOK)
}


func requestSeatHandler(w http.ResponseWriter, r *http.Request) {

    seatRequest := new(SeatRequest)
    err := json.NewDecoder(r.Body).Decode(seatRequest)
    if err != nil {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    var check bool
    check, err = database.ValidLogin(seatRequest.GameID, seatRequest.Password)
    if err != nil || !check {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    var seats []Seat
    seats, err = database.GetEmptySeats(seatRequest.GameID)
    if err != nil || len(seats) == 0 {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    chosenIdx := int(rand.Int31n(int32(len(seats))))
    seatNum := seats[chosenIdx].Seat
    check, err = database.ClaimSeat(seatRequest.GameID, seatNum)
    if err != nil || !check {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    var result SuccessResponse
    result.GameID = seatRequest.GameID
    result.Seats = []AssignedSeat{AssignedSeat{Seat: seatNum,
                                               Type: seats[chosenIdx].Type,
                                               PlayerID: seats[chosenIdx].PlayerID}}
    err = fillInGameDetails(&result)
    if err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(result)
    w.Write(marshalled)
}

func main() {

    http.HandleFunc("/new-game",     newGameHandler)
    http.HandleFunc("/delete-game",  deleteGameHandler)
    http.HandleFunc("/request-seat", requestSeatHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
