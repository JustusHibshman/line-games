import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { EmptySeats } from '@local-types/empty-seats.type';
import { GameMembership } from '@local-types/game-membership.type';
import { GameListings } from '@local-types/game-listings.type';
import { GameSpec, copyGameSpec } from '@local-types/game-spec.type';
import { Move } from '@local-types/move.type';
import { PlayerType } from '@local-types/player-type.type';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

    // static readonly setupUrl = "http://backend.playlinegames.net"  // Production
    static readonly setupUrl = "http://192.168.49.2:30080"  // Minikube development
    static readonly newGamePath = "/new-game"
    static readonly deleteGamePath = "/delete-game"
    static readonly requestSeatPath = "/request-seat"
    static readonly emptySeatsPath = "/empty-seats"

    // static readonly lobbyUrl = "http://backend.playlinegames.net"  // Production
    static readonly lobbyUrl = "http://192.168.49.2:30081"  // Minikube development
    static readonly lobbyListPath = "/games-list"

    // static readonly playUrl = "http://backend.playlinegames.net"  // Production
    static readonly playUrl = "http://192.168.49.2:30082"  // Minikube development
    static readonly makeMovePath = "/make-move"
    static readonly getMovePath = "/get-move"

    http = inject(HttpClient);

    membership: GameMembership | null = null;
    lastPwd: string = "";
    gameList: GameListings = {gameIDs: [], names: []};

    constructor() {
        try {
            this.loadData();
        }
        catch(e) {
            // Overwrite bad values with whatever is present
            this.saveData();
        }
    }
    static readonly dataPrefix: string = "BACKEND_SERVICE.";
    saveData(): void {
        localStorage.setItem(BackendService.dataPrefix + 'membership', JSON.stringify(this.membership));
        localStorage.setItem(BackendService.dataPrefix + 'lastPwd', this.lastPwd);
    }
    loadData(): void {
        this.membership = JSON.parse(localStorage[BackendService.dataPrefix + 'membership']);
        this.lastPwd = localStorage[BackendService.dataPrefix + 'lastPwd'];
    }

    inGame(): boolean {
        return this.membership !== null;
    }

    getSpec(): GameSpec | null {
        if (this.membership === null) {
            return null;
        }
        return copyGameSpec(this.membership.spec);
    }

    async getGameList(): Promise<GameListings> {
        try {
            this.gameList = await
                firstValueFrom(this.http.post<GameListings>(BackendService.lobbyUrl + BackendService.lobbyListPath, {}
                                                            )); //.subscribe((gl) => { this.gameList = gl; } );
        } catch(e) {
            let result: GameListings = {gameIDs: [], names: []};
            return new Promise<GameListings>(function(resolve, reject) { resolve(result); });
        }
        let result: GameListings = {gameIDs: [...this.gameList.gameIDs],
                                    names:   [...this.gameList.names]};
        return new Promise<GameListings>(function(resolve, reject) { resolve(result); });
    }

    // Returns an array with as many elements as there are players.
    //
    // If the local client is managing a human or an AI for seat i, then entry
    //  i will have the value Human or AI respectively. Otherwise the value for
    //  seat i will be None.
    getSeats(): Array<PlayerType> {
        if (this.membership === null) {
            return []
        }
        var result: Array<PlayerType>;
        result = Array.from({length: this.membership.numPlayers}, () => PlayerType.None)
        for (var s of this.membership.assignedSeats) {
            result[s.seat] = s.type
        }
        return result
    }

    async getEmptySeats(): Promise<Array<number> | null> {
        if (this.membership === null) {
            return new Promise<Array<number> | null>(function(resolve, reject) { resolve(null); });
        }

        var emptySeats: EmptySeats
        try {
            emptySeats = await
                firstValueFrom(this.http.post<EmptySeats>(BackendService.setupUrl + BackendService.emptySeatsPath,
                                                            {gameID: this.membership.gameID,
                                                             playerID: this.membership.assignedSeats[0].userID}
                                                            ));
        } catch(e) {
            return new Promise<Array<number> | null>(function(resolve, reject) { resolve(null); });
        }
        return new Promise<Array<number> | null>(function(resolve, reject) { resolve(emptySeats.indices); });
    }

    // Returns true iff successful
    async createGame(name: string, password: string,
                     gSpec: GameSpec, playerTypes: Array<PlayerType>): Promise<boolean> {
        if (this.membership !== null) {
            await this.quitGame();
        }

        this.lastPwd = password;

        let success = true;
        try {
            this.updateMembership(await
                firstValueFrom(this.http.post<GameMembership>(BackendService.setupUrl + BackendService.newGamePath,
                                                 {name: name, password: password,
                                                  spec: gSpec, seatTypes: playerTypes}
                                                 ))); //.subscribe(this.updateMembership);
        } catch(e) {
            success = false;
        }
        return new Promise<boolean>(function(resolve, reject) { resolve(success); });
    }

    // Returns true iff successful
    async joinGame(gameID: BigInt, password: string): Promise<boolean> {
        if (this.membership !== null) {
            await this.quitGame();
        }

        this.lastPwd = password;

        let success = true;
        try {
            this.updateMembership(await firstValueFrom(
                this.http.post<GameMembership>(BackendService.setupUrl + BackendService.requestSeatPath,
                                                 {gameID: gameID, password: password}
                                                ))); //.subscribe(this.updateMembership);
        } catch(e) {
            success = false;
        }
        return new Promise<boolean>(function(resolve, reject) { resolve(success); });
    }

    // Sets `membership` to null regardless of whether or not the server reports
    //  a successful deletion.
    async quitGame() {
        if (this.membership === null) {
            return
        }

        try {
            // We still subscribe to simplify logic about sequential order of events
            await firstValueFrom(this.http.post(BackendService.setupUrl + BackendService.deleteGamePath,
                                 {gameID: this.membership.gameID,
                                  playerID: this.membership.assignedSeats[0].userID}
                                 ));
        } catch(e) {

        }
        this.membership = null;
        this.saveData();
    }

    // Returns true iff successful
    async requestAnotherSeat(): Promise<boolean> {
        if (this.membership === null) {
            return false;
        }

        let success = true;
        try {
            this.updateMembership(await firstValueFrom(
                this.http.post<GameMembership>(BackendService.setupUrl + BackendService.requestSeatPath,
                                                 {gameID: this.membership.gameID, password: this.lastPwd}
                                                ))); //.subscribe(this.updateMembership);
        } catch(e) {
            success = false;
        }
        return new Promise<boolean>(function(resolve, reject) { resolve(success); });
    }

    // Returns true iff successful
    async submitMove(turn: number, m: Move): Promise<boolean> {
        return new Promise<boolean>(function(resolve, reject) { resolve(false) });
    }

    async requestMove(turn: number): Promise<Move | null> {
        return new Promise<Move | null>(function(resolve, reject) { resolve(null); });
    }

    updateMembership(m: GameMembership) {
        if (this.membership === null || this.membership.gameID != m.gameID) {
            this.membership = m;
        }
        else {
            if (this.membership.assignedSeats === undefined || this.membership.assignedSeats === null) {
                this.membership.assignedSeats = m.assignedSeats;
            } else {
                this.membership.assignedSeats = [...this.membership.assignedSeats, ...m.assignedSeats];
            }
        }
        this.saveData();
    }
}
