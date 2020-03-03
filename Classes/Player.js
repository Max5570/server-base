var shortID = require('shortid');
var Vector2 = require('./Vector2.js');

module.exports = class Player {
    constructor() {
        this.username = 'Default_Player';
        this.id = shortID.generate();
        this.lobby = 0;
        this.position = new Vector2();
        this.button = new Number(100);

        this.tankRotation = new Number(0);
        this.barrelRotation = new Number(0);
        this.health = new Number(100);
        this.isDead = false;
        this.respawnTicker = new Number(0);
        this.respawnTime = new Number(0);
    }

    displayerPlayerInformation() {
        let player = this;
        return '(' + player.username + ':' + player.id + ')';
    }

}