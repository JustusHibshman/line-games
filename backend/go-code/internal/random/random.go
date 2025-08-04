package random

// Cryptographically Random Integers

import (
    "crypto/rand"
    "math/big"
)

const (
    max32 int64 = 0xFFFFFFFF
    limit32 int64 = max32 + 1
)

func Random32() int32 {
    exclusiveMax := big.NewInt(limit32)
    id, _ := rand.Int(rand.Reader, exclusiveMax)
    return int32(id.Int64())
}

func Random64() int64 {
    return int64(Random32()) << 32 + int64(Random32())
}

// Returns a 53-bit random integer
func JavaScriptFriendlyRandom64() int64 {
    return Random64() & 0x001FFFFFFFFFFFFF
}
