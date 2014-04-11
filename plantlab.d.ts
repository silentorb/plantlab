/// <reference path="../vineyard-lawn/lawn.d.ts" />
/// <reference path="defs/buster.d.ts" />
declare var buster: any;
declare var io: any;
declare var when: any;
declare class PlantLab {
    public ground: Ground.Core;
    public vineyard: Vineyard;
    public server: Lawn;
    public sockets: any[];
    public main_socket: any;
    public http_config: any;
    public http_host: any;
    public http_port: any;
    constructor(config_path: string, bulbs?: any);
    public stop(): void;
    public create_socket(): any;
    public start(): Promise;
    public test(name: string, tests: any): void;
    public emit(socket: any, url: any, data: any): Promise;
    public emit_for_error(socket: any, url: any, data: any): Promise;
    public on_socket(socket: any, event: any): Promise;
    public post(path: any, data: any, login_data?: any): Promise;
    public get_json(path: any, login_data?: any): Promise;
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
declare module "vineyard-plantlab" {
  export = PlantLab
}