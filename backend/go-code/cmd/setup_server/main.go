package main

// Import the exported project types without a prefix
import . "linegames/backend/internal/types"
import (
    "encoding/json"
    "linegames/backend/internal/database"
    "linegames/backend/internal/random"
    "linegames/backend/internal/util"
    "log"
    "math/rand"
    "net/http"
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
    PlayerID ID   `json:"playerId"`
    Type SeatType `json:"type"`
}
type CreateSuccess struct {
    GameID ID            `json:"gameId"`
    Seats []AssignedSeat `json:"seats"`
}
type SeatRequest struct {
    GameID ID       `json:"gameId"`
    Password string `json:"password"`
}
type DeleteRequest struct {
    GameID ID   `json:"gameId"`
    PlayerID ID `json:"playerId"`
}

func newGameHandler(w http.ResponseWriter, r *http.Request) {

    newGame := new(CreateRequest)
    err := json.NewDecoder(r.Body).Decode(newGame)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    if len(newGame.SeatTypes) == 0 || len(newGame.SeatTypes) > maxPlayers {
        w.WriteHeader(http.StatusBadRequest)
        return
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

    playerIds := make([]ID, g.NumPlayers)
    players   := make([]Player, g.NumPlayers)
    var playerId ID
    for i := 0; i < g.NumPlayers; i++ {
        alreadyPresent = true
        for alreadyPresent || util.Contains[ID](playerIds, playerId) {
            playerId = random.Random64()
            _, alreadyPresent, _ = database.GetPlayer(playerId)
        }
        playerIds[i] = playerId
        players[i].ID = playerId
        players[i].GameID = g.ID
    }

    seats := make([]Seat, g.NumPlayers)
    humanSeats := make([]int, 0)
    aiSeats := make([]int, 0)
    for i := 0; i < g.NumPlayers; i++ {
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

    var result CreateSuccess
    result.GameID = g.ID
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

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(AssignedSeat{Seat: seatNum,
                                               Type: seats[chosenIdx].Type,
                                               PlayerID: seats[chosenIdx].PlayerID})
    w.Write(marshalled)
}

func main() {

    http.HandleFunc("/new-game",     newGameHandler)
    http.HandleFunc("/delete-game",  deleteGameHandler)
    http.HandleFunc("/request-seat", requestSeatHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
