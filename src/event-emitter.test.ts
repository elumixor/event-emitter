import { beforeEach, describe, expect, test } from "bun:test";
import { AsyncEventEmitter, EventEmitter } from "./event-emitter";

describe("EventEmitter", () => {
  let emitter: EventEmitter<string>;

  beforeEach(() => {
    emitter = new EventEmitter<string>();
  });

  test("should emit events to subscribers", () => {
    let called = false;
    let receivedData: string | undefined;

    emitter.subscribe((data) => {
      called = true;
      receivedData = data;
    });

    emitter.emit("test event");

    expect(called).toBe(true);
    expect(receivedData).toBe("test event");
  });

  test("should handle multiple subscribers", () => {
    let callCount1 = 0;
    let callCount2 = 0;
    let data1: string | undefined;
    let data2: string | undefined;

    emitter.subscribe((data) => {
      callCount1++;
      data1 = data;
    });
    emitter.subscribe((data) => {
      callCount2++;
      data2 = data;
    });

    emitter.emit("test event");

    expect(callCount1).toBe(1);
    expect(callCount2).toBe(1);
    expect(data1).toBe("test event");
    expect(data2).toBe("test event");
  });

  test("should unsubscribe callbacks", () => {
    let callCount = 0;

    const subscription = emitter.subscribe(() => {
      callCount++;
    });

    emitter.emit("first event");
    expect(callCount).toBe(1);

    subscription.unsubscribe();
    emitter.emit("second event");

    expect(callCount).toBe(1);
  });

  test("should handle subscribeOnce", () => {
    let callCount = 0;
    let receivedData: string | undefined;

    emitter.subscribeOnce((data) => {
      callCount++;
      receivedData = data;
    });

    emitter.emit("first event");
    emitter.emit("second event");

    expect(callCount).toBe(1);
    expect(receivedData).toBe("first event");
  });

  test("should handle subscribeImmediate when event not emitted", () => {
    let called = false;
    let receivedData: string | undefined;

    emitter.subscribeImmediate((data) => {
      called = true;
      receivedData = data;
    });

    expect(called).toBe(false);

    emitter.emit("test event");
    expect(called).toBe(true);
    expect(receivedData).toBe("test event");
  });

  test("should handle subscribeImmediate when event already emitted", () => {
    emitter.emit("initial event");

    let called = false;
    let receivedData: string | undefined;

    emitter.subscribeImmediate((data) => {
      called = true;
      receivedData = data;
    });

    expect(called).toBe(true);
    expect(receivedData).toBe("initial event");
  });

  test("should resolve nextEvent promise", async () => {
    const promise = emitter.nextEvent;

    emitter.emit("test event");

    await expect(promise).resolves.toBe("test event");
  });

  test("should provide value after emit", () => {
    expect(emitter.value).toBeUndefined();

    emitter.emit("test event");

    expect(emitter.value).toBe("test event");
  });

  test("should resolve first promise", async () => {
    const promise = emitter.first;

    emitter.emit("test event");

    await expect(promise).resolves.toBeUndefined();
    expect(emitter.value).toBe("test event");
  });

  test("should pipe events without transformation", () => {
    const pipedEmitter = emitter.pipe();

    let called = false;
    let receivedData: string | undefined;

    pipedEmitter.subscribe((data) => {
      called = true;
      receivedData = data;
    });

    emitter.emit("test event");

    expect(called).toBe(true);
    expect(receivedData).toBe("test event");
  });

  test("should pipe events with transformation", () => {
    const pipedEmitter = emitter.pipe((data: string) => data.toUpperCase());

    let called = false;
    let receivedData: string | undefined;

    pipedEmitter.subscribe((data) => {
      called = true;
      receivedData = data;
    });

    emitter.emit("test event");

    expect(called).toBe(true);
    expect(receivedData).toBe("TEST EVENT");
  });

  test("should handle void event data", () => {
    const voidEmitter = new EventEmitter<void>();
    let called = false;

    voidEmitter.subscribe(() => {
      called = true;
    });
    voidEmitter.emit();

    expect(called).toBe(true);
  });
});

describe("AsyncEventEmitter", () => {
  describe("sequential strategy", () => {
    let emitter: AsyncEventEmitter<string>;

    beforeEach(() => {
      emitter = new AsyncEventEmitter<string>("sequential");
    });

    test("should emit events sequentially", async () => {
      const results: string[] = [];

      const callback1 = async (data: string) => {
        results.push(`callback1: ${data}`);
      };

      const callback2 = async (data: string) => {
        results.push(`callback2: ${data}`);
      };

      emitter.subscribe(callback1);
      emitter.subscribe(callback2);

      await emitter.emit("test event");

      expect(results).toEqual(["callback1: test event", "callback2: test event"]);
    });

    test("should handle synchronous callbacks", async () => {
      let called = false;
      let receivedData: string | undefined;

      emitter.subscribe((data: string) => {
        called = true;
        receivedData = data;
      });

      await emitter.emit("test event");

      expect(called).toBe(true);
      expect(receivedData).toBe("test event");
    });
  });

  describe("parallel strategy", () => {
    let emitter: AsyncEventEmitter<string>;

    beforeEach(() => {
      emitter = new AsyncEventEmitter<string>("parallel");
    });

    test("should emit events in parallel", async () => {
      const results: string[] = [];

      const callback1 = async (data: string) => {
        results.push(`callback1: ${data}`);
      };

      const callback2 = async (data: string) => {
        results.push(`callback2: ${data}`);
      };

      emitter.subscribe(callback1);
      emitter.subscribe(callback2);

      await emitter.emit("test event");

      expect(results).toContain("callback1: test event");
      expect(results).toContain("callback2: test event");
      expect(results.length).toBe(2);
    });
  });

  describe("common functionality", () => {
    let emitter: AsyncEventEmitter<string>;

    beforeEach(() => {
      emitter = new AsyncEventEmitter<string>();
    });

    test("should unsubscribe callbacks", async () => {
      let callCount = 0;

      const subscription = emitter.subscribe(() => {
        callCount++;
      });

      await emitter.emit("first event");
      expect(callCount).toBe(1);

      subscription.unsubscribe();
      await emitter.emit("second event");

      expect(callCount).toBe(1);
    });

    test("should handle subscribeOnce", async () => {
      let callCount = 0;
      let receivedData: string | undefined;

      emitter.subscribeOnce((data: string) => {
        callCount++;
        receivedData = data;
      });

      await emitter.emit("first event");
      await emitter.emit("second event");

      expect(callCount).toBe(1);
      expect(receivedData).toBe("first event");
    });

    test("should resolve nextEvent promise", async () => {
      const promise = emitter.nextEvent;

      await emitter.emit("test event");

      await expect(promise).resolves.toBe("test event");
    });

    test("should pipe events without transformation", async () => {
      const pipedEmitter = emitter.pipe();

      let called = false;
      let receivedData: string | undefined;

      pipedEmitter.subscribe((data: string) => {
        called = true;
        receivedData = data;
      });

      await emitter.emit("test event");

      expect(called).toBe(true);
      expect(receivedData).toBe("test event");
    });

    test("should pipe events with transformation", async () => {
      const pipedEmitter = emitter.pipe((data: string) => data.toUpperCase());

      let called = false;
      let receivedData: string | undefined;

      pipedEmitter.subscribe((data: unknown) => {
        called = true;
        receivedData = data as string;
      });

      await emitter.emit("test event");

      expect(called).toBe(true);
      expect(receivedData).toBe("TEST EVENT");
    });
  });
});
