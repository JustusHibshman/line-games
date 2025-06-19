package types

type ID = int64
type SeatType int

const (
    HumanEmpty  SeatType = 0
    AI          SeatType = 1
    HumanFilled SeatType = 2
)

type Game struct {
    ID ID
    HostID ID
    NumPlayers int
    Begun bool
    Name string
    Password string
}

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
