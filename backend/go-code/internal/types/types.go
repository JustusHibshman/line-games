package types

type ID = int64
type SeatType int
type Time int64     // Epoch time measured in seconds
type Duration int64 // measured in seconds

const (
    HumanEmpty  SeatType = 0
    AI          SeatType = 1
    HumanFilled SeatType = 2
)

// Database Types
type Game struct {
    ID ID
    HostID ID
    NumPlayers int
    Begun bool
    Name string
    Password string
    Timestamp Time
}

type Player struct {
    ID ID
    GameID ID
}

type Seat struct {
    ID uint
    GameID ID
    Seat int 
    PlayerID ID
}

type Move struct {
    ID uint
    GameID ID
    Turn int
    X int
    Y int
}

// Other Types
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
