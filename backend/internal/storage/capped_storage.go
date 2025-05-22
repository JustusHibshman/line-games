package storage

import (
    "errors"
    "sync"
    "time"
)

/*
    Interface for *CappedMap[S comparable, T any]

    This data structure is thread-safe but could form a bottleneck since it
    uses a global lock.

    // When a specific key has been stored for more than `timeout` seconds,
    //  it is deleted from the map.
    //
    // When `resetTimeoutOnRead` is true, reading a specific key resets its
    //  timeout clock.
    //
    // When `maxElements` is set to zero, the size is unlimited.
    //  Otherwise, either setting new keys is impossible or setting a new key
    //  causes the oldest element to be evicted. This behavior is determined by
    //  `evictWhenFull`
    //
    // `removalPeriod` is the period (in seconds) between the removal of
    //      keys which have timed out or have been evicted due to new elements
    //      being inserted.
    //
    //      If `removalPeriod` is set to zero, removals occur when the Set, Get,
    //          Remove, and Contains functions are called.
    Init(timeout uint, resetTimeoutOnRead bool, maxElements uint,
         evictWhenFull bool, removalPeriod uint)

    // NOTE: Old items are not deleted until one of the following functions
    //  are called, meaning they could take a while to finish.

    Len() int
    Set(key S, value T) error
    Get(key S) (value T, error)
    Remove(key S) error
    Contains(key S) bool

    // This function is by nature O(n) both in time and space -- use infrequently
    UnorderedKeysAndValues() (keys []S, values []T)

    // Stops the key-removal thread if it is still running
    Destroy()
*/

type CappedMap[S comparable, T any] struct {
    timeout uint
    resetTimeoutOnRead bool
    maxElements uint
    evictWhenFull bool
    removalPeriod uint
    destroyed bool

    referenceTime time.Time

    lock sync.Mutex

    // The "priorities" are the seconds times since `referenceTime`.
    //
    // Thus smaller numbers mean older elements.
    data PriorityMap[S, T, uint]
}

func (m *CappedMap[S, T]) Init(timeout uint, resetTimeoutOnRead bool,
                               maxElements uint, evictWhenFull bool,
                               removalPeriod uint) {
    m.timeout = timeout
    m.resetTimeoutOnRead = resetTimeoutOnRead
    m.maxElements = maxElements
    m.evictWhenFull = evictWhenFull
    m.removalPeriod = removalPeriod
    m.destroyed = false

    m.data = new(MinPriorityMap[S, T, uint])
    m.data.Init()
    m.referenceTime = time.Now()

    if (m.removalPeriod != 0) {
        go m.regulate()
    }
}

func (m *CappedMap[S, T]) secondsSinceInit() uint {
    return uint(time.Now().Sub(m.referenceTime) / time.Second)
}

func (m *CappedMap[S, T]) Len() int {
    m.lock.Lock()
    if (m.removalPeriod == 0) {
        m.locklessOneTimeRegulate()
    }
    defer m.lock.Unlock()
    return m.data.Len()
}

func (m *CappedMap[S, T]) Set(key S, value T) error {
    m.lock.Lock()
    if (m.removalPeriod == 0) {
        m.locklessOneTimeRegulate()
    }
    defer m.lock.Unlock()
    if (m.maxElements != 0 && !m.evictWhenFull &&
            !m.data.Contains(key) && uint(m.data.Len()) >= m.maxElements) {
        return errors.New("Cannot set new key when CappedMap is full and evictWhenFull is disabled")
    }
    m.data.Set(key, value, m.secondsSinceInit())
    return nil
}

func (m *CappedMap[S, T]) Get(key S) (value T, err error) {
    m.lock.Lock()
    if (m.removalPeriod == 0) {
        m.locklessOneTimeRegulate()
    }
    defer m.lock.Unlock()
    if (m.resetTimeoutOnRead && m.data.Contains(key)) {
        m.data.SetPriority(key, m.secondsSinceInit())
    }
    return m.data.Get(key)
}

func (m *CappedMap[S, T]) Contains(key S) bool {
    m.lock.Lock()
    if (m.removalPeriod == 0) {
        m.locklessOneTimeRegulate()
    }
    defer m.lock.Unlock()
    return m.data.Contains(key)
}

func (m *CappedMap[S, T]) Remove(key S) error {
    m.lock.Lock()
    if (m.removalPeriod == 0) {
        m.locklessOneTimeRegulate()
    }
    defer m.lock.Unlock()
    return m.data.Remove(key)
}

func (m *CappedMap[S, T]) UnorderedKeysAndValues() ([]S, []T) {
    m.lock.Lock()
    if (m.removalPeriod == 0) {
        m.locklessOneTimeRegulate()
    }
    defer m.lock.Unlock()
    return m.data.UnorderedKeysAndValues()
}

func (m *CappedMap[S, T]) Destroy() {
    m.destroyed = true
}

// Returns true iff something was evicted
func (m *CappedMap[S, T]) evict() bool {
    m.lock.Lock()
    defer m.lock.Unlock()
    return m.locklessEvict()
}

func (m *CappedMap[S, T]) locklessEvict() bool {
    if (m.maxElements != 0 && uint(m.data.Len()) > m.maxElements) {
        m.data.Pop()
        return true;
    } else if (m.timeout != 0 && m.data.Len() > 0) {
        _, _, timeInserted, _ := m.data.Peek()
        if (m.secondsSinceInit() - timeInserted >= m.timeout) {
            m.data.Pop()
            return true
        }
    }
    return false
}

func (m *CappedMap[S, T]) locklessOneTimeRegulate() {
    for (m.locklessEvict()) {}
}

func (m *CappedMap[S, T]) regulate() {
    for (!m.destroyed) {
        for (m.evict()) {}
        time.Sleep(time.Duration(m.removalPeriod) * time.Second)
    }
}
