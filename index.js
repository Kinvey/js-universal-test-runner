const { Runner } = require('./lib/runner');
const { copyTestRunner, copy, copyTestLibs, remove } = require('./lib/inject');
const { runCommand, installPackages } = require('./lib/commands');
const { processTemplateFile } = require('./lib/templates');
const { when, ifThenElse } = require('./lib/conditionals');
const logServer = require('./lib/logServer');

module.exports = {
    Runner,
    tasks: {
        logServer: logToConsole => ['logServer', logServer, logToConsole],
        copy: (from, to) => [`copy ${from} => ${to}`, copy, from, to],
        remove: path => [`remove => ${path}`, remove, path],
        copyTestRunner: to => [`copyTestRunner => ${to}`, copyTestRunner, to],
        runCommand: ({ command, args, silent, cwd }) => [
            `runCommand ${command} ${args}`,
            runCommand,
            { command, args, silent, cwd }
        ],
        installPackages: (packages, cwd, silent) => [
            `installPackages ${packages}`,
            installPackages,
            packages,
            cwd,
            silent
        ],
        processTemplateFile: (file, data, output) => [
            `processTemplateFile ${file} => ${output}`,
            processTemplateFile,
            file,
            data,
            output
        ]
    },
    conditionals: {
        when: (condition, task) => [
            `when ${condition} then ${Runner.parseTask(task).name}`,
            when,
            condition,
            task
        ],
        ifThenElse: (condition, thenTask, elseTask) => [
            `if ${condition} then ${Runner.parseTask(thenTask)
                .name} else ${Runner.parseTask(elseTask).name}`,
            ifThenElse,
            condition,
            thenTask,
            elseTask
        ]
    }
};
