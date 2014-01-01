/// <reference path="metahub.d.ts" />
/// <reference path="ground.d.ts" />
/// <reference path="vineyard.d.ts" />
/// <reference path="lawn.d.ts" />
/// <reference path="buster.d.ts" />
/// <reference path="socket.io.d.ts" />
/// <reference path="node.d.ts" />
declare class PlantLab {
    public ground: Ground.Core;
    public vineyard: Vineyard;
    public server: Lawn;
    public sockets: any[];
    public main_socket;
    public http_config;
    constructor(config_path: string);
    public stop(): void;
    public create_socket();
    public start(): void;
    public test(name: string, tests): void;
    public emit(socket, url, data): Promise;
    public login_http(name: string, pass: string): Promise;
}
declare module PlantLab {
    class Fixture {
        public lab: PlantLab;
        public ground: Ground.Core;
        constructor(lab: PlantLab);
        public all(): Promise;
        public prepare_database(): Promise;
        public populate(): Promise;
        public clear_file_folders(folders): Promise;
        public insert_object(trellis, data, user?): Promise;
        public empty_folder(folder): Promise;
    }
}
declare module "plantlab" {
  export = PlantLab
}