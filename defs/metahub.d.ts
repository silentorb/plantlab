/// <reference path="when.d.ts" />
declare module MetaHub {
    function remove(array, item): void;
    function has_properties(obj): boolean;
    function is_array(obj): boolean;
    function size(obj): number;
    function S4(): string;
    function values(source): any[];
    function concat(destination, source): {};
    function extend(destination, source, names?);
    function guid(): string;
    function clone(source, names): {};
    function get_connection(a, b);
    function filter(source, check: (value: any, key?: any, source?: any) => boolean): {};
    function map(source, action): {};
    function map_to_array(source, action): any[];
    class Meta_Object {
        public is_meta_object: boolean;
        private events;
        private internal_connections;
        static connect_objects(first, other, type): boolean;
        static disconnect_objects(first, other): void;
        static has_property(target, name): boolean;
        static invoke_binding(source, owner, name): void;
        public listen(other: Meta_Object, name: string, method: (...args: any[]) => any, options?): void;
        public unlisten(other, name): void;
        public invoke(name: string, ...args: any[]): Promise;
        public map_invoke(name: string, ...args: any[]): Promise[];
        public gather(name);
        public connect(other: Meta_Object, type: string, other_type?: string): void;
        public disconnect(other): void;
        public disconnect_all(type): void;
        public is_listening(other, name): boolean;
        public get_connections(...filters: any[]): any[];
        public get_connection(filter);
        public define_connection_getter(property_name, connection_name): void;
        public define_object(property_name, connection_name): void;
        public optimize_getter(property_name, connection_name): void;
    }
    class Meta_Connection {
        public other: Meta_Object;
        public parent: Meta_Object;
        public type: string;
        constructor(parent, other, type);
    }
}

declare module "metahub" {
  export = MetaHub
}