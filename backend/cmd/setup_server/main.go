package main

import (
    "encoding/json"
    "linegames/backend/internal/random"
    "linegames/backend/internal/storage"
    "linegames/backend/internal/util"
    "log"
    "math/rand"
    "net/http"
    "sync"
    "time"
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
    GameServer string `json:"gameServer"`
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

func gamesListUpdater(pendingGames *PendingGames,
                      names **[]string, ids **[]ID, lock *sync.Mutex, delay time.Duration) {

    for true {
        _, games := pendingGames.UnorderedKeysAndValues()
        namesList := make([]string, len(games))
        idsList   := make([]ID, len(games))
        for i, game := range games {
            namesList[i] = game.Name
            idsList[i] = game.GameId
        }

        lock.Lock()
        *names = &namesList
        *ids   = &idsList
        lock.Unlock()

        time.Sleep(delay)
    }
}

func gamesListHandler(w http.ResponseWriter, r *http.Request,
                      names **[]string, ids **[]ID, lock *sync.Mutex) {

    w.Header().Set("Content-Type", "application/json; charset=utf-8") // normal header
    lock.Lock()
    namesPtr := *names
    idsPtr   := *ids
    lock.Unlock()
    if namesPtr == nil {
        marshalled, _ := json.Marshal(GamesList{Names: make([]string, 0), Ids: make([]ID, 0)})
        w.Write(marshalled)
        return
    }
    marshalled, _ := json.Marshal(GamesList{Names: *namesPtr, Ids: *idsPtr})
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
    for util.Contains(game.PlayerIds, playerId) {  // Ensure the player id is new
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
    if !util.Contains(game.PlayerIds, seatsRequest.PlayerId) {  // Only a player may request seats
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
    marshalled, _ := json.Marshal(SeatsSuccess{Seats: claimedSeats, GameServer: ""})
    w.Write(marshalled)
}

func main() {
    // Lobby games time out in 10 minutes
    // Reads do not reset the expiration clock
    // At most 10000 games in the lobby
    // Cannot add a new game when full
    // Timeout evictions are performed once per minute
    pendingGames := new(PendingGames)
    pendingGames.Init(60 * 10, false, 10000, false, 60)

    listsLock := new(sync.Mutex)
    var emptyNamesList *[]string = nil
    var emptyIdsList   *[]ID = nil
    names := &emptyNamesList
    ids   := &emptyIdsList

    ngHandler := func(w http.ResponseWriter, r *http.Request) {newGameHandler(w, r, pendingGames)}
    dgHandler := func(w http.ResponseWriter, r *http.Request) {deleteGameHandler(w, r, pendingGames)}
    glHandler := func(w http.ResponseWriter, r *http.Request) {gamesListHandler(w, r, names, ids, listsLock)}
    jgHandler := func(w http.ResponseWriter, r *http.Request) {joinGameHandler(w, r, pendingGames)}
    rsHandler := func(w http.ResponseWriter, r *http.Request) {requestSeatsHandler(w, r, pendingGames)}

    // Runs forever with 10-second pauses
    go gamesListUpdater(pendingGames, names, ids, listsLock, 10 * time.Second)

    http.HandleFunc("/new-game",    ngHandler)
    http.HandleFunc("/delete-game", dgHandler)
    http.HandleFunc("/games-list",  glHandler)
    http.HandleFunc("/join-game",   jgHandler)
    http.HandleFunc("/request-seats", rsHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
