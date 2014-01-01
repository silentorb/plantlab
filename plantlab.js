var MetaHub = require('metahub');var Ground = require('ground');var Vineyard = require('vineyard');var Ground = require('ground');var when = require('when');var io = require('socket.io-client');var buster = require("buster");var PlantLab = (function () {
    function PlantLab(config_path) {
        this.sockets = [];
        var vineyard = this.vineyard = new Vineyard(config_path);
        this.server = vineyard.bulbs.lawn;
        this.ground = vineyard.ground;
        if (process.argv.indexOf('-d') > -1)
            this.ground.db.log_queries = true;
    }
    PlantLab.prototype.stop = function () {
        if (this.server) {
            console.log('stopping server');
            this.server.stop();
        }

        for (var s in this.sockets) {
            console.log('Disconnecting client socket: ', this.sockets[s].socket.sessionid);
            this.sockets[s].disconnect();
        }
    };

    PlantLab.prototype.create_socket = function () {
        var socket = this.main_socket = io.connect('127.0.0.1:' + this.vineyard.config.bulbs.lawn.ports.websocket, {
            'force new connection': true
        });
        this.sockets.push(socket);
        socket.on('error', function (e) {
            if (typeof e == 'object' && e.advice == 'reconnect') {
                console.log('reconnecting');
                socket.socket.connect();
            }
        });
        return socket;
    };

    PlantLab.prototype.start = function () {
        this.vineyard.start();
    };

    PlantLab.prototype.test = function (name, tests) {
        buster.testCase(name, tests);
    };

    PlantLab.prototype.emit = function (socket, url, data) {
        var def = when.defer();
        socket.emit(url, data, function (response) {
            console.log('finished:', url);
            def.resolve(response);
        });
        return def.promise;
    };

    PlantLab.prototype.login_http = function (name, pass) {
        var def = when.defer();
        var http = require('http');
        var fs = require('fs');
        var path = require('path');
        var options = {
            host: 'localhost',
            port: this.vineyard.config.bulbs.lawn.ports.http,
            path: '/vineyard/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (this.http_config) {
            options.host = this.http_config.host;
            options.port = this.http_config.port;
        }

        var req = http.request(options, function (res) {
            if (res.statusCode != '200') {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    console.log('client received an error:', res.statusCode, chunk);
                    def.reject();
                });
            } else {
                def.resolve(res);
            }
        });

        var data = {
            name: name,
            pass: pass
        };

        req.write(JSON.stringify(data));
        req.end();

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
            def.reject();
        });

        return def.promise;
    };
    return PlantLab;
})();
var PlantLab;
(function (PlantLab) {
    var Fixture = (function () {
        function Fixture(lab) {
            this.lab = lab;
            this.ground = lab.vineyard.ground;
        }
        Fixture.prototype.all = function () {
            var _this = this;
            return this.prepare_database().then(function () {
                return _this.populate();
            });
        };

        Fixture.prototype.prepare_database = function () {
            var _this = this;
            var db = this.ground.db;
            return db.drop_all_tables().then(function () {
                return db.create_trellis_tables(_this.ground.trellises);
            }).then(function () {
                return db.add_non_trellis_tables_to_database(_this.ground.tables, _this.ground);
            });
        };

        Fixture.prototype.populate = function () {
            return when.resolve();
        };

        Fixture.prototype.clear_file_folders = function (folders) {
            var _this = this;
            return when.all(folders.map(function (folder) {
                return _this.empty_folder(folder);
            }));
        };

        Fixture.prototype.insert_object = function (trellis, data, user) {
            if (typeof user === "undefined") { user = null; }
            return this.ground.insert_object(trellis, data, user);
        };

        Fixture.prototype.empty_folder = function (folder) {
            var fs = require('fs');
            var nodefn = require('when/node/function');
            var path = require('path');

            return nodefn.call(fs.readdir, folder).then(function (files) {
                console.log('files', files);
                var promises = files.map(function (file) {
                    return nodefn.call(fs.unlink, path.join(folder, file));
                });

                return when.all(promises);
            });
        };
        return Fixture;
    })();
    PlantLab.Fixture = Fixture;
})(PlantLab || (PlantLab = {}));
require('source-map-support').install();
//# sourceMappingURL=plantlab.js.map
module.exports = PlantLab