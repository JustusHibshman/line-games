package storage

import (
    "fmt"
    "testing"
    "time"
)

func TestMinPriorityMap(t *testing.T) {
    pm := new(MinPriorityMap[int, int, int])
    pm.Init()
    for i := 0; i < 10; i++ {
        j := (i + 4) % 10
        pm.Set(j * 2, j, j - 1)
    }
    for i := 0; i < 10; i++ {
        _, value, _, _ := pm.Pop()
        if (value != i) {
            t.Errorf("Expected %d, got %d", i, value)
        }
    }
}

func TestMaxPriorityMap(t *testing.T) {
    pm := new(MaxPriorityMap[int, int, int])
    pm.Init()
    for i := 0; i < 10; i++ {
        j := (i + 4) % 10
        pm.Set(j * 2, j, j - 1)
    }
    for i := 0; i < 10; i++ {  // Assign things again for good measure
        j := (i + 7) % 10
        pm.Set(j * 2, j, j - 1)
    }
    for i := 0; i < 10; i++ {
        expected := 9 - i
        _, value, _, _ := pm.Pop()
        if (value != expected) {
            t.Errorf("Expected %d, got %d", expected, value)
        }
        if (pm.Len() != expected) {
            t.Errorf("Wrong Len()")
        }
    }
}

func TestRemovalPeriod(t *testing.T) {
    cm := new(CappedMap[int, string])
    cm.Init(4, false, 0, false, 7)
    cm.Set(0, "Hello")
    cm.Set(1, "World")
    time.Sleep(1 * time.Second)
    if (cm.Len() != 2) {
        t.Errorf("Wrong size after 1 second: %d vs %d", 2, cm.Len())
    }
    time.Sleep(5 * time.Second)
    if (cm.Len() != 2) {
        t.Errorf("Wrong size after 6 seconds: %d vs %d", 2, cm.Len())
    }
    time.Sleep(1 * time.Second)
    if (cm.Len() != 0) {
        t.Errorf("Timeout removal did not occur.")
    }

    cm.Destroy()
}

func TestReadReset(t *testing.T) {
    cm := new(CappedMap[int, string])
    cm.Init(3, true, 0, false, 4)
    cm.Set(0, "Hello")
    cm.Set(1, "World")
    time.Sleep(3 * time.Second)
    x, _ := cm.Get(1)
    if (x != "World") {
        t.Errorf("Wrong access " + x)
    }
    time.Sleep(2 * time.Second)
    if (cm.Len() != 1) {
        t.Errorf("Read priority refresh did not occur. %d", cm.Len())
    }
    if (cm.Contains(0) || !cm.Contains(1)) {
        t.Errorf("The wrong element timed out!")
    }
    time.Sleep(4 * time.Second)
    if (cm.Len() != 0) {
        t.Errorf("Timeout removal did not occur. %d", cm.Len())
    }

    cm.Destroy()
}

func TestMaxElements(t *testing.T) {
    cm := new(CappedMap[int, string])

    // * Max of 5 elements
    // * Evict oldest (eventually) when overfull
    // * Perform evictions every 2 seconds
    cm.Init(0, false, 5, true, 2)

    cm.Set(0 ,"A")
    time.Sleep(1 * time.Second)
    cm.Set(1, "B")
    cm.Set(2, "C")
    cm.Set(3, "D")
    cm.Set(4, "E")
    cm.Set(5, "F")

    if (cm.Len() != 6) {
        t.Errorf("Prevented insertions rather then awaiting eviction")
    }

    time.Sleep(2 * time.Second)

    if (cm.Len() != 5) {
        t.Errorf("Did not bring down to size")
    }
    if (cm.Contains(0)) {
        t.Errorf("Did not delete oldest key")
    }

    cm.Destroy()

    cm = new(CappedMap[int, string])
    // * Max of 5 elements
    // * Prevent insertions when full
    // * Perform evictions every 2 seconds
    cm.Init(0, false, 5, false, 2)
    cm.Set(0 ,"A")
    time.Sleep(1 * time.Second)
    cm.Set(1, "B")
    cm.Set(2, "C")
    cm.Set(3, "D")
    cm.Set(4, "E")
    cm.Set(5, "F")

    if (cm.Len() != 5) {
        t.Errorf("Allowed insertions beyond size limit though old-eviction disabled")
    }
    if (cm.Contains(5)) {
        t.Errorf("Kept the wrong element (kept the one set after map already full)")
    }

    cm.Destroy()

    cm = new(CappedMap[int, string])
    // * Max of 5 elements
    // * Evict oldest (immediately) when overfull
    // * Perform evictions when interface is called
    cm.Init(0, false, 5, true, 0)
    cm.Set(0 ,"A")
    time.Sleep(1 * time.Second)
    cm.Set(1, "B")
    cm.Set(2, "C")
    cm.Set(3, "D")
    cm.Set(4, "E")
    cm.Set(5, "F")

    if (cm.Len() != 5) {
        t.Errorf("Did not bring down to size")
    }
    if (cm.Contains(0)) {
        t.Errorf("Did not delete oldest key")
    }

    cm.Destroy()

    cm = new(CappedMap[int, string])
    // * Max of 5 elements
    // * Prevent insertions when full
    // * Perform evictions when interface is called
    cm.Init(0, false, 5, false, 0)
    cm.Set(0 ,"A")
    time.Sleep(1 * time.Second)
    cm.Set(1, "B")
    cm.Set(2, "C")
    cm.Set(3, "D")
    cm.Set(4, "E")
    cm.Set(5, "F")

    if (cm.Len() != 5) {
        t.Errorf("Allowed insertions beyond size limit though old-eviction disabled")
    }
    if (cm.Contains(5)) {
        t.Errorf("Kept the wrong element (kept the one set after map already full)")
    }

    cm.Destroy()
}


func TestBothMainFeatures(t *testing.T) {
    cm := new(CappedMap[int, string])
    // * Elements auto-timeout after 4 seconds
    // * Read resets eviction timer
    // * Max of 3 elements
    // * Evict oldest (eventually) when overfull
    // * Perform evictions every 2 seconds
    cm.Init(4, true, 3, true, 2)
    cm.Set(0, "A")
    time.Sleep(1 * time.Second)
    cm.Set(1, "B")
    cm.Set(2, "C")
    cm.Set(3, "D")

    time.Sleep(2 * time.Second)
    if (cm.Contains(0)) {
        t.Errorf("Kept oldest key which should have been evicted due to size. " + fmt.Sprint(cm.Len()))
    }

    cm.Get(1)

    time.Sleep((7 * time.Second) / 2)  // 3.5 seconds
    if (cm.Len() != 1) {
        t.Errorf("Generic timeout failed. " + fmt.Sprint(cm.Len()))
    }
    if (!cm.Contains(1)) {
        t.Errorf("Timer reset on read failed")
    }

    cm.Destroy()
}
