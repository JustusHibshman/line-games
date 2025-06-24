package util

func Contains[T comparable](slice []T, element T) bool {
    for _, x := range slice {
        if x == element {
            return true
        }
    }
    return false
}

// Shifts all elements `rotateAmt` to the right
func Rotated[T any](slice []T, rotateAmt int) []T {
    result := make([]T, len(slice))
    if len(slice) == 0 {
        return result
    }

    // Ensure rotateAmt is a number in the range [0, len(slice)) while
    //  preserving the semantic meaning that an original negative value means
    //  shifting to the left
    rotateAmt = rotateAmt % len(slice)
    if rotateAmt < 0 {
        rotateAmt += len(slice)
    }

    for i := 0; i < len(slice); i++ {
        result[(i + rotateAmt) % len(slice)] = slice[i]
    }
    return result
}
