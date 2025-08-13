# Line Games

This project is a server and browser client for playing line-forming games like Tic-Tac-Toe, Pente, Link Four, etc.

It currently is in a beta release state and can be accessed at [playlinegames.net](https://playlinegames.net).

## Features

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

 - [x] Phase I: Client interface with working hotseat and in-browser AI
 - [x] Phase II: Back end for online multiplayer -- will also broadcast the host's client AI moves
 - [ ] Phase III: Quality of life features, such as usernames, chat, etc.
 - [ ] Phase IV (Optional): Move AI to the back end; make it more powerful and efficient


## Technical Implementation

### Browser Client

 - Angular app

The client tracks which moves are legal, whether someone has won, etc.

The client hosting the game also calculates the AI moves.

### Server Architecture

 - Content servers for the browser client
 - Single entry point server for game participation
    - Manages creating games, adding players, deleting games, etc.
 - Game servers
    - Handles requests to make moves or learn about moves others made
    - Only responds to requests with valid game and player IDs
 - Tech stack
    - Go(lang)
    - Kubernetes
    - PostgreSQL
    - Hosted on Digital Ocean
