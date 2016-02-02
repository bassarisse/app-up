/* jshint esnext: true, node: true, strict: false */

var fs = require("fs");
var path = require("path");
var appModulePath = require("app-module-path");

var setupDone = false;

var app = {
    setup: function(basePath) {

        process.chdir(basePath);
        setupDone = true;

        return this.config;
    },
    start: function(basePath, callback) {

        if (setupDone) {
            if (typeof callback === "function")
                callback();
            return;
        }

        var config = this.setup(basePath);
        var srcRoot = path.join(basePath, config.appPath);

        appModulePath.addPath(path.join(basePath, config.appSharedPath));

        global.appRequire = function(name) {
            return require(path.join(srcRoot, name));
        };

        executeLoader(srcRoot, config.startup, callback);

        return config;
    }
};

Object.defineProperty(app, "config", {
    get: function() {
        if (!setupDone)
            throw Error("App not configured");
        return require("./config");
    }
});

module.exports = app;

function executeLoader(srcRoot, autoExecFolders, callback) {

    var alreadyLoaded = [];

    loadFiles(srcRoot, autoExecFolders || []);

    if (typeof callback === "function")
        callback();

    function loadFiles(filePath, fileNames) {

        var directoriesToRequire = [];

        fileNames
        .filter(function(fileName) {
            return [".DS_Store", "desktop.ini", "Desktop.ini"].indexOf(fileName) === -1;
        })
        .map(function(fileName) {
            return path.join(filePath, fileName);
        })
        .forEach(function(finalPath) {

            var stats;

            try {
                stats = fs.lstatSync(finalPath);
            } catch(err) {

                try {
                    finalPath += ".js";
                    stats = fs.lstatSync(finalPath);
                } catch(err) {
                    return;
                }

            }

            if (stats.isFile()) {

                if (alreadyLoaded.indexOf(finalPath) === -1) {
                    alreadyLoaded.push(finalPath);
                    require(finalPath);
                }

            } else if (stats.isDirectory()) {

                directoriesToRequire.push(finalPath);

            }

        });

        directoriesToRequire.forEach(function(dirPath) {

            loadFiles(dirPath, fs.readdirSync(dirPath));

        });

    }

}