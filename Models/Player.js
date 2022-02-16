var shortID = require('shortid');

module.exports = class Player {
    constructor() {
        /** Client ID. */
        this.clientID = shortID.generate();
        /** Socket ID. */
        this.socketID = '';
        
        /** RoomID whom player has joined. */
        this.gameRoomID = '';
        /** Player is host of current RoomID or no. */
        this.gameRoomIsHost = false;

        /** DB name. */
        this.name = '';
        /** DB character name. */
        this.characterName = '';
        /** DB character class. */
        this.characterClass = '';
        /** Is player online now. */
        this.isOnline = 0;
        /** DB character gold. */
        this.gold = 0;
        /** DB character diamonds. */
        this.diamond = 0;

        /**
         * Classes which can join room
         */
        this.classesAvailable = ['A', 'B', 'C', 'D']
    }
}