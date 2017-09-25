const sinon = require('sinon')
const assert = require('assert');
const path = require('path');
const fs = require('fs');


const testFilesDir = path.join(__dirname, 'temp');
const fileToCopyName = 'test_file';
const bundleDirectory = path.resolve(__dirname, '..', 'injectables', 'bundles');
const testRunnerBundleFileName = 'testRunner.bundle.js';
const testRunnerBundleMapFileName = 'testRunner.bundle.js.map';

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

removeDirectory = (dirPath, removeSelf) => {
    const files = fs.readdirSync(dirPath);
    if (files.length > 0) {
        files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            }
        })
    }
    if (removeSelf) {
        fs.rmdirSync(dirPath);
    }
};

it('npm run build-deps should generate the bundle files', function (done) {

    removeDirectory(bundleDirectory);
    assert(!fs.existsSync(path.join(bundleDirectory, testRunnerBundleFileName)));
    const runner = new Runner({
        pipeline: [
            runCommand({
                command: 'npm',
                args: ['run', 'build-deps']
            }), [
                'verify the bundle files are generated',
                () => {
                    assert(fs.existsSync(path.join(bundleDirectory, testRunnerBundleFileName)));
                    assert(fs.existsSync(path.join(bundleDirectory, testRunnerBundleMapFileName)));
                }
            ]
        ]
    });

    runner.run().then(() => {}).then(done, done);
}).timeout(10000);

describe('Run Tasks', () => {

    before((done) => {
        removeDirectory(testFilesDir)
        done();
    });

    after((done) => {
        removeDirectory(testFilesDir)
        done();
    });

    afterEach((done) => {
        Object.keys(tasks).forEach((key) => {
            if (typeof tasks[key].restore !== 'undefined') {
                tasks[key].restore();
            }
        });
        done();
    });

    it('should run a custom task with runner as argument', (done) => {
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

    it('should run an array of tasks with the correct arguments', (done) => {
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

    it('should run runCommand task', (done) => {
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

    it('should run copy and remove tasks', (done) => {
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

    it('should run copyTestRunner task', (done) => {
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

    it('should run a conditional when task if the condition is true', (done) => {
        const customTaskSpy = sinon.spy(tasks, 'customTaskNoArgs');
        const runner = new Runner({
            pipeline: [
                when(() => true, tasks.customTaskNoArgs)
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy.calledOnce);
            assert(customTaskSpy.withArgs(runner).calledOnce);
        }).then(done, done);
    })

    it('should not run a conditional when task if the condition is false', (done) => {
        const customTaskSpy = sinon.spy(tasks, 'customTaskNoArgs');
        const runner = new Runner({
            pipeline: [
                when(() => false, tasks.customTaskNoArgs)
            ]
        });

        runner.run().then(() => {
            assert(customTaskSpy.notCalled);
        }).then(done, done);
    })

    it('should run a conditional ifThenElse task with condition = true', (done) => {
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
        }).then(done, done);
    })

    it('should run a conditional ifThenElse task with condition = false', (done) => {
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
        }).then(done, done);
    })
})