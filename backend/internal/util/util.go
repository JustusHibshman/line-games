package util

func Contains[T comparable](slice []T, element T) bool {
    for _, x := range slice {
        if x == element {
            return true
        }
    }
    return false
}
