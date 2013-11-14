
/// <reference path="references.ts"/>

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

    insert_object(trellis, data):Promise {
      return this.ground.insert_object(trellis, data);
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