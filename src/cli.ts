#!/usr/bin/env node

import { exec } from 'child_process';
import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { pathToFileURL } from 'url';

program
    .command('package <appPath>')
    .description('Package a Node-Juncture application')
    .action(async (appPath: string) => {
        await packageApp(appPath);
    });


async function archiveApp(appPath: string, outputPath: string) {
  console.log(`Archiving app at ${appPath} to ${outputPath}`);

  let AdmZip;
  try {
    AdmZip = (await import('adm-zip')).default;
  } catch (e) {
    console.error("Failed to load adm-zip", e);
    return;
  }
  const zip = new AdmZip();

  const addDirectory = (dirPath: string, zipPath: string) => {
    fs.readdirSync(dirPath).forEach(item => {
      const itemPath = path.join(dirPath, item);
      const itemZipPath = path.join(zipPath, item);

      if (item === 'node_modules') {
        return;
      }

      if (fs.statSync(itemPath).isDirectory()) {
        addDirectory(itemPath, itemZipPath);
      } else {
        zip.addLocalFile(itemPath, zipPath);
      }
    });
  };

  addDirectory(appPath, '');

  zip.writeZip(outputPath);

  console.log(`App archived to ${outputPath}`);
}

async function packageApp(appPath: string) {
  const configPath = path.join(appPath, 'juncture.config.cjs');
  if (!fs.existsSync(configPath)) {
    console.error('Error: juncture.config.cjs not found in the application path.');
    process.exit(1);
  }

  const config = await import(pathToFileURL(configPath).href);

  const { clientPort, clientCommand, serverEntry, installed } = config.default;

  const startScript = `
    const concurrently = require('concurrently');
    const path = require('path');

    const configPath = path.join(process.cwd(), 'juncture.config.cjs');
    const config = require(configPath);

    const { clientPort, clientCommand, serverEntry } = config;

    concurrently([
      { command: \`node \${serverEntry}\`, name: 'server' },
      { command: \`cd client && \${clientCommand}\`, name: 'client' },
      { command: \`node -e "setTimeout(() => import('open').then(open => open.default('http://localhost:\${clientPort}')), 5000)"\`, name: 'browser' },
    ]);
  `;

  fs.writeFileSync(path.join(appPath, 'start.cjs'), startScript);

  const batScript = `
    @echo off
    set LOGFILE=log.txt
    echo. > %LOGFILE%
    echo Checking for Node.js... >> %LOGFILE%
    node -v >> %LOGFILE% 2>&1
    if %errorlevel% neq 0 (
      echo Node.js not found. Attempting to install with Chocolatey... >> %LOGFILE%
      powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" >> %LOGFILE% 2>&1 && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
      choco install nodejs -y >> %LOGFILE% 2>&1
    )

    if not exist "node_modules" (
      echo Installing dependencies... >> %LOGFILE%
      call npm install --prefix . concurrently open >> %LOGFILE% 2>&1
    )
    if not exist "client/node_modules" (
      call npm install --prefix client >> %LOGFILE% 2>&1
    )
    if not exist "server/node_modules" (
      call npm install --prefix server >> %LOGFILE% 2>&1
    )

    echo Starting application... >> %LOGFILE%
    call node start.cjs
  `;

  fs.writeFileSync(path.join(appPath, 'start.bat'), batScript);

  const shScript = `
    #!/bin/bash
    echo "Checking for Node.js..."
    if ! command -v node &> /dev/null
    then
        echo "Node.js not found. Attempting to install..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update
            sudo apt-get install -y nodejs npm
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if ! command -v brew &> /dev/null
            then
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install node
        fi
    fi

    cd $1
    if [ ! -d "node_modules" ]; then
      echo "Installing dependencies..."
      npm install --prefix . concurrently
    fi
    if [ ! -d "client/node_modules" ]; then
      npm install --prefix client
    fi
    if [ ! -d "server/node_modules" ]; then
      npm install --prefix server
    fi

    echo "Starting application..."
    node start.cjs
  `;

  fs.writeFileSync(path.join(appPath, 'start.sh'), shScript);

  console.log('Windows and Linux/macOS packages created successfully!');
}

program
    .command('archive <appPath> <outputPath>')
    .description('Archive a Node-Juncture application')
    .action(async (appPath: string, outputPath: string) => {
        await archiveApp(appPath, outputPath);
    });

program.parse(process.argv);
