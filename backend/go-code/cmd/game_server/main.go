package main

import (
    "encoding/json"
    "linegames/backend/internal/storage"
    "linegames/backend/internal/util"
    "log"
    "math/rand"
    "net/http"
    "sync"
    "time"
)

type ID = uint64
type Move struct {
    X int
    Y int
}

type MovesByTurn = storage.CappedMap[uint, Move]
type Games = storage.CappedMap[ID, *MovesByTurn]

func newMovesByTurn(numStored uint) *MovesByTurn {
    mbt := new(MovesByTurn)
    // Store at most `numStored` elements. When a new one is added,
    //  automatically evict the oldest element.
    //
    // Because removalPeriod is set to zero, does not have a seperate thread
    //  for eviction.
    mbt.Init(0, false, numStored, true, 0)
    return mbt
}

// Response handlers
//
// * Create Game
// * Delete Game
// * Make Move
// * Request Move X

func main() {

}
