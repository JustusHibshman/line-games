package httpparse

import (
    "fmt"
    "net/http"
    "reflect"
    "strconv"
)

// The functions in this file are adapted from The Go Programming Language
//  by Alan Donovan and Brian Kernighan


// Fills in all struct fields with a tag specified by `tag` with the
//  corresponding param in the http request url
//
// Handles strings, integers, booleans, and slices of the aforementioned
func HttpParamsToStruct(r *http.Request, s interface{}, tag string) error {
    if err := r.ParseForm(); err != nil {
        return err
    }
    return fillStructWithStringsMap(r.Form, s, tag)
}

// Fills in all struct fields with a tag specified by `tag` with the
//  corresponding string value(s) in the map. Formats the strings according to
//  the target type.
//
// Handles strings, integers, booleans, and slices of the aforementioned
func fillStructWithStringsMap(m map[string][]string, s interface{}, tag string) error {

    fields := make(map[string]reflect.Value)
    sVal := reflect.ValueOf(s).Elem()
    for i := 0; i < sVal.NumField(); i++ {
        fieldInfo := sVal.Type().Field(i)  // Metadata on the i'th field of s's type
        fieldTags := fieldInfo.Tag         // Metadata on the i'th field of s's type's tags
        name := fieldTags.Get(tag)         // The specific tag value of tag with name `tag`
        if name == "" {  // No tag value for this field, or empty string tag value
            continue
        }
        fields[name] = sVal.Field(i)  // Essentially a pointer to the field

        // Double check that the field is present in the map
        if _, check := m[name]; !check {
            return fmt.Errorf("Missing value for %s tag %s", tag, name)
        }
    }

    // Double check that only the required fields are present in the map
    for name, _ := range m {
        if _, check := fields[name]; !check {
            return fmt.Errorf("Unknown %s tag name '%s'", tag, name)
        }
    }

    for name, values := range m {
        field := fields[name]
        for _, value := range values {
            if field.Kind() == reflect.Slice {
                // Fill an element which we will append to f
                elem := reflect.New(field.Type().Elem()).Elem()
                if err := populate(elem, value); err != nil {
                    return fmt.Errorf("Error populating %s tag %s: %v", tag, name, err)
                }
                field.Set(reflect.Append(field, elem))
            } else {
                if len(values) > 1 {
                    return fmt.Errorf("Attempted to fill single value for %s tag %s with slice", tag, name)
                }
                // Fill f directly
                if err := populate(field, value); err != nil {
                    return fmt.Errorf("Error populating %s tag %s: %v", tag, name, err)
                }
            }
        }
    }

    return nil
}

func populate(value reflect.Value, s string) error {
    switch value.Kind() {
    case reflect.String:
        value.SetString(s)

    case reflect.Int:
        i, err := strconv.ParseInt(s, 10, 64)
        if err != nil {
            return err
        }
        value.SetInt(i)
    
    case reflect.Bool:
        b, err := strconv.ParseBool(s)
        if err != nil {
            return err
        }
        value.SetBool(b)

    default:
        if value.Type().String() == "int64" {
            i, err := strconv.ParseInt(s, 10, 64)
            if err != nil {
                return err
            }
            value.SetInt(i)
        } else {
            fmt.Errorf("Unsupported type %s", value.Type())
        }
    }

    return nil
}
