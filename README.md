# Event Emitter

[![Build](https://github.com/elumixor/event-emitter/actions/workflows/build.yml/badge.svg)](https://github.com/elumixor/event-emitter/actions/workflows/build.yml)
[![Latest NPM version](https://img.shields.io/npm/v/@elumixor/event-emitter.svg)](https://www.npmjs.com/package/@elumixor/event-emitter)

A minimal, type-safe event emitter for TypeScript/JavaScript with both synchronous and asynchronous support.

## Installation

```bash
npm install @elumixor/event-emitter
```

## Basic Usage

### EventEmitter

The `EventEmitter` class provides synchronous event handling:

```typescript
import { EventEmitter } from "@elumixor/event-emitter";

// Create an event emitter for string events
const userLoggedIn = new EventEmitter<string>();

// Subscribe to events
const subscription = userLoggedIn.subscribe((username) => {
  console.log(`User ${username} logged in!`);
});

// Emit an event
userLoggedIn.emit("john_doe");

// Unsubscribe when done
subscription.unsubscribe();
```

### AsyncEventEmitter

For asynchronous event handling with sequential or parallel execution:

```typescript
import { AsyncEventEmitter } from "@elumixor/event-emitter";

// Sequential execution (default)
const fileProcessor = new AsyncEventEmitter<string>("sequential");

fileProcessor.subscribe(async (filePath) => {
  console.log(`Processing ${filePath}...`);
  await processFile(filePath);
});

fileProcessor.subscribe(async (filePath) => {
  console.log(`Saving ${filePath}...`);
  await saveFile(filePath);
});

// Parallel execution
const notificationEmitter = new AsyncEventEmitter<string>("parallel");

notificationEmitter.subscribe(async (message) => {
  await sendEmail(message);
});

notificationEmitter.subscribe(async (message) => {
  await sendSMS(message);
});
```

## Advanced Usage

### Event Data Types

You can use any type for event data:

```typescript
// Void events (no data)
const appReady = new EventEmitter<void>();
appReady.subscribe(() => console.log("App is ready!"));

// Object events
interface UserEvent {
  id: number;
  name: string;
  action: "login" | "logout";
}

const userEvents = new EventEmitter<UserEvent>();
userEvents.subscribe((event) => {
  console.log(`${event.name} performed ${event.action}`);
});

// Union types
const statusEvents = new EventEmitter<"connected" | "disconnected" | "error">();
```

### Promise-based Event Handling

```typescript
const dataLoaded = new EventEmitter<string>();

// Wait for the next event
async function waitForData() {
  const data = await dataLoaded.nextEvent;
  console.log("Data received:", data);
}

// The first event (one-time promise)
async function initialize() {
  await dataLoaded.first; // Resolves when first event is emitted
  console.log("First data loaded, app initialized");
}

// Emit data
setTimeout(() => dataLoaded.emit("Hello World!"), 1000);
```

### Subscribe Once

```typescript
const buttonClicked = new EventEmitter<void>();

buttonClicked.subscribeOnce(() => {
  console.log("Button clicked for the first time!");
  // This callback will only be called once
});

buttonClicked.emit(); // Logs: "Button clicked for the first time!"
buttonClicked.emit(); // Nothing happens
```

### Subscribe Immediate

```typescript
const configLoaded = new EventEmitter<object>();

// Load configuration
setTimeout(() => configLoaded.emit({ theme: "dark" }), 1000);

// This will be called immediately if event was already emitted
configLoaded.subscribeImmediate((config) => {
  console.log("Config received:", config);
});
```

### Event Piping

Chain event emitters together:

```typescript
const userInput = new EventEmitter<string>();
const processedInput = userInput.pipe((input) => input.toUpperCase());
const validatedInput = processedInput.pipe((input) =>
  input.length > 0 ? input : null
);

// Subscribe to the final processed event
validatedInput.subscribe((input) => {
  if (input) {
    console.log("Valid input:", input);
  }
});

// Emit original event
userInput.emit("hello world"); // Logs: "Valid input: HELLO WORLD"
```

### Async Event Piping

```typescript
const rawData = new AsyncEventEmitter<string>();
const processedData = rawData.pipe(async (data) => {
  const result = await fetch(`/api/process?data=${data}`);
  return result.json();
});

processedData.subscribe((processed) => {
  console.log("Processed data:", processed);
});
```

## API Reference

### EventEmitter<TEventData>

#### Methods

- `subscribe(callback: (eventData: TEventData) => unknown): ISubscription<TEventData>`

  - Subscribes a callback to the event
  - Returns a subscription object with `unsubscribe()` method

- `subscribeImmediate(callback: (eventData: TEventData) => unknown): ISubscription<TEventData>`

  - Subscribes a callback and immediately calls it if the event was already emitted

- `subscribeOnce(callback: (eventData: TEventData) => unknown): ISubscription<TEventData>`

  - Subscribes a callback that will only be called once

- `emit(eventData: TEventData): void`

  - Emits an event with the provided data

- `unsubscribe(callback: (eventData: TEventData) => unknown): void`

  - Unsubscribes a specific callback

- `pipe(): EventEmitter<TEventData>`
- `pipe<TOut>(callback: (eventData: TEventData) => TOut): EventEmitter<TOut>`
  - Creates a new EventEmitter that receives transformed events

#### Properties

- `nextEvent: PromiseLike<TEventData>`

  - Promise that resolves with the next emitted event data

- `first: PromiseLike<void>`

  - Promise that resolves when the first event is emitted

- `value: TEventData | undefined`
  - The last emitted event data (undefined if no events emitted)

### AsyncEventEmitter<TEventData>

Extends EventEmitter with async support.

#### Constructor

```typescript
new AsyncEventEmitter<TEventData>(strategy?: 'sequential' | 'parallel')
```

- `strategy`: Execution strategy for callbacks
  - `'sequential'` (default): Callbacks are executed one after another
  - `'parallel'`: All callbacks are executed simultaneously

#### Additional Methods

- `emit(eventData: TEventData): Promise<void>`

  - Emits an event asynchronously

- `pipe(): AsyncEventEmitter<TEventData>`
- `pipe<TOut>(callback: (eventData: TEventData) => TOut): AsyncEventEmitter<TOut>`
  - Creates a new AsyncEventEmitter that receives transformed events

### ISubscription<TEventData>

```typescript
interface ISubscription<TEventData> {
  callback: (eventData: TEventData) => unknown;
  unsubscribe(): void;
}
```

## Examples

### Real-world Usage Patterns

#### User Authentication Events

```typescript
import { EventEmitter } from "@elumixor/event-emitter";

interface AuthEvent {
  userId: string;
  timestamp: Date;
  action: "login" | "logout" | "register";
}

class AuthService {
  private authEvents = new EventEmitter<AuthEvent>();

  onAuthEvent(callback: (event: AuthEvent) => void) {
    return this.authEvents.subscribe(callback);
  }

  async login(username: string, password: string) {
    // ... authentication logic
    this.authEvents.emit({
      userId: "user123",
      timestamp: new Date(),
      action: "login",
    });
  }
}
```

#### File Upload Progress

```typescript
import { AsyncEventEmitter } from "@elumixor/event-emitter";

interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: "uploading" | "completed" | "error";
}

class FileUploader {
  private progressEmitter = new AsyncEventEmitter<UploadProgress>("parallel");

  onProgress(callback: (progress: UploadProgress) => void) {
    return this.progressEmitter.subscribe(callback);
  }

  async uploadFile(file: File) {
    // Simulate upload with progress updates
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.progressEmitter.emit({
        fileName: file.name,
        progress,
        status: progress === 100 ? "completed" : "uploading",
      });
    }
  }
}
```

#### Reactive State Management

```typescript
import { EventEmitter } from "@elumixor/event-emitter";

class Store<T> {
  private stateEmitter = new EventEmitter<T>();
  private _state: T;

  constructor(initialState: T) {
    this._state = initialState;
  }

  get state() {
    return this._state;
  }

  subscribe(callback: (state: T) => void) {
    return this.stateEmitter.subscribeImmediate(callback);
  }

  update(updater: (currentState: T) => T) {
    this._state = updater(this._state);
    this.stateEmitter.emit(this._state);
  }
}

// Usage
const counterStore = new Store(0);

counterStore.subscribe((count) => {
  console.log("Count changed:", count);
});

counterStore.update((count) => count + 1); // Logs: "Count changed: 1"
```

## License

ISCEmitter

[![Build](https://github.com/elumixor/event-emitter/actions/workflows/build.yml/badge.svg)](https://github.com/elumixor/event-emitter/actions/workflows/build.yml)
[![Latest NPM version](https://img.shields.io/npm/v/@elumixor/event-emitter.svg)](https://www.npmjs.com/package/@elumixor/event-emitter)

Minimal event emitter.

Usage:
