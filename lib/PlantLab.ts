//declare function require(name: string): any;

/// <reference path="references.ts"/>

//var io = require('socket.io-client')
declare var buster:any
declare var io:any

//var Lawn = require('lawn')
var when = require('when')

class PlantLab {
  ground:Ground.Core
  vineyard:Vineyard
  server:Lawn
  sockets = []
  main_socket
  http_config
  http_host
  http_port

  constructor(config_path:string, bulbs = null) {
    var vineyard = this.vineyard = new Vineyard(config_path)
    if (bulbs) {
      for (var i in bulbs) {
        vineyard.load_bulb(bulbs[i])
      }
    }
    else {
      vineyard.load_all_bulbs()
    }

    this.server = vineyard.bulbs.lawn
    this.ground = vineyard.ground
    if (process.argv.indexOf('-d') > -1)
      this.ground.db.log_queries = true

    this.server.debug_mode = true
  }

  stop() {
//    if (this.server) {
//      console.log('stopping server')
//      this.server.stop()
//    }
    this.vineyard.stop()

//    for (var s in this.sockets) {
//      if (this.sockets[s]) {
//        console.log('Disconnecting client socket: ', this.sockets[s].socket.sessionid)
//        this.sockets[s].disconnect()
//      }
//    }

    this.sockets = []
  }

  create_socket() {
    var socket = this.main_socket = io.connect('127.0.0.1:' + this.vineyard.config.bulbs.lawn.ports.websocket, {
      'force new connection': true
    });
    this.sockets.push(socket);
    socket.on('error', function (e) {
      if (typeof e == 'object' && e.advice == 'reconnect') {
        console.log('reconnecting')
        socket.socket.connect()
      }
    })
    return socket;
  }

  start():Promise {
    return this.vineyard.start()
  }

  test(name:string, tests) {
    buster.testCase(name, tests)
  }

  emit(socket, url, data):Promise {
    var def = when.defer()
    socket.emit(url, data, (response)=> {
      console.log('finished:', url)
      def.resolve(response)
    })
    return def.promise
  }

  // Flips error handling around.
  // Resolves true if the server returned an error.
  // Throws an error if the request succeeded.
  // Used to test that the server is throwing errors when it should.
  emit_for_error(socket, url, data):Promise {
    var def = when.defer()
    socket.on_error = (response)=> {
      console.log('finished:', url)
      delete socket.on_error
      def.resolve(response)
    }
    socket.emit(url, data, (response)=> {
      var status = response.status
      if ([400, 401, 403, 404, 500].indexOf(status) > -1)
        def.resolve(response)
      else
        throw new Error("Server returned success when it should have returned an error.")
    })
    return def.promise
  }

  on_socket(socket, event):Promise {
    var def = when.defer()
    var method = (response)=> {
      socket.removeListener(event, method)
      def.resolve(response)
    }
    socket.on(event, method)
    return def.promise
  }

  post(path, data, login_data = null):Promise {
    var def = when.defer()
    var http = require('http')
    var options = {
      host: this.http_host || 'localhost',
      port: this.http_port || this.vineyard.config.bulbs.lawn.ports.http,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (login_data && login_data.cookie)
      options.headers['Cookie'] = login_data.cookie

    if (this.http_config) {
      options.host = this.http_config.host
      options.port = this.http_config.port
    }

    var req = http.request(options, function (res) {
      if (res.statusCode != '200') {
        res.setEncoding('utf8')
        res.on('data', function (chunk) {
          console.log('client received an error:', res.statusCode, chunk)
          def.reject()
        })
      }
      else {
        res.on('data', function (data) {
          res.content = JSON.parse(data)
          def.resolve(res)
        })
      }
    })

    req.write(JSON.stringify(data))
    req.end()

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message);
      def.reject()
    })

    return def.promise
  }

  get_json(path, data, login_data = null):Promise {
    var def = when.defer()
    var http = require('http')
    var options = {
      host: this.http_host || 'localhost',
      port: this.http_port || this.vineyard.config.bulbs.lawn.ports.http,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (login_data && login_data.cookie)
      options.headers['Cookie'] = login_data.cookie

    if (this.http_config) {
      options.host = this.http_config.host
      options.port = this.http_config.port
    }

    var req = http.request(options, function (res) {
      if (res.statusCode != '200') {
        res.setEncoding('utf8')
        res.on('data', function (chunk) {
          console.log('client received an error:', res.statusCode, chunk)
          def.reject()
        })
      }
      else {
//        var buffer = ''
        res.on('data', function (buffer) {
          res.content = JSON.parse(buffer)
          def.resolve(res.content)
//          buffer += chunk
        })

//        res.on('end', function () {
//          def.resolve(res)
//        })
      }
    })

    req.end()

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message);
      def.reject()
    })

    return def.promise
  }

  login_http(name:string, pass:string):Promise {
    var data = {
      name: name,
      pass: pass
    }

    return this.post('/vineyard/login', data)
      .then((res)=> {
        var data = res.content
        var cookie = res.headers["set-cookie"]
        if (cookie) {
          data.cookie = (cookie + "").split(";").shift()
        }
//          console.log('data:', data)
        return data
      })
  }

  login_socket(name:string, pass:string):Promise {
    var socket = this.create_socket()
    socket.on('error', (data) => {
      console.log('handler', socket.on_error)
      if (typeof socket.on_error == 'function') {
        socket.on_error(data)
      }
      else {
        console.log('Socket Error', data)
        throw new Error('Error with socket communication.')
      }
    })

    return this.login_http(name, pass)
      .then((data)=> this.emit(socket, 'login', data))
      .then(() => socket)
  }
}

module PlantLab {
  export class Fixture {
    lab:PlantLab
    ground:Ground.Core

    constructor(lab:PlantLab) {
      this.lab = lab
      this.ground = lab.vineyard.ground
    }

    all():Promise {
      return this.prepare_database()
        .then(()=> this.populate())
    }

    prepare_database():Promise {
      var db = this.ground.db;
      return db.drop_all_tables()
        .then(()=> db.create_trellis_tables(this.ground.trellises))
        .then(()=> db.add_non_trellis_tables_to_database(this.ground.tables, this.ground))
    }

    populate():Promise {
      return when.resolve()
    }

    clear_file_folders(folders):Promise {
      return when.all(folders.map((folder)=> this.empty_folder(folder)))
    }

    insert_object(trellis, data, user = null):Promise {
      return this.ground.insert_object(trellis, data, user);
    }

    empty_folder(folder):Promise {
      var fs = require('fs')
      var nodefn = require('when/node/function')
      var path = require('path')

      return nodefn.call(fs.readdir, folder)
        .then((files) => {
          console.log('files', files)
          var promises = files.map((file)=>
              nodefn.call(fs.unlink, path.join(folder, file))
          )

          return when.all(promises)
        })
    }
  }
}