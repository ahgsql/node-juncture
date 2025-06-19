import open from 'open';
import si from 'systeminformation';
import { exec } from 'child_process';

function executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else if (stderr) {
                reject(new Error(stderr));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

export async function openPath(path: string): Promise<void> {
    await open(path);
}

export async function getSystemInfo() {
    return {
        cpu: await si.cpu(),
        memory: await si.mem(),
        os: await si.osInfo(),
        battery: await si.battery()
    };
}

export function getClipboard(): Promise<string> {
    switch (process.platform) {
        case 'win32':
            return executeCommand('powershell -command "Get-Clipboard"');
        case 'darwin':
            return executeCommand('pbpaste');
        case 'linux':
            return executeCommand('xclip -selection clipboard -o');
        default:
            return Promise.reject(new Error('Unsupported platform'));
    }
}

export function setClipboard(text: string): Promise<void> {
    switch (process.platform) {
        case 'win32':
            return new Promise((resolve, reject) => {
                const proc = exec('powershell -command "$input | Set-Clipboard"', (error) => {
                    if (error) reject(error);
                    else resolve();
                });
                proc.stdin!.write(text);
                proc.stdin!.end();
            });
        case 'darwin':
            return new Promise((resolve, reject) => {
                const proc = exec('pbcopy', (error) => {
                    if (error) reject(error);
                    else resolve();
                });
                proc.stdin!.write(text);
                proc.stdin!.end();
            });
        case 'linux':
            return new Promise((resolve, reject) => {
                const proc = exec('xclip -selection clipboard', (error) => {
                    if (error) reject(error);
                    else resolve();
                });
                proc.stdin!.write(text);
                proc.stdin!.end();
            });
        default:
            return Promise.reject(new Error('Unsupported platform'));
    }
}
