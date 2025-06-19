import { exec } from 'child_process';

function executeCommand(command: string, shell: string | boolean = true): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, { shell: typeof shell === 'string' ? shell : undefined }, (error, stdout, stderr) => {
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

export async function getActiveWindow(): Promise<string> {
    switch (process.platform) {
        case 'win32':
            const psCommand = `
                Add-Type @"
                    using System;
                    using System.Runtime.InteropServices;
                    public class WinAPI {
                        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
                        [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
                    }
"@
                $handle = [WinAPI]::GetForegroundWindow()
                $sb = New-Object System.Text.StringBuilder 256
                [WinAPI]::GetWindowText($handle, $sb, 256) | Out-Null
                $sb.ToString()
            `;
            return executeCommand(psCommand, 'powershell.exe');
        case 'darwin':
            const macCommand = `
                tell application "System Events"
                    set frontApp to name of first application process whose frontmost is true
                    tell process frontApp
                        set windowName to name of front window
                    end tell
                    return windowName
                end tell
            `;
            return executeCommand(`osascript -e '${macCommand}'`);
        case 'linux':
            const linuxCommand = `xdotool getwindowfocus getwindowname`;
            return executeCommand(linuxCommand);
        default:
            throw new Error('Unsupported platform');
    }
}

export async function listWindows(): Promise<string[]> {
    switch (process.platform) {
        case 'win32':
            const psCommand = `Get-Process | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object MainWindowTitle | ForEach-Object { $_.MainWindowTitle }`;
            const result = await executeCommand(psCommand, 'powershell.exe');
            return result.split('\r\n').filter(Boolean);
        case 'darwin':
            const macCommand = `
                tell application "System Events"
                    set procs to application processes whose visible is true
                    set allWindows to {}
                    repeat with proc in procs
                        repeat with w in windows of proc
                            set end of allWindows to name of w
                        end repeat
                    end repeat
                    return allWindows
                end tell
            `;
            const macResult = await executeCommand(`osascript -e '${macCommand}'`);
            return macResult.split(', ');
        case 'linux':
            const linuxCommand = `wmctrl -l | awk '{$1=$2=$3=""; print $0}' | sed 's/^ *//'`;
            const linuxResult = await executeCommand(linuxCommand);
            return linuxResult.split('\n');
        default:
            throw new Error('Unsupported platform');
    }
}

export async function setWindowAlwaysOnTop(windowTitle: string, enabled: boolean): Promise<void> {
    switch (process.platform) {
        case 'win32':
            const psCommand = `
                Add-Type @"
                    using System;
                    using System.Runtime.InteropServices;
                    public class WinAPI {
                        [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
                        [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
                        static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
                        static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
                        const uint SWP_NOSIZE = 0x0001;
                        const uint SWP_NOMOVE = 0x0002;
                        public static void SetTopmost(IntPtr hWnd, bool top) {
                            if (top) {
                                SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
                            } else {
                                SetWindowPos(hWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
                            }
                        }
                    }
"@
                $handle = [WinAPI]::FindWindow($null, "${windowTitle}")
                if ($handle -eq [IntPtr]::Zero) { throw "Window not found" }
                [WinAPI]::SetTopmost($handle, ${enabled})
            `;
            await executeCommand(psCommand, 'powershell.exe');
            break;
        case 'linux':
            const action = enabled ? 'add' : 'remove';
            const linuxCommand = `wmctrl -r "${windowTitle}" -b ${action},above`;
            await executeCommand(linuxCommand);
            break;
        case 'darwin':
            // macOS does not have a simple command-line way to set a window to be always on top.
            // This would require more complex solutions like injecting code or using dedicated apps.
            throw new Error('setWindowAlwaysOnTop is not supported on macOS via simple scripts.');
        default:
            throw new Error('Unsupported platform');
    }
}
