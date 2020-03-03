module.exports = class Connection {
    constructor() {
        this.socket;
        this.player;
        this.server;
        this.lobby;
    }

    //Handles all our io events and where we should route them too to be handled
    createEvents() {
        let connection = this;
        let socket = connection.socket;
        let server = connection.server;
        let player = connection.player;

        socket.on('disconnect', function() {
            server.onDisconnected(connection);
        });

        socket.on('joinGame', function() {
            server.onAttemptToJoinGame(connection);
        });

        socket.on('onButtonDown', function(data){
            player.button = data.button;
            console.log(player.button);
            
            socket.broadcast.to(connection.lobby.id).emit('buttonDown', player);
        });

        socket.on('UpdatePosition', function(data){
            player.position.x = data.positionX;
            player.position.y = data.positionY;
            player.position.z = data.positionZ;
            //console.log(player.id + ": " +player.position.x+", "+ player.position.y);
            
            socket.broadcast.to(connection.lobby.id).emit('UpdatePosition', player);
        });
    }
}