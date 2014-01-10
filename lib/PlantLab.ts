//declare function require(name: string): any;

/// <reference path="references.ts"/>

//var io = require('socket.io-client')
declare var buster:any
declare var io:any

class PlantLab {
  ground:Ground.Core
  vineyard:Vineyard
  server:Lawn
  sockets = []
  main_socket
  http_config

  constructor(config_path:string) {
    var vineyard = this.vineyard = new Vineyard(config_path)
    this.server = vineyard.bulbs.lawn
    this.ground = vineyard.ground
    if (process.argv.indexOf('-d') > -1)
      this.ground.db.log_queries = true
  }

  stop() {
    if (this.server) {
      console.log('stopping server')
      this.server.stop()
    }

    for (var s in this.sockets) {
      if (this.sockets[s]) {
        console.log('Disconnecting client socket: ', this.sockets[s].socket.sessionid)
        this.sockets[s].disconnect()
      }
    }

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

  start() {
    this.vineyard.start()
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

  login_http(name:string, pass:string):Promise {
    var def = when.defer()
    var http = require('http')
    var fs = require('fs')
    var path = require('path')
    var options = {
      host: 'localhost',
      port: this.vineyard.config.bulbs.lawn.ports.http,
      path: '/vineyard/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }
    if (this.http_config) {
      options.host = this.http_config.host
      options.port = this.http_config.port
    }

    var req = http.request(options, function (res) {
//      console.log('log-res', res)
      if (res.statusCode != '200') {
        res.setEncoding('utf8')
        res.on('data', function (chunk) {
          console.log('client received an error:', res.statusCode, chunk)
          def.reject()
        })
      }
      else {
        def.resolve(res)
      }
    })

    var data = {
      name: name,
      pass: pass
    }

    req.write(JSON.stringify(data))
    req.end()

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message);
      def.reject()
    })

    return def.promise
  }

  login_socket(name:string, pass:string):Promise {
    var socket = this.create_socket()
    return this.login_http(name, pass)
      .then((res)=> {
        socket.on('error', (data) => {
          console.log('Socket Error', data)
          throw new Error('Error with socket communication.')
        })
        var def = when.defer()
        res.setEncoding('utf8')
        res.on('data', function (json) {
          var data = JSON.parse(json)
//          console.log('data:', data)
          def.resolve(data)
        })
        return def.promise
      })
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