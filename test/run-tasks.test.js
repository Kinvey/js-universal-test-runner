const sinon = require('sinon')
const assert = require('assert');
const path = require('path');
const fs = require('fs');


const testFilesDir = path.join(__dirname, 'temp');
const fileToCopyName = 'test_file';

const {
    Runner,
    tasks: {
        logServer,
        copy,
        remove,
        copyTestRunner,
        runCommand,
        installPackages,
        processTemplateFile
    },
    conditionals: {
        when,
        ifThenElse
    }
} = require('../');

const tasks = {
    customTaskNoArgs: () => {},
    customTaskOneArg: (arg) => {},
    customTaskTwoArgs: (arg1, arg2) => {},
    customTask: (arg) => {}
};

describe('Run Tasks', function() {

    it('should run a custom task with runner as argument', function(done) {
        const customTaskSpy = sinon.spy(tasks, 'customTaskNoArgs');
        const runner = new Runner({
            pipeline: [
                tasks.customTaskNoArgs
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy.calledOnce);
            assert(customTaskSpy.withArgs(runner).calledOnce);
        }).then(done, done);
    })

    it('should run an array of tasks with the correct arguments', function(done) {
        const customTaskSpy1 = sinon.spy(tasks, 'customTaskOneArg');
        const customTaskSpy2 = sinon.spy(tasks, 'customTaskTwoArgs');
        const customTaskSpy3 = sinon.spy(tasks, 'customTask');
        const runner = new Runner({
            pipeline: [
                ['customTaskOneArg', tasks.customTaskOneArg, 5],
                ['customTaskTwoArgs', tasks.customTaskTwoArgs, 'test', 10],
                ['customTask', tasks.customTask, tasks.customTaskNoArgs]
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy1.withArgs(5, runner).calledOnce);
            assert(customTaskSpy2.withArgs('test', 10, runner).calledOnce);
            assert(customTaskSpy3.withArgs(tasks.customTaskNoArgs, runner).calledOnce);
            sinon.assert.callOrder(customTaskSpy1, customTaskSpy2, customTaskSpy3)
        }).then(done, done);
    })

    it('should execute runCommand task', function(done) {
        const filename = `${new Date().valueOf()}_test`;
        const runner = new Runner({
            pipeline: [
                runCommand({
                    command: 'touch',
                    args: [filename],
                    cwd: testFilesDir
                }), [
                    'verify command execution',
                    () => {
                        assert(fs.existsSync(path.join(testFilesDir, filename)));
                    }
                ]
            ]
        });

        runner.run().then(() => {}).then(done, done);
    })

    it('should execute copy and remove tasks', function(done) {
        const runner = new Runner({
            pipeline: [
                copy(
                    path.resolve(__dirname, fileToCopyName),
                    path.resolve(testFilesDir, fileToCopyName)
                ), [
                    'verify copy command execution',
                    () => {
                        assert(fs.existsSync(path.join(testFilesDir, fileToCopyName)));
                    }
                ],
                remove(
                    path.resolve(testFilesDir, fileToCopyName)
                ), [
                    'verify remove command execution',
                    () => {
                        assert(!fs.existsSync(path.join(testFilesDir, fileToCopyName)));
                    }
                ]
            ]
        });

        runner.run().then(() => {}).then(done, done);
    })
})