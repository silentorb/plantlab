/// <reference path="../plantlab.d.ts" />
export declare class PlantLab {
    public ground: Ground.Core;
    public vineyard: Vineyard;
    public server: Lawn;
    public sockets: any[];
    constructor(config_path: string);
    public close(): void;
    public create_socket();
    public test(name: string, tests): void;
}
