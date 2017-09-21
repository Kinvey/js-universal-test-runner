const sinon = require('sinon')
const assert = require('assert');
const path = require('path');
const fs = require('fs');


const testFilesDir = path.join(__dirname, 'temp');
const fileToCopyName = 'test_file';
const testRunnerBundleFileName = 'testRunner.bundle.js'

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
            tasks.customTaskNoArgs.restore();
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
            tasks.customTask.restore();
        }).then(done, done);
    })

    it('should run runCommand task', function(done) {
        const filename = `${new Date().valueOf()}_test`;
        const runner = new Runner({
            pipeline: [
                runCommand({
                    command: 'touch',
                    args: [filename],
                    cwd: testFilesDir
                }), [
                    'verify task execution',
                    () => {
                        assert(fs.existsSync(path.join(testFilesDir, filename)));
                    }
                ]
            ]
        });

        runner.run().then(() => {}).then(done, done);
    })

    it('should run copy and remove tasks', function(done) {
        const runner = new Runner({
            pipeline: [
                copy(
                    path.resolve(__dirname, fileToCopyName),
                    path.resolve(testFilesDir, fileToCopyName)
                ), [
                    'verify copy task execution',
                    () => {
                        assert(fs.existsSync(path.join(testFilesDir, fileToCopyName)));
                    }
                ],
                remove(
                    path.resolve(testFilesDir, fileToCopyName)
                ), [
                    'verify remove task execution',
                    () => {
                        assert(!fs.existsSync(path.join(testFilesDir, fileToCopyName)));
                    }
                ]
            ]
        });

        runner.run().then(() => {}).then(done, done);
    })

    it('should run copyTestRunner task', function(done) {
        const runner = new Runner({
            pipeline: [
                copyTestRunner(
                    path.resolve(testFilesDir)
                ), [
                    'verify copyTestRunner task execution',
                    () => {
                        assert(fs.existsSync(path.join(testFilesDir, testRunnerBundleFileName)));
                    }
                ]
            ]
        });

        runner.run().then(() => {}).then(done, done);
    })

    it('should run a conditional when task if the condition is true', function(done) {
        const customTaskSpy = sinon.spy(tasks, 'customTaskNoArgs');
        const runner = new Runner({
            pipeline: [
                when(() => true, tasks.customTaskNoArgs)
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy.calledOnce);
            assert(customTaskSpy.withArgs(runner).calledOnce);
            tasks.customTaskNoArgs.restore();
        }).then(done, done);
    })

    it('should not run a conditional when task if the condition is false', function(done) {
        const customTaskSpy = sinon.spy(tasks, 'customTaskNoArgs');
        const runner = new Runner({
            pipeline: [
                when(() => false, tasks.customTaskNoArgs)
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy.notCalled);
            tasks.customTaskNoArgs.restore();
        }).then(done, done);
    })

    it('should run a conditional ifThenElse task with condition = true', function(done) {
        const customTaskSpy1 = sinon.spy(tasks, 'customTaskNoArgs');
        const customTaskSpy2 = sinon.spy(tasks, 'customTask');
        const runner = new Runner({
            pipeline: [
                ifThenElse(() => true,
                    tasks.customTaskNoArgs,
                    tasks.customTask
                )
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy1.calledOnce);
            assert(customTaskSpy2.notCalled);
            tasks.customTaskNoArgs.restore();
            tasks.customTask.restore();
        }).then(done, done);
    })

    it('should run a conditional ifThenElse task with condition = false', function(done) {
        const customTaskSpy1 = sinon.spy(tasks, 'customTaskNoArgs');
        const customTaskSpy2 = sinon.spy(tasks, 'customTask');
        const runner = new Runner({
            pipeline: [
                ifThenElse(() => false,
                    tasks.customTaskNoArgs,
                    tasks.customTask
                )
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy1.notCalled);
            assert(customTaskSpy2.calledOnce);
            tasks.customTaskNoArgs.restore();
            tasks.customTask.restore();
        }).then(done, done);
    })
})