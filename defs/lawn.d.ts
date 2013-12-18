/// <reference path="socket.io.extension.d.ts" />

/// <reference path="metahub.d.ts" />
/// <reference path="ground.d.ts" />
/// <reference path="vineyard.d.ts" />

declare module Lawn {
    interface Config {
        ports;
        log_updates?: boolean;
        use_redis?: boolean;
        cookie_secret?: string;
        log_file?: string;
    }
}
declare class Lawn extends Vineyard.Bulb {
    public io;
    public instance_sockets: {};
    public instance_user_sockets: {};
    private app;
    public fs;
    public config: Lawn.Config;
    public redis_client;
    public http;
    public grow(): void;
    static authorization(handshakeData, callback);
    public debug(...args: any[]): void;
    public get_user_socket(id: number): Socket;
    public initialize_session(socket, user): void;
    public start(): void;
    public get_user_from_session(token: string): Promise;
    public http_login(req, res, body): void;
    public login(data, socket: ISocket, callback): {};
    public on_connection(socket: ISocket): Socket;
    public start_sockets(port?): void;
    public start_http(port): void;
    public stop(): void;
}
declare module Lawn {
    interface Update_Request {
        objects: any[];
    }
    class Irrigation {
        static query(request: Ground.External_Query_Source, user: Vineyard.IUser, ground: Ground.Core, vineyard: Vineyard): Promise;
        static update(request: Update_Request, user: Vineyard.IUser, ground: Ground.Core, vineyard: Vineyard): Promise;
    }
}
declare module "lawn" {
  export = Lawn
}