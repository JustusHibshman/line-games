package dbconn

import (
    "database/sql"
    "fmt"
    _ "github.com/lib/pq"
    "log"
    "os"
    "sync"
    "time"
)
 
// Default values for postgres database
const (
    port     = 5432
    user     = "postgres"
    dbName   = "postgres"
    dbType   = "postgres"
)

var db *sql.DB
var disconnected bool = true
var connectAttempts int = 0
var connectionLock sync.Mutex

// runs the normal sql.Exec, except that this function makes one
//  or two attempts to reconnect to the database if the connection is broken
func Exec(query string) (sql.Result, error) {
    return perform[sql.Result](execDB, query)
}

// runs the normal sql.Query, except that this function makes one
//  or two attempts to reconnect to the database if the connection is broken
func Query(query string) (*sql.Rows, error) {
    return perform[*sql.Rows](queryDB, query)
}

// Connect to the database and create the required tables if they are not
//  present
func init() {
    // Do nothing until we are connected
    //
    // Since intialization is serial, we do not need to worry about
    //  concurrency here
    connected := checkIfConnected()
    for !connected {
        attemptToConnect()
        time.Sleep(time.Second / 2)
        connected = checkIfConnected()
        if !connected {
            time.Sleep(time.Second / 2)
        }
    }
}

func checkIfConnected() bool {
    connectionLock.Lock()
    defer connectionLock.Unlock()
    if disconnected {
        return false
    }
    err := db.Ping()
    disconnected = err != nil
    return !disconnected
}

func getDB() *sql.DB {
    connectionLock.Lock()
    defer connectionLock.Unlock()
    return db
}

// Returns the connected database if successful (or if already connected)
func attemptToConnect() (*sql.DB, error) {
    var err error

    connectionLock.Lock()
    defer connectionLock.Unlock()
    if !disconnected {
        return db, nil
    }

    connectAttempts += 1
    log.Printf("(Re)Connection attempt #%d\n", connectAttempts)

    if db != nil {
        db.Close()
        db = nil
    }

    host := os.Getenv("DATABASE_HOST")
    password_file := os.Getenv("POSTGRES_PASSWORD_FILE")

    var password []byte
    password, err = os.ReadFile(password_file)
    if err != nil {
        return nil, err
    }
    passwordString := string(password)

    // connection string
    psqlconn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
                            host, port, user, passwordString, dbName)

    var attempt *sql.DB
    attempt, err = sql.Open(dbType, psqlconn)
    if err != nil {
        return nil, err
    }
    db = attempt
    disconnected = false
    log.Printf("Attempt succeeded. Resetting connect attempts counter.\n")
    connectAttempts = 0
    return db, nil
}

func execDB(db *sql.DB, q string) (sql.Result, error) {
    return db.Exec(q)
}

func queryDB(db *sql.DB, q string) (*sql.Rows, error) {
    return db.Query(q)
}

// like the normal sql.Exec or sql.Query, except that this function makes one
//  or two attempts to reconnect to the database if the connection is broken
func perform[T any](op func(db *sql.DB, q string) (T, error),
             query string) (T, error) {

    var err error
    var result T

    var tempDB = getDB()
    if tempDB == nil {
        // Another thread tried and failed to reconnect.
        tempDB, err = attemptToConnect()
        if err != nil {
            return result, err
        }
    }

    result, err = op(tempDB, query)
    if err == nil {
        return result, nil
    }
    connected := checkIfConnected()
    if connected {
        return result, err
    }
    tempDB, err = attemptToConnect()
    if err != nil {
        return result, err
    }
    return op(tempDB, query)
}
