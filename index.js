var io = require('socket.io')(process.env.PORT || 50300);
var Player = require('./Models/Player');
var GameRoomManager = require('./Managers/GameRoomManager');
var DBManager = require('./Managers/DBManager');

console.log('Server has started!');

var gRoomManager = new GameRoomManager(io);
// var dManager = new DBManager();
// dManager.makeAllPlayersOffline((error) => {
//     if (error) {
//         console.log(error);
//     }
// });

io.on('connection', function (socket) {
    console.log('a player has connected');

    var player = new Player();
    player.socketID = socket.id;
    gRoomManager.connect(player);
    socket.emit('connected', player);

    socket.on('disconnect', function () {
        console.log('a player has disconnected');
        // dManager.updatePlayer(player, 'online', 0, (error) => {
        //     console.log(error);
        // });
        gRoomManager.disconnect(player, socket, 'disconnected');
    });

    //
    // DB
    //
    /** Login player in database. */
    socket.on('login', (playerR) => {
        dManager.login(player, playerR.login, playerR.pass, (success, error) => {
            socket.emit('login', { success: success, error: error, player: player });
        });
    });

    /** Register player in database. */
    socket.on('register', (playerR) => {
        dManager.register(playerR.login, playerR.pass, (success, error) => {
            socket.emit('register', { success: success, error: error });
        });
    });

    /** Register player in database. */
    socket.on('checkLoginExist', (playerR) => {
        dManager.checkLoginExist(playerR.login, (success, error) => {
            socket.emit('checkLoginExist', { success: success, error: error });
        });
    });

    /** Get player's resources from database. */
    socket.on('getResources', () => {
        dManager.getRecources(player, (gold, diamond, error) => {
            socket.emit('resourcesCallback', { gold: gold, diamond: diamond });
        });
    });

    socket.on('setResources', (data) => {
        dManager.getRecources(player, (currentGold, currentDiamond, error) => {
            let gold = Number(data.goldValue) + Number(currentGold);
            console.log(data.gold);
            console.log(currentGold);
            let diamond = Number(data.diamondValue) + Number(currentDiamond);
            socket.emit('resourcesCallback', { gold: gold, diamond: diamond });
            console.log(gold);
            console.log(diamond);
            dManager.setRecources(player, "gold", gold, (success, error) => {
                if (error) {
                    console.log(error);
                    return;
                }
                console.log(success);
            });
            dManager.setRecources(player, "diamonds", diamond, (success, error) => {
                if (error) {
                    console.log(error);
                    return;
                }
                console.log(success);
            });
        });
    });

    /**
     * Get player from database (update current player data) or get his without update.
     */
    socket.on('getPlayer', (fromDb) => {
        if (fromDb) {
            dManager.getPlayer(player, (error) => {
                socket.emit('getPlayer', { error: error, player: player });
            });
        }
        else {
            socket.emit('getPlayer', { error: '', player: player });
        }
    });

    /** Update player character name in database. */
    socket.on('setPlayerCharacter', (playerR) => {
        dManager.updatePlayer(player, 'character_name', playerR.characterName, (error) => {
            socket.emit('setPlayerCharacter', { error: error });
        });
    });

    /** Update player is online. */
    socket.on('setPlayerIsOnline', (playerR) => {
        let isOnline = Number(playerR.online);
        
        dManager.updatePlayer(player, 'online', isOnline, (error) => {
            socket.emit('setPlayerIsOnline', { error: error });
        });
    });

    socket.on('makeAllOffline', () => {
        dManager.makeAllPlayersOffline((error) => {
            console.log(error);
        });
    });


    //
    // BATTLE
    //
    socket.on('newMessage', (playerP) => {
        socket.in(player.gameRoomID).broadcast.emit('newMessage', playerP);
    });

    // Set initial parameters for all players in their room after starting the game.
    socket.on('handshake', (playerP) => {
        socket.in(player.gameRoomID).broadcast.emit('handshake', playerP);
    });

    // Get character data.
    socket.on('getCharacterData', (playerP) => {
        socket.in(player.gameRoomID).broadcast.emit('getCharacterData', playerP);
        console.log(playerP);
    });

    //
    //ROOMS
    //
    socket.on('leaveRoom', () => {
        gRoomManager.leaveRoom(player, socket, 'leaveRoom');
    });

    socket.on('searchRoom', (avaiableClasses) => {
        arr = avaiableClasses.data.split('.')
        player.classesAvailable = arr;
        console.log(player.classesAvailable);
        gRoomManager.searchRoom(player, socket, 'searchRoom', 'gameStarted');
    });
});