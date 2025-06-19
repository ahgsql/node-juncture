# Node-Juncture

Node-Juncture is a JavaScript module that bridges React with Node.js applications, providing graphical user interfaces for Node.js apps with real-time communication capabilities.

## Features

- Easy integration with Express server
- Real-time communication using Socket.IO
- Unified package for both server and client components
- Modular imports for server-only or client-only usage
- State management with file persistence
- Event broadcasting and subscription

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

## Examples

Check the `sample` directory for complete examples:

- `sample/server.js`: Example server implementation
- `sample/client.js`: Example client implementation

## License

MIT
