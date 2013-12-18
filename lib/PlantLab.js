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
        var socket = io.connect('127.0.0.1:' + this.vineyard.config.bulbs.lawn.ports.websocket, {
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
                console.log('res', res);
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
//# sourceMappingURL=PlantLab.js.map
