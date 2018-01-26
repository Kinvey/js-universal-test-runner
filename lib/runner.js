const EventEmitter = require('events');
const path = require('path');
const PromiseSerial = require('promise-serial');

const defaultSettings = {
    pipeline: []
};

class Runner extends EventEmitter {
    constructor(settings = {}) {
        super();

        this.settings = Object.assign({}, defaultSettings, settings);
        this.eventsToWait = [];
    }

    static parseTask(t) {
        let name;
        let fn;
        let args;

        if (Array.isArray(t)) {
            name = typeof t[0] === 'string' ? t[0] : null;
            fn = typeof name === 'string' ? t[1] : t[0];
            args = typeof name === 'string' ? t.slice(2) : t.slice(1);
        } else if (typeof t === 'function') {
            name = t.name;
            fn = t;
            args = [];
        } else {
            throw new Error(`Unsupported pipeline type ${t}`);
        }

        return { name, fn, args };
    }

    getTask(t) {
        const { name, fn, args } = Runner.parseTask(t);
        args.push(this);
        return { name, fn, args };
    }

    waitForEvent(ev) {
        this.eventsToWait.push(ev);
    }

    getTasks(pipeline) {
        return pipeline.map(t => this.getTask(t));
    }

    getEventsPromise(events) {
        return Promise.all(
            events.map(
                ev =>
                    new Promise((resolve, reject) => {
                        this.once(ev, (err, result) => {

                            const eventIndex = this.eventsToWait.indexOf(ev);
                            this.eventsToWait.splice(eventIndex, 1);

                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        })
                    })
            )
        );
    }

    run() {
        const pipeline = this.settings.pipeline.slice();
        const tasks = this.getTasks(pipeline);
        const tasksSerial = tasks.map((t, i) => () => {
            console.log(`Running pipeline function #${i + 1} ${t.name || ''}`);
            return Promise.resolve(t.fn(...t.args));
        });

        const startTime = new Date();
        return PromiseSerial(tasksSerial).then(() => {
            const endTime = new Date();
            const seconds = (endTime.getTime() - startTime.getTime()) / 1000;

            console.log(`Pipeline finished after ${seconds} seconds`);

            if (this.eventsToWait.length) {
                console.log(
                    `Waiting for the following events after the tasks have ran: ${this
                        .eventsToWait}`
                );
            }

            return this.getEventsPromise(this.eventsToWait);
        });
    }
}

module.exports = { Runner };
