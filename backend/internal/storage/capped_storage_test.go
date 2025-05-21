package storage

import (
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
}

func TestMaxElements(t *testing.T) {
    cm := new(CappedMap[int, string])
    cm.Init(0, false, 0, false, 7)
}
