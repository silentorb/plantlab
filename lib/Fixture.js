/// <reference path="references.ts"/>
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
//# sourceMappingURL=Fixture.js.map
