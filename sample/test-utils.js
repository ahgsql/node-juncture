import { utils } from '../dist/index.js';
import path from 'path';
import fs from 'fs';

const { fileSystem, dialogs, system, notifications, windowManager, media } = utils;

const TEST_DIR = path.join(process.cwd(), 'test-utils-temp');
const TEST_FILE = path.join(TEST_DIR, 'test-file.txt');
const MOVED_TEST_FILE = path.join(TEST_DIR, 'moved-test-file.txt');
const SCREENSHOT_PATH = path.join(TEST_DIR, 'screenshot.png');

async function runTests() {
    console.log('--- Node-Juncture Utils Test Suite ---');

    try {
        // --- File System Tests ---
        console.log('\n--- Testing File System ---');
        console.log('1. Creating test directory...');
        fileSystem.createFolder(TEST_DIR);
        fs.writeFileSync(TEST_FILE, 'Hello, Juncture!');
        console.log(`  > Directory created at: ${TEST_DIR}`);

        console.log('2. Getting files in folder...');
        const files = fileSystem.getFilesInFolder(TEST_DIR);
        console.log('  > Files found:', files);

        console.log('3. Moving file...');
        fileSystem.movePath(TEST_FILE, MOVED_TEST_FILE);
        console.log(`  > Moved ${TEST_FILE} to ${MOVED_TEST_FILE}`);


        console.log('2. Testing clipboard...');
        const originalClipboard = await system.getClipboard();
        console.log(originalClipboard);
        
        await system.setClipboard('Hello from Node-Juncture!');
        const newClipboard = await system.getClipboard();
        console.log(`  > Clipboard set to: "${newClipboard.trim()}"`);
        await system.setClipboard(originalClipboard); // Restore clipboard


      
        // --- Media Tests ---
        console.log('\n--- Testing Media ---');
        console.log('1. Taking screenshot...');
        await media.takeScreenshot(SCREENSHOT_PATH);
        console.log(`  > Screenshot saved to: ${SCREENSHOT_PATH}`);

        console.log('2. Getting volume...');
        const volume = await media.getVolume();
        console.log(`  > Current volume: ${volume}%`);
        const volume2 = await media.setVolume(5);

        console.log('3. Getting screen details...');
        const screenDetails = await media.getScreenDetails();
        console.log('  > Main screen resolution:', screenDetails.displays[0].currentResX, 'x', screenDetails.displays[0].currentResY);


    } catch (error) {
        console.error('\n--- A TEST FAILED ---');
        console.error(error);
    } finally {
        // --- Cleanup ---
        console.log('\n--- Cleaning up test files ---');
     
        console.log('\n--- Test Suite Finished ---');
    }
}

runTests();
