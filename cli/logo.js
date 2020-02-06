'use strict';

const chalk = require('chalk');

module.exports = function (version, title = 'ENTERPRISE APP STARTER') {
  version = version ? 'v' + version : '';
    return "                                                     \n" +
           " _____         _____                     _           \n" +
           "|   | |___ _ _|   __|___ ___ ___ ___ ___| |_ ___ ___ \n" +
           "| | | | . |_'_|  |  | -_|   | -_|  _| .'|  _| . |  _|\n" +
           "|_|___|_  |_,_|_____|___|_|_|___|_| |__,|_| |___|_|  \n" +
           "      |___|                                          \n"
};
