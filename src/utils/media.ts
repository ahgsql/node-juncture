import screenshot from 'screenshot-desktop';
import loudness from 'loudness';
import si from 'systeminformation';

export async function takeScreenshot(filePath: string): Promise<string> {
    await screenshot({ filename: filePath });
    return filePath;
}

export async function getVolume(): Promise<number> {
    return await loudness.getVolume();
}

export async function setVolume(level: number): Promise<void> {
    await loudness.setVolume(level);
}

export async function getScreenDetails() {
    return await si.graphics();
}
