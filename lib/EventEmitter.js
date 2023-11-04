class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    
    emit(event, ...args) {
        const eventHandlers = this.events[event] || [];
        eventHandlers.forEach((handler) => handler(...args));

        // Emit wildcard events
        const wildcardHandlers = this.events['*'] || [];
        wildcardHandlers.forEach((handler) => handler(event, ...args));
    }

    removeListener(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter((handler) => handler !== listener);
    }
}