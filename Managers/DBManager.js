var mysql = require('mysql');
var Player = require('../Models/Player');

var pool = mysql.createPool({
    connectionLimit: 100,
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'lsd'
});

const Errors = {
    connect: 'DB: connection error',
    query: 'DB: query error'
}

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

module.exports = class DBManager {

    /** Login in db for current user.
     * @param {Player} player current player.
     * @param {string} name login name.
     * @param {string} pass pass.
     * @param {function(boolean, string)} callback login completed (arg0: success, arg1: error message).
     */
    login(player, name, pass, callback) {
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(Errors.connect + ': ' + error.stack);
                callback(false, Errors.connect);
                return;
            }

            connection.query("SELECT * FROM `users` WHERE name = '" + name + "' AND pass = '" + pass + "'", (error, result, fields) => {
                connection.release();
                if (error) {
                    console.log('DB login Error: ' + error.stack);
                    callback(false, Errors.query);
                    return;
                }
                console.log('a user connected to DB with threadID: ' + connection.threadId);

                var arrResult = Array.from(result);
                if (arrResult && arrResult.length > 0) {
                    player.name = arrResult[0].name;
                    player.characterName = arrResult[0].character_name;

                    player.isOnline = arrResult[0].online;
                    callback(true, '');
                }
                else {
                    callback(false, '');
                }
            });
        });
    }

    /** Login in db for current user.
     * @param {string} name register name.
     * @param {string} pass pass.
     * @param {function(boolean, string)} callback register completed (arg0: success, arg1: error message).
     */
    register(name, pass, callback) {
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(Errors.connect + ': ' + error.stack);
                callback(false, Errors.connect);
                return;
            }

            connection.query("INSERT INTO `users`(name, pass) VALUES('" + name + "', '" + pass + "')", (error, result, fields) => {
                connection.release();
                if (error) {
                    console.log('DB register Error: ' + error.stack);

                    var userAlreadyExixsts = error.code == "ER_DUP_ENTRY";
                    callback(false, userAlreadyExixsts ? '' : Errors.query);
                    return;
                }

                callback(true, '');
            });
        });
    }
    
    checkLoginExist(login, callback)
    {
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(Errors.connect + ': ' + error.stack);
                callback(false, Errors.connect);
                return;
            }

            connection.query("SELECT * FROM `users` WHERE name = '" + login + "'", (error, result) => {
                connection.release();
                if (error) {
                    callback(false, Errors.query);
                    return;
                }
                var arrResult = Array.from(result);
                if (arrResult && arrResult.length > 0) {
                    console.log('Login: '+ login + ' exists');
                    callback(true, '');
                }
                else {
                    console.log('Login: '+ login + ' not exist');
                    callback(false, '');
                }
                
            });
        });
    }

    /**
     * Get current player from database.
     * @param {Player} player current player.
     *  @param {function(string)} callback completed (arg0: error message).
     */
    getPlayer(player, callback) {
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(Errors.connect + ': ' + error.stack);
                callback(Errors.connect);
                return;
            }

            connection.query("SELECT * FROM `users` WHERE name = '" + player.name + "'", (error, result, fields) => {
                connection.release();
                if (error) {
                    console.log('DB get player Error: ' + error.stack);
                    callback(Errors.query);
                    return;
                }

                var arrResult = Array.from(result);
                if (arrResult && arrResult.length > 0) {
                    player.name = arrResult[0].name;
                    player.characterName = arrResult[0].character_name;
                    player.characterClass = characterList[player.characterName];
                    player.isOnline = arrResult[0].online;
                    callback('');
                }
                else {
                    callback('');
                }
            });
        });
    }

    /** Update current player in database.
   * @param {Player} player current player.
    * @param {string} fieldName DB field name.
    * @param {string} fieldValue DB field value.
    * @param {function(string)} callback completed (arg0: error message).
    */
    updatePlayer(player, fieldName, fieldValue, callback) {
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(Errors.connect + ': ' + error.stack);
                callback(Errors.connect);
                return;
            }

            connection.query("UPDATE `users` SET " + fieldName + " = '" + fieldValue + "' WHERE name = '" + player.name + "'", (error, result, fields) => {
                connection.release();
                if (error) {
                    console.log('DB update player data Error: ' + error.stack);
                    callback(Errors.query);
                    return;
                }

                callback('');
            });
        });
    }

    makeAllPlayersOffline(callback) {
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(Errors.connect + ': ' + error.stack);
                callback(Errors.connect);
                return;
            }
            let fieldValue = 0;
            let fieldValue2 = 1;

            connection.query("UPDATE `users` SET " + "online" + " = '" + fieldValue + "' WHERE online = '" + fieldValue2 + "'", (error, result, fields) => {
                connection.release();
                if (error) {
                    console.log('DB update player data Error: ' + error.stack);
                    callback(Errors.query);
                    return;
                }

                callback('');
            });
        });
    }
    //ALTER TABLE resourses ADD gold mediumint(8)
    getRecources(player, callback) {
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(Errors.connect + ': ' + error.stack);
                callback(Errors.connect);
                return;
            }

            connection.query("SELECT * FROM `users` WHERE name = '" + player.name + "'", (error, result, fields) => {
                connection.release();
                if (error) {
                    console.log('DB get player Error: ' + error.stack);
                    callback(Errors.query);
                    return;
                }

                var arrResult = Array.from(result);
                if (arrResult && arrResult.length > 0) 
                {
                    player.gold = arrResult[0].gold;
                    player.diamond = arrResult[0].diamonds;
                    callback(player.gold, player.diamond);
                }
                else {
                    callback('');
                }
            });
        });
    }

    setRecources(player, fieldName, fieldValue, callback) {
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(Errors.connect + ': ' + error.stack);
                callback(Errors.connect);
                return;
            }

            connection.query("UPDATE `users` SET " + fieldName + " = '" + fieldValue + "' WHERE name = '" + player.name + "'", (error, result, fields) => {
                connection.release();
                if (error) {
                    console.log('DB update player data Error: ' + error.stack);
                    callback(Errors.query);
                    return;
                }
                
                callback(fieldName + ": " + fieldValue);
            });
        });
    }
}