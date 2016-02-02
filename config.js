/* jshint esnext: true, node: true, strict: false */

var path = require("path");
var merge = require("merge");

// loading files

var root = process.cwd();
var configData, packageData;
try {
    configData = require(path.join(root, "config.json"));
} catch(ex) {
    configData = {};
}
try {
    packageData = require(path.join(root, "package.json"));
} catch(ex) {
    packageData = {};
}

// environment configuration

var baseEnv = "development";
var envAliases = global.configEnvAliases || {};
var env = process.env.NODE_ENV || baseEnv;
var envAlias = envAliases[env];
if (envAlias)
    env = envAlias;

var config = configData[env];
var baseConfig = baseEnv === env && config ? {} : configData[baseEnv] || configData;

// properties normalization

var totalConfig = merge(true, packageData._app || {}, baseConfig, config || {});

totalConfig.basePath = root;
totalConfig.appPath = totalConfig.appPath || "src";
totalConfig.appPublicPath = totalConfig.appPublicPath || "public";
totalConfig.appSharedPath = totalConfig.appSharedPath || "shared";
totalConfig.appViewsPath = totalConfig.appViewsPath || "views";

var startup = totalConfig.startup || [
    "hooks",
    "controllers",
    "hooks-end",
    "boot"
];

var startupExtra = totalConfig.startupExtra || [];

if (!Array.isArray(startup))
    startup = [startup];

if (!Array.isArray(startupExtra))
    startupExtra = [startupExtra];

totalConfig.startup = startup.concat(startupExtra);
delete totalConfig.startupExtra;

// extra

totalConfig.version = packageData.version || "1.0.0";

// main app port

var port = process.env.PORT;
if (!port) {

    port = parseInt(process.argv[2], 10);
    if (typeof port !== "number" || isNaN(port) || port === 0) {

        port = parseInt(totalConfig.port, 10);
        if (typeof port !== "number" || isNaN(port) || port === 0)
            port = 80;
    }
    
}

totalConfig.port = port;

module.exports = totalConfig;