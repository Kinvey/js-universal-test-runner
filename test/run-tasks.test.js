const sinon = require('sinon')
const assert = require('assert');

const {
    Runner,
    tasks: {
        logServer,
        copy,
        runCommand
    },
    conditionals: {
        when
    }
} = require('../');

const tasks = {
    customTask1: () => {},
    customTask2: (arg) => {},
    customTask3: (arg1, arg2) => {},
    customTask4: (arg) => {}
};

describe('Run Tasks', function() {

    it('should run a custom task with runner as argument', function(done) {
        const customTaskSpy = sinon.spy(tasks, 'customTask1');
        const runner = new Runner({
            pipeline: [
                tasks.customTask1
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy.calledOnce);
            assert(customTaskSpy.withArgs(runner).calledOnce);
        }).then(done, done);
    })

    it('should run an array of tasks with the correct arguments', function(done) {
        const customTaskSpy2 = sinon.spy(tasks, 'customTask2');
        const customTaskSpy3 = sinon.spy(tasks, 'customTask3');
        const customTaskSpy4 = sinon.spy(tasks, 'customTask4');
        const runner = new Runner({
            pipeline: [
                ['customTask2', tasks.customTask2, 5],
                ['customTask3', tasks.customTask3, 'test', 10],
                ['customTask4', tasks.customTask4, tasks.customTask1]
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy2.withArgs(5, runner).calledOnce);
            assert(customTaskSpy3.withArgs('test', 10, runner).calledOnce);
            assert(customTaskSpy4.withArgs(tasks.customTask1, runner).calledOnce);
            sinon.assert.callOrder(customTaskSpy2, customTaskSpy3, customTaskSpy4)
        }).then(done, done);
    })
})