#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var fs = require("fs");
var path = require("path");
var url_1 = require("url");
commander_1.program
    .command('package <appPath>')
    .description('Package a Node-Juncture application')
    .action(function (appPath) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, packageApp(appPath)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
var AdmZip = require("adm-zip");
function archiveApp(appPath, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var zip, addDirectory;
        return __generator(this, function (_a) {
            console.log("Archiving app at ".concat(appPath, " to ").concat(outputPath));
            zip = new AdmZip.default();
            addDirectory = function (dirPath, zipPath) {
                fs.readdirSync(dirPath).forEach(function (item) {
                    var itemPath = path.join(dirPath, item);
                    var itemZipPath = path.join(zipPath, item);
                    if (item === 'node_modules') {
                        return;
                    }
                    if (fs.statSync(itemPath).isDirectory()) {
                        addDirectory(itemPath, itemZipPath);
                    }
                    else {
                        zip.addLocalFile(itemPath, zipPath);
                    }
                });
            };
            addDirectory(appPath, '');
            zip.writeZip(outputPath);
            console.log("App archived to ".concat(outputPath));
            return [2 /*return*/];
        });
    });
}
function packageApp(appPath) {
    return __awaiter(this, void 0, void 0, function () {
        var configPath, config, _a, clientPort, clientCommand, serverEntry, installed, startScript, batScript, shScript;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    configPath = path.join(appPath, 'juncture.config.cjs');
                    if (!fs.existsSync(configPath)) {
                        console.error('Error: juncture.config.cjs not found in the application path.');
                        process.exit(1);
                    }
                    return [4 /*yield*/, Promise.resolve("".concat((0, url_1.pathToFileURL)(configPath).href)).then(function (s) { return require(s); })];
                case 1:
                    config = _b.sent();
                    _a = config.default, clientPort = _a.clientPort, clientCommand = _a.clientCommand, serverEntry = _a.serverEntry, installed = _a.installed;
                    startScript = "\n    const concurrently = require('concurrently');\n    const path = require('path');\n\n    const configPath = path.join(process.cwd(), 'juncture.config.cjs');\n    const config = require(configPath);\n\n    const { clientPort, clientCommand, serverEntry } = config;\n\n    concurrently([\n      { command: `node ${serverEntry}`, name: 'server' },\n      { command: `cd client && ${clientCommand}`, name: 'client' },\n      { command: `node -e \"setTimeout(() => import('open').then(open => open.default('http://localhost:${clientPort}')), 5000)\"`, name: 'browser' },\n    ]);\n  ";
                    fs.writeFileSync(path.join(appPath, 'start.cjs'), startScript);
                    batScript = "\n    @echo off\n    set LOGFILE=log.txt\n    echo. > %LOGFILE%\n    echo Checking for Node.js... >> %LOGFILE%\n    node -v >> %LOGFILE% 2>&1\n    if %errorlevel% neq 0 (\n      echo Node.js not found. Attempting to install with Chocolatey... >> %LOGFILE%\n      powershell -NoProfile -ExecutionPolicy Bypass -Command \"iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))\" >> %LOGFILE% 2>&1 && SET \"PATH=%PATH%;%ALLUSERSPROFILE%chocolatey\bin\"\n      choco install nodejs -y >> %LOGFILE% 2>&1\n    )\n\n    if not exist \"node_modules\" (\n      echo Installing dependencies... >> %LOGFILE%\n      call npm install --prefix . concurrently open >> %LOGFILE% 2>&1\n    )\n    if not exist \"client/node_modules\" (\n      call npm install --prefix client >> %LOGFILE% 2>&1\n    )\n    if not exist \"server/node_modules\" (\n      call npm install --prefix server >> %LOGFILE% 2>&1\n    )\n\n    echo Starting application... >> %LOGFILE%\n    call node start.cjs\n  ";
                    fs.writeFileSync(path.join(appPath, 'start.bat'), batScript);
                    shScript = "\n    #!/bin/bash\n    echo \"Checking for Node.js...\"\n    if ! command -v node &> /dev/null\n    then\n        echo \"Node.js not found. Attempting to install...\"\n        if [[ \"$OSTYPE\" == \"linux-gnu\"* ]]; then\n            sudo apt-get update\n            sudo apt-get install -y nodejs npm\n        elif [[ \"$OSTYPE\" == \"darwin\"* ]]; then\n            if ! command -v brew &> /dev/null\n            then\n                /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"\n            fi\n            brew install node\n        fi\n    fi\n\n    cd $1\n    if [ ! -d \"node_modules\" ]; then\n      echo \"Installing dependencies...\"\n      npm install --prefix . concurrently\n    fi\n    if [ ! -d \"client/node_modules\" ]; then\n      npm install --prefix client\n    fi\n    if [ ! -d \"server/node_modules\" ]; then\n      npm install --prefix server\n    fi\n\n    echo \"Starting application...\"\n    node start.cjs\n  ";
                    fs.writeFileSync(path.join(appPath, 'start.sh'), shScript);
                    console.log('Windows and Linux/macOS packages created successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
commander_1.program
    .command('archive <appPath> <outputPath>')
    .description('Archive a Node-Juncture application')
    .action(function (appPath, outputPath) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, archiveApp(appPath, outputPath)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
commander_1.program.parse(process.argv);
