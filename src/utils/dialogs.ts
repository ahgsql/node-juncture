import { exec } from "child_process";

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

export function selectFolderDialog(): Promise<string> {
    switch (process.platform) {
        case 'win32':
            const powershellCode =  `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
#Requires -Version 2.0

$signature = @"

	[DllImport("user32.dll")]
	public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

	public static IntPtr FindWindow(string windowName){
		return FindWindow(null,windowName);
	}

	[DllImport("user32.dll")]
	public static extern bool SetWindowPos(IntPtr hWnd,
	IntPtr hWndInsertAfter, int X,int Y, int cx, int cy, uint uFlags);

	[DllImport("user32.dll")]
	public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

	static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
	static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);

	const UInt32 SWP_NOSIZE = 0x0001;
	const UInt32 SWP_NOMOVE = 0x0002;

	const UInt32 TOPMOST_FLAGS = SWP_NOMOVE | SWP_NOSIZE;

	public static void MakeTopMost (IntPtr fHandle)
	{
		SetWindowPos(fHandle, HWND_TOPMOST, 0, 0, 0, 0, TOPMOST_FLAGS);
	}

	public static void MakeNormal (IntPtr fHandle)
	{
		SetWindowPos(fHandle, HWND_NOTOPMOST, 0, 0, 0, 0, TOPMOST_FLAGS);
	}
"@


$app = Add-Type -MemberDefinition $signature -Name Win32Window -Namespace ScriptFanatic.WinAPI -ReferencedAssemblies System.Windows.Forms -Using System.Windows.Forms -PassThru

function Set-TopMost
{
	param(
		[Parameter(
			Position=0,ValueFromPipelineByPropertyName=$true
		)][Alias('MainWindowHandle')]$hWnd=0,

		[Parameter()][switch]$Disable
	)

	if($hWnd -ne 0)
	{
		if($Disable)
		{
			Write-Verbose "Set process handle :$hWnd to NORMAL state"
			$null = $app::MakeNormal($hWnd)
			return
		}

		Write-Verbose "Set process handle :$hWnd to TOPMOST state"
		$null = $app::MakeTopMost($hWnd)
	}
	else
	{
		Write-Verbose "$hWnd is 0"
	}
}





function createDropdownBox(){

    [void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
    [void] [System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")

    $objForm = New-Object System.Windows.Forms.Form
    $objForm.Text = "Always On Top"
    $objForm.Size = New-Object System.Drawing.Size(300,200)
    $objForm.StartPosition = "CenterScreen"
    
    $objForm.KeyPreview = $True
    $objForm.Add_KeyDown({if ($_.KeyCode -eq "Enter")
        {$x=$objListBox.SelectedItem;$objForm.Close()}})
    $objForm.Add_KeyDown({if ($_.KeyCode -eq "Escape")
        {$objForm.Close()}})

    $OKButton = New-Object System.Windows.Forms.Button
    $OKButton.Location = New-Object System.Drawing.Size(75,120)
    $OKButton.Size = New-Object System.Drawing.Size(75,23)
    $OKButton.Text = "OK"
    $OKButton.Add_Click({$x=$objListBox.SelectedItem;$objForm.Close()})
    $objForm.Controls.Add($OKButton)

    $CancelButton = New-Object System.Windows.Forms.Button
    $CancelButton.Location = New-Object System.Drawing.Size(150,120)
    $CancelButton.Size = New-Object System.Drawing.Size(75,23)
    $CancelButton.Text = "Cancel"
    $CancelButton.Add_Click({$objForm.Close()})
    $objForm.Controls.Add($CancelButton)

    $objLabel = New-Object System.Windows.Forms.Label
    $objLabel.Location = New-Object System.Drawing.Size(10,20)
    $objLabel.Size = New-Object System.Drawing.Size(280,20)
    $objLabel.Text = "Select a window to keep on top:"
    $objForm.Controls.Add($objLabel)

    $objListBox = New-Object System.Windows.Forms.ListBox
    $objListBox.Location = New-Object System.Drawing.Size(10,40)
    $objListBox.Size = New-Object System.Drawing.Size(260,20)
    $objListBox.Height = 80

   

    $objForm.Topmost = $True

    $objForm.Add_Shown({$objForm.Activate()})
    
    $folder = New-Object System.Windows.Forms.FolderBrowserDialog
    $form = New-Object System.Windows.Forms.Form -property @{TopMost = $True}
    $result = $folder.ShowDialog($form)
    if ($result -eq 'OK') {
    return $folder.SelectedPath
    }
    

}


############ Script starts here ###################

$chosenApplication = createDropdownBox(1)
$chosenApplication
`;
            return executeCommand(powershellCode, 'powershell.exe');
        case 'darwin':
            const macCommand = `osascript -e 'tell app "System Events" to choose folder'`;
            return executeCommand(macCommand).then(result => result.replace('alias ', '').replace(/:\s/g, '/').replace(/:/g, '/'));
        case 'linux':
            const linuxCommand = `zenity --file-selection --directory`;
            return executeCommand(linuxCommand);
        default:
            return Promise.reject(new Error('Unsupported platform'));
    }
}

export async function showMessageBox(title: string, message: string, type: 'info' | 'error' | 'warning' | 'question' = 'info'): Promise<string> {
    let command: string;
    const psTypeMap = {
        info: 'Information',
        error: 'Error',
        warning: 'Warning',
        question: 'Question'
    };

    switch (process.platform) {
        case 'win32':
            command = `
                Add-Type -AssemblyName System.Windows.Forms;
                [System.Windows.Forms.MessageBox]::Show("${message}", "${title}", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::${psTypeMap[type]})
            `;
            return executeCommand(command, 'powershell.exe');
        case 'darwin':
            command = `osascript -e 'display dialog "${message}" with title "${title}" buttons {"OK"} default button "OK"'`;
            return executeCommand(command);
        case 'linux':
            command = `zenity --${type} --title="${title}" --text="${message}"`;
            return executeCommand(command);
        default:
            throw new Error('Unsupported platform');
    }
}
