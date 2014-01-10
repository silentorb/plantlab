/// <reference path="metahub.d.ts" />
/// <reference path="ground.d.ts" />
/// <reference path="vineyard.d.ts" />
/// <reference path="lawn.d.ts" />
/// <reference path="buster.d.ts" />
/// <reference path="socket.io.d.ts" />
/// <reference path="node.d.ts" />
declare var buster: any;
declare var io: any;
declare class PlantLab {
    public ground: Ground.Core;
    public vineyard: Vineyard;
    public server: Lawn;
    public sockets: any[];
    public main_socket: any;
    public http_config: any;
    constructor(config_path: string);
    public stop(): void;
    public create_socket(): any;
    public start(): void;
    public test(name: string, tests: any): void;
    public emit(socket: any, url: any, data: any): Promise;
    public login_http(name: string, pass: string): Promise;
    public login_socket(name: string, pass: string): Promise;
}
declare module PlantLab {
    class Fixture {
        public lab: PlantLab;
        public ground: Ground.Core;
        constructor(lab: PlantLab);
        public all(): Promise;
        public prepare_database(): Promise;
        public populate(): Promise;
        public clear_file_folders(folders: any): Promise;
        public insert_object(trellis: any, data: any, user?: any): Promise;
        public empty_folder(folder: any): Promise;
    }
}
declare module "plantlab" {
  export = PlantLab
}