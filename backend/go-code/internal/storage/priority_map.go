package storage

import (
    "cmp"
    "container/heap"
    "errors"
)

// The intereface
//
// Functions which modify the data have runtime O(log(n))
type PriorityMap[S comparable, T any, P cmp.Ordered] interface {
    Init()
    Len() int
    Contains(key S) bool

    UnorderedKeysAndValues() ([]S, []T)

    Set(key S, value T, priority P)
    SetValue(key S, value T) error
    SetPriority(key S, priority P) error
    Get(key S) (value T, err error)
    Peek() (key S, value T, priority P, err error)
    Pop()  (key S, value T, priority P, err error)
    Remove(key S) error
}

// Concrete types to use:
//
// MaxPriorityMap[S, T, P] -- larger priorities are popped first
// MinPriorityMap[S, T, P] -- smaller priorities are popped first

type pmItem[S comparable, T any, P cmp.Ordered] struct {
    key S
    value T
    priority P
}

type compare[P cmp.Ordered] interface {
    less(a, b P) bool
}
type ltCompare[P cmp.Ordered] struct {}
func (lt *ltCompare[P]) less(a, b P) bool {return a < b}
type gtCompare[P cmp.Ordered] struct {}
func (gt *gtCompare[P]) less(a, b P) bool {return a > b}

type priorityMap[S comparable, T any, P cmp.Ordered, C compare[P]] struct {
    comp C
    data []*pmItem[S, T, P]
    index map[S]int
}

// Has the publicly available user interface functions
//
// However, it is simpler to use MaxPriorityMap or MinPriorityMap which embed
//  PriorityMap.
type PriorityMapCore[S comparable, T any, P cmp.Ordered, C compare[P]] struct {
    priorityMap[S, T, P, C]
}

type MaxPriorityMap[S comparable, T any, P cmp.Ordered] struct {
    PriorityMapCore[S, T, P, *gtCompare[P]]
}

type MinPriorityMap[S comparable, T any, P cmp.Ordered] struct {
    PriorityMapCore[S, T, P, *ltCompare[P]]
}

func (pm *PriorityMapCore[S, T, P, C]) Init() {
    pm.comp  = *new(C)
    pm.data  = make([]*pmItem[S, T, P], 0)
    pm.index = make(map[S]int)
}

func (pm *PriorityMapCore[S, T, P, C]) Len() int {
    return pm.priorityMap.Len()
}

func (pm *PriorityMapCore[S, T, P, C]) Contains(key S) bool {
    return pm.priorityMap.Contains(key)
}

func (pm *PriorityMapCore[S, T, P, C]) UnorderedKeysAndValues() ([]S, []T) {
    keys := make([]S, pm.Len())
    values := make([]T, pm.Len())
    for i, pmItem := range pm.data {
        keys[i] = pmItem.key
        values[i] = pmItem.value
    }
    return keys, values
}

func (pm *PriorityMapCore[S, T, P, C]) Get(key S) (value T, err error) {
    if (pm.Contains(key)) {
        item := pm.data[pm.index[key]]
        return item.value, nil
    }
    return *new(T), errors.New("PriorityMap does not contain requested key")
}

func (pm *PriorityMapCore[S, T, P, C]) Set(key S, value T, priority P) {
    if (pm.Contains(key)) {
        idx := pm.index[key]
        item := pm.data[idx]
        item.value = value
        item.priority = priority
        heap.Fix(&pm.priorityMap, idx)
    } else {
        item := &pmItem[S, T, P]{key, value, priority}
        heap.Push(&pm.priorityMap, item)
    }
}

func (pm *PriorityMapCore[S, T, P, C]) SetValue(key S, value T) error {
    if (!pm.Contains(key)) {
        return errors.New("Tried to update value in PriorityMap for key which is not present")
    }
    pm.data[pm.index[key]].value = value
    return nil
}

func (pm *PriorityMapCore[S, T, P, C]) SetPriority(key S, priority P) error {
    if (!pm.Contains(key)) {
        return errors.New("Tried to update priority in PriorityMap for key which is not present")
    }
    pm.data[pm.index[key]].priority = priority
    heap.Fix(&pm.priorityMap, pm.index[key])
    return nil
}

func (pm *PriorityMapCore[S, T, P, C]) Peek() (S, T, P, error) {
    if (pm.Len() == 0) {
        return *new(S), *new(T), *new(P), errors.New("Tried to peek on empty PriorityMap")
    }
    item := pm.data[0]
    return item.key, item.value, item.priority, nil
}

func (pm *PriorityMapCore[S, T, P, C]) Remove(key S) error {
    if (!pm.Contains(key)) {
        return errors.New("Tried to remove key which is not present in PriorityMap")
    }
    heap.Remove(&pm.priorityMap, pm.index[key])
    delete(pm.index, key)
    return nil
}

func (pm *PriorityMapCore[S, T, P, C]) Pop() (S, T, P, error) {
    if (pm.Len() == 0) {
        return *new(S), *new(T), *new(P), errors.New("Tried to peek on empty PriorityMap")
    }
    item := pm.data[0]
    pm.Remove(item.key)
    return item.key, item.value, item.priority, nil
}

/////////////// internal interface ////////////////
func (pm *priorityMap[S, T, P, C]) Less(i, j int) bool {
    return pm.comp.less(pm.data[i].priority, pm.data[j].priority)
}

func (pm *priorityMap[S, T, P, C]) Len() int {
    return len(pm.data)
}

func (pm *priorityMap[S, T, P, C]) Swap(i, j int) {
    pm.data[i], pm.data[j] = pm.data[j], pm.data[i]
    pm.index[pm.data[i].key] = i
    pm.index[pm.data[j].key] = j
}

func (pm *priorityMap[S, T, P, C]) Contains(key S) bool {
    _, contains := pm.index[key]
    return contains
}

// ONLY USE WHEN THE KEY IS NEW
func (pm *priorityMap[S, T, P, C]) Push(x any) {
    y := x.(*pmItem[S, T, P])
    // Note: because this is internal, it should never be the case that the
    //  key is already present.
    if (!pm.Contains(y.key)) {
        pm.index[y.key] = len(pm.data)
        pm.data = append(pm.data, y)
    }
}

func (pm *priorityMap[S, T, P, C]) Pop() any {
    idx := len(pm.data) - 1
    item := pm.data[idx]
    pm.data[idx] = nil  // Supposedly this is needed for the garbage collector
    delete(pm.index, item.key)
    pm.data = pm.data[0:idx]
    return item
}
