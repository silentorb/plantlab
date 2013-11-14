/// <reference path="metahub.d.ts" />
/// <reference path="ground.d.ts" />
/// <reference path="vineyard.d.ts" />
/// <reference path="lawn.d.ts" />
/// <reference path="buster.d.ts" />
/// <reference path="socket.io.d.ts" />
/// <reference path="node.d.ts" />
declare var socket_manager: {};
declare class PlantLab {
    public ground: Ground.Core;
    public vineyard: Vineyard;
    public server: Lawn;
    public sockets: any[];
    constructor(config_path: string);
    public close(): void;
    public create_socket();
    public test(name: string, tests): void;
}
declare module PlantLab {
    class Fixture {
        public ground;
        public all(): Promise;
        public prepare_database(): Promise;
        public populate(): Promise;
        public clear_file_folders(): Promise;
        public insert_object(trellis, data): Promise;
        public empty_folder(folder): Promise;
    }
}
declare module "plantlab" {
  export = PlantLab
}