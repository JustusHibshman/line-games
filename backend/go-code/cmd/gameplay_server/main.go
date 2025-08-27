package main

// Import the exported project types without a prefix
import . "linegames/backend/internal/types"
import (
    "encoding/json"
    "linegames/backend/internal/database"
    "linegames/backend/internal/httpparse"
    "log"
    "net/http"
)
type Position struct {
    X int   `json:"col"`
    Y int   `json:"row"`
}
type RequestMoveRequest struct {
    GameID ID   `url:"gameID"`
    PlayerID ID `url:"playerID"`
    Turn int    `url:"turn"`
}
type RequestMoveResponse struct {
    Success bool    `json:"success"`
    Pos Position    `json:"move"`
}
type MakeMoveRequest struct {
    GameID ID   `json:"gameID"`
    PlayerID ID `json:"playerID"`
    X int       `json:"col"`
    Y int       `json:"row"`
    Turn int    `json:"turn"`
}
type MakeMoveResponse struct {
    Success bool    `json:"success"`
    Pos Position    `json:"move"`
}

// Expects a POST request
func makeMoveHandler(w http.ResponseWriter, r *http.Request) {

    request := new(MakeMoveRequest)
    err := json.NewDecoder(r.Body).Decode(request)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    player, found, err := database.GetPlayer(request.PlayerID)
    if !found || player.GameID != request.GameID {
        w.WriteHeader(http.StatusBadRequest)
        return
    }
    if err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    playerSeat, found, err := database.GetPlayerSeat(request.PlayerID)
    if !found || err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }
    game, found, err := database.GetGame(request.GameID)
    if !found || err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    if playerSeat.Seat != request.Turn % game.NumPlayers {
        // This player should not be moving on this turn
        //
        // This is either a glitch or an attempt to cheat
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    var move Move
    move.X = request.X
    move.Y = request.Y
    move.GameID = request.GameID
    move.Turn = request.Turn

    _, alreadyPresent, _ := database.GetMove(request.GameID, request.Turn)
    if !alreadyPresent {
        err = database.InsertMove(&move)
        if err != nil {
            w.WriteHeader(http.StatusServiceUnavailable)
            return
        }
    } else {
        log.Printf("Attempted to submit move %d more than once in game %d", request.Turn, request.GameID)
    }

    var result MakeMoveResponse
    result.Pos.X = move.X
    result.Pos.Y = move.Y
    result.Success = true
    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(result)
    w.Write(marshalled)
}

// Expects a GET request
func requestMoveHandler(w http.ResponseWriter, r *http.Request) {

    request := new(RequestMoveRequest)
    err := httpparse.HttpParamsToStruct(r, request, "url")
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    player, found, err := database.GetPlayer(request.PlayerID)
    if !found || player.GameID != request.GameID {
        w.WriteHeader(http.StatusBadRequest)
        return
    }
    if err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    move, found, err := database.GetMove(request.GameID, request.Turn)

    if err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    var result RequestMoveResponse
    result.Pos.X = move.X
    result.Pos.Y = move.Y
    result.Success = found
    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(result)
    w.Write(marshalled)
}

func main() {
    http.HandleFunc("/make-move",    makeMoveHandler)
    http.HandleFunc("/request-move", requestMoveHandler)
    log.Fatal(http.ListenAndServe(":3333", nil))
}
