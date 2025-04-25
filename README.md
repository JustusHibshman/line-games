# Line Games

This project is currently under development. It's a server and browser client for playing line-forming games like Tic-Tac-Toe, Pente, Link Four, etc.

The goal is to eventually have all of the following features.

## (Eventual) Features

### Gameplay Choices

 - Custom grid size
 - Custom line length win requirement
 - Option to include "gravity," like in Connect Four
 - Option to allow "captures," like in Pente
 - Custom capture size
 - Custom number of captures to win (if any)

### Opponents

 - Hotseat option
 - AI opponent
 - Online multiplayer
 - Any mix of the above
 - Up to 6 players

## Development Phases

 - [ ] Phase I: Client interface with working hotseat and in-browser AI
 - [ ] Phase II: Back end for online multiplayer -- will also broadcast the host's client AI moves
 - [ ] Phase III: Move AI to the back end; make it more powerful and efficient


## Technical Implementation

### Browser Client

 - Angular app

The client tracks which moves are legal, whether someone has won, etc.

### Server Architecture

 - Content servers for the browser client
 - Single entry point server for game participation
    - Gives player a game ID upon game creation
    - Assigns created game to a specific game server
    - Gives players a player ID upon game creation or upon requesting to join a game
    - Primitive DDOS protection via tracking IP address requests-per-second
 - Game servers
    - Communicate between human players and AI servers
    - Only responds to requests with valid game and player IDs
 - Stateless AI servers
    - Pass entire game state to server, receive chosen AI move in return
    - Only responds to requests from parent game server
 - Tech stack
    - Go(lang)
    - AWS
    - Kubernetes
