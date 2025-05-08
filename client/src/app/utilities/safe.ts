export function safe<T>(primary: T | null | undefined, secondary: T): T {
    if (primary === null || primary === undefined) {
        return secondary;
    }
    return primary;
}
