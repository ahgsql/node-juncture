import express, { Express } from "express";
import http from "http";
import { Server, ServerOptions } from "socket.io";
import path from "path";
import fs from "fs";
import ExpressBridge from "./ExpressBridge.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE_PATH = path.join(process.cwd(), 'state.json');

interface JunctureConfig {
    maxListeners: number;
    staticFolder: string;
}

class Juncture {
    private port: number;
    private defaultState: any;
    private state: any;
    private config: JunctureConfig;
    private app: Express;
    private server: http.Server;
    private io: Server;
    public bridge: ExpressBridge;

    constructor(port: number = 3000, defaultState: any = {}, config: Partial<JunctureConfig> = {}) {
        this.port = port;
        this.defaultState = defaultState;
        this.state = this.loadStateFromFile();
        const defaultConfig: JunctureConfig = {
            maxListeners: 10,
            staticFolder: "/public"
        };
        this.config = Object.assign(defaultConfig, config);

        this.app = express();
        this.server = http.createServer(this.app);
        const ioOptions: Partial<ServerOptions> = {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
            maxHttpBufferSize: 1e8,
        };
        this.io = new Server(this.server, ioOptions);
        this.io.setMaxListeners(this.config.maxListeners);
        this.bridge = new ExpressBridge(this.io);
        // Statik dosyaları servis etmek için
        this.app.use(express.static(path.join(process.cwd(), '/public')));
    }

    private loadStateFromFile(): any {
        try {
            const data = fs.readFileSync(STATE_FILE_PATH, 'utf8');
            const state = JSON.parse(data);
            return this.validateState(state, this.defaultState);
        } catch (err) {
            console.error("State dosyası yüklenemedi:", err);
            fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(this.defaultState, null, 2), 'utf8');
            return this.defaultState;
        }
    }

    private saveStateToFile(): void {
        try {
            fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf8');
        } catch (err) {
            console.error("State dosyası kaydedilemedi:", err);
        }
    }

    private validateState(state: any, defaultState: any): any {
        for (const key in defaultState) {
            if (!(key in state)) {
                state[key] = defaultState[key];
            } else if (typeof defaultState[key] === 'object' && defaultState[key] !== null) {
                state[key] = this.validateState(state[key], defaultState[key]);
            }
        }
        return state;
    }

    setState(newState: any): void {
        this.state = { ...this.state, ...newState };
        this.saveStateToFile();
    }

    start(): void {
        this.server.listen(this.port, () => {
            console.log(`Juncture server started on port ${this.port}`);
        });
    }
}

export default Juncture;
