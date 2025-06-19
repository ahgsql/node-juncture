import { Server, Socket } from 'socket.io';

class ExpressBridge {
    private io: Server;
    private handlers: { [key: string]: (args: any, socket: Socket) => void };
    private isConnectionHandlerSetup: boolean = false;

    constructor(io: Server) {
        this.io = io;
        this.handlers = {};
        this.setupConnectionHandler();
    }

    private setupConnectionHandler(): void {
        if (this.isConnectionHandlerSetup) return;
        
        this.io.on('connection', (socket: Socket) => {
            // Register all existing handlers for this new connection
            Object.keys(this.handlers).forEach(command => {
                socket.on(command, (args: any) => {
                    this.handlers[command](args, socket);
                });
            });
        });
        
        this.isConnectionHandlerSetup = true;
    }

    registerHandler(command: string, handler: (args: any) => Promise<any>): void {
        const resultEvent = `${command}-result`;
        const errorEvent = `${command}-error`;

        this.handlers[command] = (args: any, socket: Socket) => {
            handler(args)
                .then((data) => {
                    socket.emit(resultEvent, data);
                })
                .catch((error: Error) => {
                    console.error(`Error handling command ${command}:`, error);
                    socket.emit(errorEvent, { message: error.message });
                });
        };

        // Register this handler for all currently connected sockets
        this.io.sockets.sockets.forEach((socket: Socket) => {
            socket.on(command, (args: any) => {
                this.handlers[command](args, socket);
            });
        });
    }

    broadcast(event: string, data: any): void {
        this.io.emit(event, data);
    }
}

export default ExpressBridge;
