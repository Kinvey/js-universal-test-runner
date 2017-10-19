const {
    isReactNative,
    isNodejs,
    isNativeScript,
    isCordova,
    isDesktop
} = require('../platform');

const MobileTapReporter = require('./mobileTapReporter');

function TestRunner() {
    this.runQueue = [];

    if (this.isDevice()) {
        this.initializeGlobals(global);
    } else {
        this.initializeGlobals(window);
    }
}

TestRunner.prototype.isCordovaApp = function() {
    return isCordova;
};

TestRunner.prototype.isDevice = function() {
    return isCordova || isNativeScript || isReactNative;
};

TestRunner.prototype.isNativeScriptApp = function() {
    return isNativeScript;
};

TestRunner.prototype.isNodejsApp = function() {
    return isNodejs;
};

TestRunner.prototype.isDesktopApp = function() {
    return isDesktop;
};

TestRunner.prototype.isCordovaApp = function() {
    return isCordova;
};

TestRunner.prototype.initializeGlobals = function(root) {
    root.runner = this;
    root.chai = require('../test-libs/chai');
    root.mocha = require('../test-libs/mocha');
    root.async = require('../test-libs/async');
    root._ = require('../test-libs/lodash');
	root.sinon = require('../test-libs/sinon');
    root.ok = chai.assert.ok;
    root.assert = chai.assert;
    root.equal = chai.assert.strictEqual;
    root.deepEqual = chai.assert.deepEqual;
    root.expect = chai.expect;

    root.mocha.setup('bdd');
};

TestRunner.prototype.initialize = function initialize(tests, config) {
    this.config = config;
    if (this.isDevice() && tests) {
        tests();
    }
};

TestRunner.prototype.run = function run(tests, testFunc, context) {
    if (typeof tests === 'function') {
        //run a test without specific test arguments
        var testFunction = tests;
        var testContext = testFunc;
        testFunc = testFunction;
        context = testContext;
        tests = [[]];
    }

    if (!this.loaded) {
        this.runQueue = this.runQueue || [];
        return this.runQueue.push([tests, testFunc, context]);
    }

    if (arguments.length) {
        tests.forEach(function(test) {
            testFunc.apply(context, test);
        });
    }
};

TestRunner.prototype.runAllTests = function() {
    if (this.loaded) {
        return;
    }

    var that = this;
    this.loaded = true;
    if (this.runQueue) {
        this.configMocha({
            timeout: 60000,
            bail: false,
            reporter: MobileTapReporter(this.config.logServerPort)
        });

        this.runQueue.forEach(function(queueItem) {
            that.run.apply(that, queueItem);
        });
    }

    this.runMocha();
};

TestRunner.prototype.configMocha = function(config) {
    Object.keys(config).forEach(function(key) {
        var val = config[key];
        mocha[key].call(mocha, val);
    });
};

TestRunner.prototype.runMocha = function() {
    if (this.testsRan) {
        //prevent multiple runs of tests
        return;
    }

    this.testsRan = true;
    mocha.run();
};

const runner = new TestRunner();

if (isCordova) {
    document.addEventListener('deviceready', function() {
        setTimeout(function() {
            runner.runAllTests();
        }, 1000);
    });
} else if (!isNativeScript && !isNodejs && !isReactNative) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            runner.runAllTests();
        }, 1000);
    });
}

module.exports = runner;
