package types

type ID = int64
type SeatType int
type Time int64     // Epoch time measured in seconds
type Duration int64 // measured in seconds

const (
    Human SeatType = 0
    AI    SeatType = 1
)


// Json Types
type GameBoard struct {
    Width   int  `json:"width"`
    Height  int  `json:"height"`
    Gravity bool `json:"gravity"`
}
type GameRules struct {
    WinningLength int  `json:"winningLength"`
    AllowCaptures bool `json:"allowCaptures"`
    WinByCaptures bool `json:"winByCaptures"`
    CaptureSize   int  `json:"captureSize"`
    WinningNumCaptures int `json:"winningNumCaptures"`
}
type GameSpec struct {
    Board GameBoard `json:"board"`
    Rules GameRules `json:"rules"`
}


// Database Types
type Game struct {
    ID ID
    NumPlayers int
    Begun bool
    Name string
    Password string
    Timestamp Time
}
type Spec struct {
    ID ID
    GameID ID
    Spec GameSpec
}
type Player struct {
    ID ID
    GameID ID
}
type Seat struct {
    ID uint
    GameID ID
    Seat int 
    Type SeatType
    Claimed bool
    PlayerID ID
}
type Move struct {
    ID uint
    GameID ID
    Turn int
    X int
    Y int
}
