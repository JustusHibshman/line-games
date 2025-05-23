package main

import (
    "encoding/json"
    "linegames/backend/internal/random"
    "linegames/backend/internal/storage"
    "log"
    "math/rand"
    "net/http"
)

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

type CreateRequest struct {
    Name string         `json:"name"`
    Password string     `json:"password"`
    Seats []SeatType    `json:"seats"`
    Spec GameSpec       `json:"spec"`
}
type CreateSuccess struct {
    GameId ID `json:"gameId"`
    HostId ID `json:"hostId"`
}

type JoinRequest struct {
    GameId ID `json:"gameId"`
    Password string `json:"password"`
}
type JoinSuccess struct {
    PlayerId ID `json:"playerId"`
}

type SeatsRequest struct {
    GameId ID     `json:"gameId"`
    PlayerId ID   `json:"playerId"`
    NumSeats uint `json:"numSeats"`
}
type SeatsSuccess struct {
    Seats []int `json:"seats"`
}

type GamesList struct {
    Names []string `json:"names"`
    Ids   []ID     `json:"ids"`
}

type DeleteRequest struct {
    GameId ID `json:"gameId"`
    HostId ID `json:"hostId"`
}

type pendingGame struct {
    Name string
    Password string
    GameId ID
    HostId ID
    Spec GameSpec
    PlayerIds []ID
    Seats []SeatType
}

type PendingGames = storage.CappedMap[ID, *pendingGame]

func newGameHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

    newGame := new(CreateRequest)
    err := json.NewDecoder(r.Body).Decode(newGame)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
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
    pg.HostId = random.Random64()
    pg.PlayerIds = make([]ID, 1)
    pg.PlayerIds[0] = pg.HostId

    fullError := pendingGames.Set(pg.GameId, pg)
    if (fullError != nil) {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(CreateSuccess{GameId: pg.GameId, HostId: pg.HostId})
    w.Write(marshalled)
}

func deleteGameHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

    toDelete := new(DeleteRequest)
    err := json.NewDecoder(r.Body).Decode(toDelete)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    game, err := pendingGames.Get(toDelete.GameId)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        return
    }
    if (game.HostId != toDelete.HostId) {  // Only the host may delete the game
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    pendingGames.Remove(toDelete.GameId)
    w.WriteHeader(http.StatusOK)
}

func gamesListHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

    _, games := pendingGames.UnorderedKeysAndValues()
    names := make([]string, len(games))
    ids   := make([]ID, len(games))
    for i, game := range games {
        names[i] = game.Name
        ids[i] = game.GameId
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(GamesList{Names: names, Ids: ids})
    w.Write(marshalled)
}

func joinGameHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

    toJoin := new(JoinRequest)
    err := json.NewDecoder(r.Body).Decode(toJoin)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    game, err := pendingGames.Get(toJoin.GameId)
    if (err != nil) {
        w.WriteHeader(http.StatusBadRequest)
        return
    }
    if (game.Password != toJoin.Password) {
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    playerId := random.Random64()
    for contains(game.PlayerIds, playerId) {  // Ensure the player id is new
        playerId = random.Random64()
    }
    game.PlayerIds = append(game.PlayerIds, playerId)

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(JoinSuccess{PlayerId: playerId})
    w.Write(marshalled)
}

func requestSeatsHandler(w http.ResponseWriter, r *http.Request, pendingGames *PendingGames) {

    seatsRequest := new(SeatsRequest)
    err := json.NewDecoder(r.Body).Decode(seatsRequest)
    if err != nil {
        w.WriteHeader(http.StatusBadRequest)
        errText, _ := json.Marshal(err.Error())
        w.Write(errText)
        return
    }

    if seatsRequest.NumSeats == 0 {
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    game, err := pendingGames.Get(seatsRequest.GameId)
    if err != nil {
        w.WriteHeader(http.StatusBadRequest)
        return
    }
    if !contains(game.PlayerIds, seatsRequest.PlayerId) {  // Only a player may request seats
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    freeSeats := make([]int, 0)
    for i, seatType := range game.Seats {
        if seatType == HumanEmpty {
            freeSeats = append(freeSeats, i)
        }
    }

    if uint(len(freeSeats)) < seatsRequest.NumSeats {
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    // Claim the seats
    claimedSeats := make([]int, seatsRequest.NumSeats)
    for i := 0; uint(i) < seatsRequest.NumSeats; i++ {
        seatIdx := rand.Intn(len(freeSeats))
        claimedSeats[i] = freeSeats[seatIdx]
        game.Seats[claimedSeats[i]] = HumanFilled
        freeSeats[seatIdx] = freeSeats[len(freeSeats) - 1]
        freeSeats = freeSeats[0:len(freeSeats) - 1]
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    marshalled, _ := json.Marshal(SeatsSuccess{Seats: claimedSeats})
    w.Write(marshalled)
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
    dgHandler := func(w http.ResponseWriter, r *http.Request) {deleteGameHandler(w, r, pendingGames)}
    glHandler := func(w http.ResponseWriter, r *http.Request) {gamesListHandler(w, r, pendingGames)}
    jgHandler := func(w http.ResponseWriter, r *http.Request) {joinGameHandler(w, r, pendingGames)}
    rsHandler := func(w http.ResponseWriter, r *http.Request) {requestSeatsHandler(w, r, pendingGames)}

    http.HandleFunc("/new-game",    ngHandler)
    http.HandleFunc("/delete-game", dgHandler)
    http.HandleFunc("/games-list",  glHandler)
    http.HandleFunc("/join-game",   jgHandler)
    http.HandleFunc("/request-seats", rsHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func contains(s []ID, x ID) bool {
    for _, id := range s {
        if id == x {
            return true
        }
    }
    return false
}
