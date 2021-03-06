import WebSocket from 'ws';
import { NarrowAction, ClientAction, SetIDCAction, ServerAction } from '../../shared/action/TAction';

export type SocketState = 'init' | 'hasID';

export class WSSocket {

    private readonly socket: WebSocket;
    private rooms: Set<string>;

    private readonly listeners: {
        [K in ClientAction['type']]?: {
            condition?: (socket: WSSocket) => boolean;
            fn: (action: NarrowAction<ClientAction, K>) => void;
        };
    };

    private state: SocketState;

    private _id: string;
    get id(): string {
        return this._id;
    }

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.rooms = new Set();
        this.listeners = {};
        this.state = 'init';
        this._id = '';

        this.socket.on('message', message => {

            if (typeof message !== 'string') {
                throw new Error(`typeof message not handled: ${typeof message}`);
            }

            let action;
            try {
                action = JSON.parse(message);
            } catch (e) {
                action = message;
            }

            if (typeof action !== 'object' || typeof action.type !== 'string') {
                throw new Error(`message is not an Action: ${action}`);
            }

            this.onMessage(action);
        });

        this.on<SetIDCAction>(
            'set-id',
            action => {
                this._id = action.id;
                this.state = 'hasID';
            },
            () => this.state === 'init');
    }

    on<A extends ClientAction>(type: A['type'], fn: (action: A) => void, condition?: (() => boolean)): void {
        this.listeners[type] = {
            condition,
            fn: fn as any
        };
    }

    send<A extends ServerAction>(action: Omit<A, 'sendTime'>): void {
        this.socket.send(JSON.stringify({
            sendTime: Date.now(),
            ...action
        }));
    }

    addRoom(room: string): void {
        this.rooms.add(room);
    }

    removeRoom(room: string): void {
        this.rooms.delete(room);
    }

    protected onMessage(action: ClientAction): void {
        console.log(action);

        const listener = this.listeners[action.type];
        if (listener) {

            const { condition, fn } = listener;
            const isOK = condition
                ? condition(this)
                : true;

            if (isOK)
                fn(action as any);
        }
    }
}