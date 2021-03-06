import WebSocket from 'ws';
import { Matchmaker } from "./battle/Matchmaker";
import { WSSocket } from './transport/ws/WSSocket';
import { MatchmakerEnterCAction } from './shared/action/MatchmakerAction';

export class App {

    private readonly ws: WebSocket.Server;
    private readonly matchmaker: Matchmaker;

    constructor(ws: WebSocket.Server) {
        this.ws = ws;
        this.matchmaker = new Matchmaker(ws);
    }

    init(): void {
        this.ws.on('connection', _socket => {
            // TODO wait id before going further
            const socket = new WSSocket(_socket);
            socket.on<MatchmakerEnterCAction>('matchmaker/enter', action => {

                this.matchmaker.connection(socket);
            });
        });
    }
}
