
var GameRoom = require('../Models/GameRoom');
var Player = require('../Models/Player');

/**
 * All players in the server.
 * @type {[Player]}
 */
var players;

/** Reference on server. 
 * @type {SocketIO.Server}
*/
var io;

var characterList = {
    'KNIGHT' : 'A',
    'WIZARD' : 'A',
    'BOXER' : 'A',
    'ELF' : 'A',
    'BERSERK' : 'B',
    'MAGICAN' : 'B',
    'SHOOTER' : 'B',
    'FOREST KEEPER' : 'B',
    'WARLORD' : 'C',
    'ANGEL' : 'C',
    'BEAST' : 'C',
    'ROGALIC' : 'C',
    'COMBAT BEAR' : 'D',
    'SPIRIT' : 'D',
    'MONKEY KING' : 'D',
    'SUCCUBUS' : 'D',
    'GUNNER' : 'E',
    'LADY CASTER' : 'E',
    'LICH' : 'E',
    'LOKI' : 'E',
};

module.exports = class GameRoomManager {
    /**
    * @param {SocketIO.Server} ioRef
    */
    constructor(ioRef) {
        io = ioRef;
        players = [];
    };

    //
    // Emit socket.
    //

    /**
     * Add new player to players array when a new player is connected to socket.
     * @param {Player} player new player.
     */
    connect(player) {
        players[player.socketID] = player;
    }

    /**
     * Search available room or create own room for current player.
     * @param {Player} player current player.
     * @param {SocketIO.Socket} socket  socket of current player.
     * @param {string} emitNameSearchRoom name of searchRoom socket emit action.
     * @param {string} emitNameGameStarted name of gameStarted socket emit action.
     */
    searchRoom(player, socket, emitNameSearchRoom, emitNameGameStarted) {
        // Try connect to available room
        var gameRoomID = getAvailableRoomForJoin(player);
        // Create own available room.
        player.gameRoomIsHost = false;
        if (!gameRoomID) {
            gameRoomID = player.clientID;
            player.gameRoomIsHost = true;
            console.log(player.characterName);
        }

        
        // Try connect to available room
        socket.join(gameRoomID, function () {
            player.gameRoomID = gameRoomID;

            // Tell myself I joined to this room.
            socket.emit(emitNameSearchRoom, player);

            // Tell other I joined to our room.
            socket.in(player.gameRoomID).broadcast.emit(emitNameSearchRoom, player);

            // Tell myself about everyone else in this room.
            for (var playerID in players) {
                var otherPlayer = players[playerID];
                if (player.socketID != otherPlayer.socketID && otherPlayer.gameRoomID == player.gameRoomID) {
                    socket.emit(emitNameSearchRoom, { player: otherPlayer });
                }
            }

            if (isPlayersGameRoomReadyToStart(player)) {
                socket.emit(emitNameGameStarted);
                socket.in(player.gameRoomID).broadcast.emit(emitNameGameStarted);
            }

            // monitoringRooms();
        });
    }

    /**
     * Leave room for current player and other players in the player's room.
     * @param {Player} player current player.
     * @param {SocketIO.Socket} socket socket of current player.
     * @param {string} emitNameLeaveRoom name of spawn socket emit action.
     */
    leaveRoom(player, socket, emitNameLeaveRoom) {
        socket.leave(player.gameRoomID, () => {

            socket.in(player.gameRoomID).broadcast.emit(emitNameLeaveRoom, player);
            socket.leave(player.gameRoomID, () => {
                player.gameRoomID = '';
                player.gameRoomIsHost = false;
                socket.emit(emitNameLeaveRoom, player);
                monitoringRooms();
                console.log('player ' + player.clientID + ' has left his room');
            });
        });
    }

    /**
     * When current player disconnected then delete him from players array and kick other players from the player's room.
     * @param {Player} player current player.
     * @param {SocketIO.Socket} socket socket of current player.
     * @param {string} emitNameDisconnected name of disconnected socket emit action.
     */
    disconnect(player, socket, emitNameDisconnected) {
        delete players[player.socketID];
        socket.in(player.gameRoomID).broadcast.emit(emitNameDisconnected, player);

        monitoringRooms();
        kickAllPlayersFromRoom(player, () => {
            monitoringRooms();
        });
    }
}

//
// Private.
//

/**
 * Checking the readiness of the player's game room to start.
 * @param {Player} player current socket's player.
 * @returns {Boolean} gameRoom ready to start.
 */
function isPlayersGameRoomReadyToStart(player) {
    var rooms = gameRooms();
    return rooms.find((room) => {
        return room.id == player.gameRoomID && room.players.length == 2;
    });
}

/**
* If exists room where player count < 2 and count rooms whom player connected < 2 then return first available socketID (roomID) except current player else return null.
* @param {Player} player current player.
* @returns {string} avaiable roomID for join.
*/
function getAvailableRoomForJoin(player) {
    characterClass = characterList[player.characterName]
    var rooms = gameRooms();
    for (var roomID in rooms) {
        var room = rooms[roomID];

        if (player.gameRoomID != room.id) {
            if (room.players.length < 2 && room.players[0].classesAvailable.indexOf(characterClass) > -1) {
                console.log(characterClass);
                console.log(room.players[0].classesAvailable);
                return room.id;
            }
        }
    }
    return null;
}

/**
* Get game rooms with the players.
* @returns {[GameRoom]} game rooms.
*/
function gameRooms() {
    var gameRoomsIDs = [];
    for (var playerID in players) {
        var existingRoomID = gameRoomsIDs.filter((roomID) => {
            return roomID == players[playerID].gameRoomID;
        });

        if (players[playerID].gameRoomID && existingRoomID.length < 1) {
            gameRoomsIDs.push(players[playerID].gameRoomID);
        }
    }

    var gameRooms = [];
    gameRoomsIDs.forEach((gameRoomID) => {

        var gameRoom = new GameRoom();
        gameRoom.id = gameRoomID;

        for (var playerID in players) {
            if (gameRoomID == players[playerID].gameRoomID) {
                gameRoom.players.push(players[playerID]);
            }
        }

        gameRooms.push(gameRoom);
    });

    return gameRooms;
}

/**
  * Kick all players out of player's room if a player left his room.
  * @param {Player} player some player who left his room.
  * @param {function?} fn  An optional callback to call after this function completes.
  */
function kickAllPlayersFromRoom(player, fn) {
    var rooms = gameRooms();
    rooms.forEach((room) => {
        if (room.id == player.gameRoomID) {
            room.players.forEach((roomPlayer) => {
                var roomPlayerSocket = io.sockets.connected[roomPlayer.socketID];
                roomPlayerSocket.leave(room.id, () => {
                    console.log("player: " + roomPlayer.clientID + " has kicked from room: " + room.id + " because " + (player.gameRoomIsHost ? "host" : "opponent") + " left this room");
                    roomPlayer.gameRoomID = '';
                    roomPlayer.gameRoomIsHost = false;
                    fn();
                });
            });
        };
    });
}

/**
 * Monitoring availables rooms for test.
 */
function monitoringRooms() {
    console.log('---');
    console.log("global rooms:");
    var globalRooms = io.sockets.adapter.rooms;
    console.log(Object.keys(globalRooms));
    for (var roomID in globalRooms) {
        console.log(globalRooms[roomID]);
    }
    console.log('---');

    console.log('game rooms:');
    // for (var playerID in players) {
    //     var player = players[playerID];
    //     console.log(player);
    // }
    // console.log('| |');

    var jRooms = JSON.stringify(gameRooms(), null, 2);

    console.log(jRooms);
    console.log('---');
}