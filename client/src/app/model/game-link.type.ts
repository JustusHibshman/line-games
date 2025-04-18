export type GameLink = {
    gameID:  number | null;
    userID:  number | null;
    inGame:  boolean;
    hosting: boolean | null;
    gameServerIP: string | null;
}
