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
    customTask: () => {}
};

describe('Run Tasks', function() {

    it('should run a custom task', function(done) {
        const customTaskSpy = sinon.spy(tasks, 'customTask');
        const runner = new Runner({
            pipeline: [
                tasks.customTask
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy.calledOnce);
        }).then(done, done);
    })
})