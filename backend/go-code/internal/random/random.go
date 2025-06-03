package random

// Cryptographically Random Unsigned Integers

import (
    "crypto/rand"
    "math/big"
)

const (
    max32 int64 = 0xFFFFFFFF
    limit32 int64 = max32 + 1
)

func Random32() uint32 {
    exclusiveMax := big.NewInt(limit32)
    id, _ := rand.Int(rand.Reader, exclusiveMax)
    return uint32(uint64(id.Int64()))
}

func Random64() uint64 {
    return uint64(Random32()) << 32 + uint64(Random32())
}
