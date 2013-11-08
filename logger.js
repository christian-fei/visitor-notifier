var fs = require('fs'),
	logFile = 'log.txt',
	toConsole = false;

/*
	Log messages to file and/or console
*/
function setup(){
	var options = arguments[0] ? arguments[0] : {};
	logFile = options.logFile ? options.logFile : logFile;
	toConsole = options.toConsole ? options.toConsole : toConsole;
	if(options.clear)
		clear();
}
function log(text){
	var options = arguments[1] ? arguments[1] : {};

	var tmpToConsole = options.toConsole ? options.toConsole : false;

	var tmpLogfile = options.logFile ? options.logFile : logFile;

	fs.appendFile(tmpLogfile, text.toString() + '\n', function (err) {
		if (err) throw err;
	});
	if(tmpToConsole || toConsole)
		console.log(text.toString());
}
function checkFile(file){
	fs.exists(file,function(exists){
		if(!exists){
			fs.writeFile(file, '', function (err) {
				if (err) throw err;
			});
		}
	});
}
function clear(){
	var tmpLogfile = arguments[0] ? arguments[0] : logFile;
	fs.writeFile(tmpLogfile, '', function(){console.log('cleared ' + tmpLogfile)});
}
module.exports = {
	log: log,
	clear: clear,
	setup: setup
}