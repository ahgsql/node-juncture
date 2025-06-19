# Node-Juncture

Node-Juncture is a powerful module to build cross-platform desktop-like applications with Node.js and React, featuring a rich set of utilities for system interaction, window management, and native dialogs.

## Core Features

- **Real-time Bridge:** Seamless real-time communication between Node.js backend and React frontend.
- **State Management:** Persistent state management on the server-side.
- **Event-Driven:** Broadcast events from server to clients and handle commands from clients.

## Desktop Utility Suite (`node-juncture/utils`)

Transform your web app into a full-fledged desktop application with our utility suite:

- **File System:** Access and manage files and folders (create, move, delete, list).
- **Native Dialogs:** Open native file/folder selection dialogs and show system message boxes.
- **Window Management:** List open windows, get the active window, and set windows to be "always on top".
- **System Interaction:** Access clipboard, get detailed system information (CPU, RAM, OS), and open paths/URLs.
- **Media & Display:** Take screenshots, control system volume, and get screen details.
- **Native Notifications:** Display native desktop notifications.

## Installation

```bash
npm install node-juncture
```

## Basic Usage

### Setting Up the Server with Default State

```javascript
import { Juncture } from "node-juncture";

let defaultState = {
  counter: 0,
  message: "",
};

const app = new Juncture(3000, defaultState);
const bridge = app.bridge;

// Simple command handler
bridge.registerHandler("greet", async (args) => {
  const greeting = `Hello, ${args.name}!`;
  app.setState({ ...app.state, message: greeting });
  return greeting;
});

// Stream example
bridge.registerHandler("count", async (args) => {
  const { countTo } = args;
  for (let i = 1; i <= countTo; i++) {
    app.setState({ ...app.state, counter: i });
    bridge.broadcast("counterUpdate", i);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return "Counting completed!";
});

app.start();
```

### Using the Desktop Utility Suite (`utils`)

Combine the bridge with the `utils` module to create powerful desktop interactions.

```javascript
// server.js
import { Juncture, utils } from 'node-juncture';
const { dialogs, system } = utils;

const app = new Juncture(3000);
const bridge = app.bridge;

// Let the user select a folder and get system info
bridge.registerHandler('select-and-get-info', async () => {
  const folder = await dialogs.selectFolderDialog();
  const sysInfo = await system.getSystemInfo();
  
  const result = {
    selectedFolder: folder,
    os: sysInfo.os.distro,
    cpu: sysInfo.cpu.brand,
  };

  await dialogs.showMessageBox('Info', `You selected: ${folder}\nOS: ${result.os}`);
  
  return result;
});

app.start();
```

```jsx
// client.jsx
import React from 'react';
import bridge from '../utils/bridge';

function SystemChecker() {
  const [info, setInfo] = React.useState(null);

  const handleCheckSystem = async () => {
    try {
      const result = await bridge.execute('select-and-get-info');
      setInfo(result);
    } catch (error) {
      console.error('Could not get system info:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCheckSystem}>Select Folder & Get System Info</button>
      {info && <pre>{JSON.stringify(info, null, 2)}</pre>}
    </div>
  );
}
```

### Frontend (React)

```javascript
// utils/bridge.js
import { ReactBridge } from "node-juncture/client";

const bridge = new ReactBridge("http://localhost:3000");
export default bridge;
```

Then, use the bridge in your React components:

```jsx
import React, { useState, useEffect } from "react";
import bridge from "../utils/bridge";

function App() {
  const [message, setMessage] = useState("");
  const [counter, setCounter] = useState(0);

  const handleGreeting = () => {
    bridge
      .execute("greet", { name: "World" })
      .then(setMessage)
      .catch(console.error);
  };

  const handleCounting = () => {
    bridge
      .execute("count", { countTo: 5 })
      .then(console.log)
      .catch(console.error);
  };

  useEffect(() => {
    bridge.on("counterUpdate", (data) => {
      setCounter(data);
    });

    return () => {
      bridge.off("counterUpdate");
    };
  }, []);

  return (
    <div>
      <button onClick={handleGreeting}>Greet</button>
      <p>{message}</p>
      <button onClick={handleCounting}>Start Counting</button>
      <p>Current count: {counter}</p>
    </div>
  );
}

export default App;
```

