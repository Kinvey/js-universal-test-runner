var platform = require('../platform');

var isReactNative = platform.isReactNative;
var isNodejs = platform.isNodejs;
var isNativeScript = platform.isNativeScript;
var isCordova = platform.isCordova;
var isDesktop = platform.isDesktop;

var MobileTapReporter = function(logServerPort) {
    //the built in TAP reporter of mocha uses placeholders which do not render in logcat
    //console.log('ok %d %s # SKIP -', n, title(test));

    //Generates reports in the following format:
    //https://wiki.jenkins-ci.org/display/JENKINS/TAP+Plugin
    return function MobileTapReporter(runner) {
        var passes = 0;
        var failures = 0;
        var n = 0;

        function handleSendLogError(err) {
            if (err) {
                console.error(`Failed sending log to server: ${err.message}`);
            }
        }

        var logServer = `http://127.0.0.1:${logServerPort}`;
        function mochaLog(message) {
            console.log('Mocha: ' + message);

            var platform = '';
            if (isNativeScript) {
                platform = 'nativescript';
            } else if (isNodejs) {
                platform = 'node';
            } else if (isDesktop) {
                platform = 'web';
            } else if (isCordova) {
                platform = 'cordova';
            } else if (isReactNative) {
                platform = 'reactnative';
            }

            if (isReactNative || isDesktop || isCordova || isNativeScript) {
                fetch(logServer, {
                    method: 'POST',
                    body: JSON.stringify({
                        platform: platform,
                        logs: [message]
                    })
                }).catch(handleSendLogError);
            } else if (isNodejs) {
                var requestModule = 'request';
                var request = require(requestModule);
                request(
                    {
                        method: 'POST',
                        url: logServer,
                        json: true,
                        body: {
                            platform,
                            logs: [message]
                        }
                    },
                    handleSendLogError
                );
            }
        }

        /**
     * Return a TAP-safe title of `test`
     *
     * @param {Object} test
     * @return {String}
     * @api private
     */

        function title(test) {
            return test.fullTitle().replace(/#/g, '');
        }

        runner.on('start', function() {
            var total = runner.grepTotal(runner.suite);
            mochaLog(1 + '..' + total);
        });

        runner.on('test end', function() {
            ++n;
        });

        runner.on('pending', function(test) {
            mochaLog('ok ' + n + ' ' + title(test) + ' # SKIP-');
        });

        runner.on('pass', function(test) {
            passes++;
            mochaLog('ok ' + n + ' ' + title(test));
        });

        runner.on('fail', function(test, err) {
            failures++;
            var failMessage = 'not ok ' + n + ' ' + title(test);
            if (err.stack) {
                failMessage += ' - ' + err.stack.replace(/^/gm, '  ');
            }
            else if (err.message) {
                failMessage += ' - ' + err.message.replace(/^/gm, '  ');
            }
            ++n;
            mochaLog(failMessage);
        });

        runner.on('end', function() {
            mochaLog('# tests ' + (passes + failures));
            mochaLog('# pass ' + passes);
            mochaLog('# fail ' + failures);
        });
    };
};

module.exports = MobileTapReporter;
