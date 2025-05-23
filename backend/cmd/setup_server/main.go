package main

import (
    "encoding/json"
    "html"
    "linegames/backend/internal/random"
    "linegames/backend/internal/storage"
    "log"
    "net/http"
)

func basicReplyHandler(w http.ResponseWriter, r *http.Request) {
    jsonStr, err := json.Marshal("Hello " + html.EscapeString(r.URL.Path));
    if err == nil {
        w.Write(jsonStr);
    }
}

type ID = uint64
type SeatType uint
const (
    HumanEmpty  SeatType = 0
    AI          SeatType = 1
    HumanFilled SeatType = 2
)
type BoardRules struct {
    Width   int  `json:"width"`
    Height  int  `json:"height"`
    Gravity bool `json:"gravity"`
}
type WinRules struct {
    WinningLength int  `json:"winningLength"`
    AllowCaptures bool `json:"allowCaptures"`
    WinByCaptures bool `json:"winByCaptures"`
    CaptureSize   int  `json:"captureSize"`
    WinningNumCaptures int `json:"winningNumCaptures"`
}
type GameSpec struct {
    Board BoardRules `json:"board"`
    Rules WinRules   `json:"rules"`
}

type createRequest struct {
    Name string
    Password string
    Seats []SeatType
    Spec GameSpec
}

type pendingGame struct {
    Name string
    Password string
    GameId ID
    Spec GameSpec
    PlayerIds []ID
    Seats []SeatType
}

type PendingGames = storage.CappedMap[ID, *pendingGame]

func newGameHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

    newGame := new(createRequest)
    err := json.NewDecoder(r.Body).Decode(newGame)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    pg := new(pendingGame)
    pg.Name     = newGame.Name
    pg.Password = newGame.Password
    pg.Seats    = newGame.Seats
    pg.Spec     = newGame.Spec

    pg.GameId = random.Random64()
    for pendingGames.Contains(pg.GameId) {  // Ensure the game id is new
        pg.GameId = random.Random64()
    }

    fullError := pendingGames.Set(pg.GameId, pg)
    if (fullError != nil) {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(pg.GameId)
    w.Write(marshalled)
}

func deleteGameHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

}

func gamesListHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

}

func joinGameHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

}

func requestSeatsHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {
    
}

func main() {
    pendingGames := new(PendingGames)

    // Lobby games time out in 20 minutes
    // Reads do not reset the expiration clock
    // At most 10000 games in the lobby
    // Cannot add a new game when full
    // Timeout evictions are performed once per minute
    pendingGames.Init(60 * 20, false, 10000, false, 60)

    ngHandler := func(w http.ResponseWriter, r *http.Request) {newGameHandler(w, r, pendingGames)}

    http.HandleFunc("/new-game", ngHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