## Import Options

Node-Juncture provides flexible import options:

```javascript
// Import everything
import { Juncture, ExpressBridge, ReactBridge } from "node-juncture";

// Import only server components
import { Juncture, ExpressBridge } from "node-juncture/server";

// Import only client components
import { ReactBridge } from "node-juncture/client";
```

## API

### `Juncture`

#### Constructor

```javascript
new Juncture(port = 3000, defaultState = {}, config = {})
```

- `port`: The port the server will run on (default: 3000)
- `defaultState`: Initial state (default: {})
- `config`: Configuration options
  - `maxListeners`: Maximum number of event listeners (default: 10)
  - `staticFolder`: Folder for static files (default: "/public")

#### Methods

- `start()`: Starts the server
- `setState(newState)`: Updates the state
- `loadStateFromFile()`: Loads state from file
- `saveStateToFile()`: Saves state to file

### `ExpressBridge`

#### Methods

- `registerHandler(command, handler)`: Registers a new command handler
- `broadcast(event, data)`: Broadcasts an event to all connected clients

### `ReactBridge`

#### Constructor

```javascript
new ReactBridge(url)
```

- `url`: URL of the Juncture server

#### Methods

- `execute(command, args)`: Executes a command on the server
- `on(event, callback, done)`: Listens for an event with optional completion callback
- `off(event)`: Stops listening for an event

## Packaging

Node-Juncture provides a `package` command to create distributable packages for your application. This command generates `.bat` and `.sh` scripts that handle Node.js installation, dependency installation, and application startup.

### Standard Project Structure

A Node-Juncture application should have the following project structure:

```
my-app/
├── client/
├── server/
│   └── entry.js
└── juncture.config.cjs
```

- `client/`: Contains the client-side application (e.g., a React app).
- `server/`: Contains the server-side application.
- `server/entry.js`: The main entry point for the server application.
- `juncture.config.cjs`: The configuration file for the packaging process.

### `juncture.config.cjs`

The `juncture.config.cjs` file should export a JavaScript object with the following properties:

```javascript
module.exports = {
  serverPort: 3000,
  clientPort: 5173,
  clientCommand: 'npm run dev',
  serverEntry: 'server/entry.js',
};
```

- `serverPort`: The port the server will run on.
- `clientPort`: The port the client will run on.
- `clientCommand`: The command to start the client application (e.g., 'npm run dev').
- `serverEntry`: The path to the main entry point for the server application.

### `package` Command

To package your application, run the following command:

```bash
juncture package <appPath>
```

- `<appPath>`: The path to your Node-Juncture application.

The `package` command will generate `start.bat` and `start.sh` scripts in the root of your application directory. These scripts can be used to start your application on Windows, macOS, and Linux.

### Using Configuration Values

You can use the values from your `juncture.config.cjs` file in your server and client code.

**Server:**

```javascript
// server/entry.js
import { Juncture } from 'node-juncture';
import config from '../juncture.config.cjs';

const app = new Juncture(config.serverPort);
// ...
```

**Client (Vite):**

To use the configuration values in your Vite application, you can use the `define` option in your `vite.config.js` file to create a global variable:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import config from './juncture.config.cjs';

export default defineConfig({
  plugins: [react()],
  server: {
    port: config.clientPort,
  },
  define: {
    'process.env.JUNCTURE_CONFIG': JSON.stringify(config)
  }
});
```

Then, in your client-side code, you can access the configuration values like this:

```javascript
// src/bridge.js
import { ReactBridge } from 'node-juncture/client';

const bridge = new ReactBridge(`http://localhost:${process.env.JUNCTURE_CONFIG.serverPort}`);

export default bridge;
```

## Examples

Check the `sample` directory for complete examples:

- `sample/server.js`: Example server implementation
- `sample/client.js`: Example client implementation

## License

MIT
