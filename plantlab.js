var MetaHub = require('vineyard-metahub');var Ground = require('vineyard-ground');var Vineyard = require('vineyard');var io = require('socket.io-client');var buster = require("buster");
var when = require('when');

var PlantLab = (function () {
    function PlantLab(config_path, bulbs) {
        if (typeof bulbs === "undefined") { bulbs = null; }
        this.sockets = [];
        var vineyard = this.vineyard = new Vineyard(config_path);
        if (bulbs) {
            for (var i in bulbs) {
                vineyard.load_bulb(bulbs[i]);
            }
            vineyard.finalize();
        } else {
            vineyard.load_all_bulbs();
        }

        this.server = vineyard.bulbs.lawn;
        this.ground = vineyard.ground;
        if (process.argv.indexOf('-d') > -1)
            this.ground.db.log_queries = true;

        this.server.debug_mode = true;
    }
    PlantLab.prototype.stop = function () {
        var _this = this;
        return this.vineyard.stop().then(function () {
            _this.sockets = [];
            if (_this.main_socket) {
                _this.main_socket.disconnect();
                _this.main_socket = null;
            }
        });
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
        if (!this.ground.db.active)
            this.ground.db.start();

        return this.vineyard.start();
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

    PlantLab.prototype.emit_for_error = function (socket, url, data) {
        var def = when.defer();
        socket.on_error = function (response) {
            console.log('finished:', url);
            delete socket.on_error;
            def.resolve(response);
        };
        socket.emit(url, data, function (response) {
            var status = response.status;
            if ([400, 401, 403, 404, 500].indexOf(status) > -1)
                def.resolve(response);
            else
                throw new Error("Server returned success when it should have returned an error.");
        });
        return def.promise;
    };

    PlantLab.prototype.on_socket = function (socket, event) {
        var def = when.defer();
        var method = function (response) {
            socket.removeListener(event, method);
            def.resolve(response);
        };
        socket.on(event, method);
        return def.promise;
    };

    PlantLab.prototype.post = function (path, data, login_data, silent) {
        if (typeof login_data === "undefined") { login_data = null; }
        if (typeof silent === "undefined") { silent = false; }
        var def = when.defer();
        var http = require('http');
        if (path[0] != '/')
            path = '/' + path;

        var options = {
            host: this.http_host || 'localhost',
            port: this.http_port || this.vineyard.config.bulbs.lawn.ports.http,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (login_data && login_data.cookie)
            options.headers['Cookie'] = login_data.cookie;

        if (this.http_config) {
            options.host = this.http_config.host;
            options.port = this.http_config.port;
        }

        var req = http.request(options, function (res) {
            var buffer = '';
            if (res.statusCode != '200') {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    buffer += chunk;
                });

                res.on('end', function () {
                    res.content = buffer.toString();
                    if (!silent)
                        console.log('client received an error:', res.statusCode, res.content);

                    def.reject(res);
                });
            } else {
                res.on('data', function (chunk) {
                    buffer += chunk;
                });

                res.on('end', function () {
                    res.content = JSON.parse(buffer);
                    def.resolve(res);
                });
            }
        });

        req.write(JSON.stringify(data));
        req.end();

        req.on('error', function (e) {
            if (!silent)
                console.log('problem with request: ' + e.message);

            def.reject();
        });

        return def.promise;
    };

    PlantLab.prototype.get_json = function (path, login_data) {
        if (typeof login_data === "undefined") { login_data = null; }
        var def = when.defer();
        var http = require('http');
        var options = {
            host: this.http_host || 'localhost',
            port: this.http_port || this.vineyard.config.bulbs.lawn.ports.http,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (login_data && login_data.cookie)
            options.headers['Cookie'] = login_data.cookie;

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
                var buffer = '';
                res.on('data', function (chunk) {
                    buffer += chunk;
                });

                res.on('end', function () {
                    res.content = JSON.parse(buffer);
                    def.resolve(res);
                });
            }
        });

        req.end();

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
            def.reject();
        });

        return def.promise;
    };

    PlantLab.prototype.login_http = function (name, pass) {
        var data = {
            name: name,
            pass: pass
        };

        return this.post('/vineyard/login', data).then(function (res) {
            var data = res.content;
            var cookie = res.headers["set-cookie"];
            if (cookie) {
                data.cookie = (cookie + "").split(";").shift();
            }
            return data;
        });
    };

    PlantLab.prototype.login_socket = function (name, pass) {
        var _this = this;
        var socket = this.create_socket();
        socket.on('error', function (data) {
            console.log('handler', socket.on_error);
            if (typeof socket.on_error == 'function') {
                socket.on_error(data);
            } else {
                console.log('Socket Error', data);
                throw new Error('Error with socket communication.');
            }
        });

        return this.login_http(name, pass).then(function (data) {
            return _this.emit(socket, 'login', data);
        }).then(function () {
            return socket;
        });
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
            db.start();
            return db.drop_all_tables().then(function () {
                return db.create_trellis_tables(_this.ground.trellises);
            }).then(function () {
                return db.add_non_trellis_tables_to_database(_this.ground.custom_tables, _this.ground);
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
//# sourceMappingURL=plantlab.js.map
module.exports = PlantLab