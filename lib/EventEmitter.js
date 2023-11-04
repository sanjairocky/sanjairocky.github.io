class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
        this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data) {
        const eventHandlers = this.events[event];
        if (eventHandlers) {
        eventHandlers.forEach((handler) => handler(data));
        }
    }

    removeListener(event, callback) {
        const eventHandlers = this.events[event];
        if (eventHandlers) {
        this.events[event] = eventHandlers.filter((handler) => handler !== callback);
        }
    }
}