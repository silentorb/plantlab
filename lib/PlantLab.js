var PlantLab = (function () {
    function PlantLab(config_path) {
        this.sockets = [];
        var vineyard = this.vineyard = new Vineyard(config_path);
        this.server = vineyard.bulbs.lawn;
        this.ground = vineyard.ground;
        if (process.argv.indexOf('-d') > -1)
            this.ground.db.log_queries = true;
    }
    //  start_server() {
    //    this.server.start_sockets()
    //  }
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

    PlantLab.prototype.login_socket = function (name, pass) {
        var _this = this;
        var socket = this.create_socket();
        return this.login_http(name, pass).then(function () {
            return _this.login_http('phil', 'test');
        }).then(function (res) {
            socket.on('error', function (data) {
                console.log('Socket Error', data);
                throw new Error('Error with socket communication.');
            });
            var def = when.defer();
            res.setEncoding('utf8');
            res.on('data', function (json) {
                var data = JSON.parse(json);

                //          console.log('data:', data)
                def.resolve(data);
            });
            return def.promise;
        }).then(function (data) {
            return _this.emit(socket, 'login', data);
        }).then(function () {
            return socket;
        });
    };
    return PlantLab;
})();
//# sourceMappingURL=PlantLab.js.map
