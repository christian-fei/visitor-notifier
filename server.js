var net = require('net'),
	fs = require('fs'),
	http = require('http'),
	logger = require('./logger.js'),
	tcpport = 3004,
	httpport = 3005,
	crypto = require('crypto'),
	secret = '',
	connListener = null;

logger.setup({logFile:'server.txt',toConsole:true});
if(process.env.LOGFILE)
	logger.setup({logFile:process.env.LOGFILE});

logger.log('\n\n\n');
logger.log('++++++++++++++++++++');
logger.log('====================');
logger.log('==S==E==R==V==E==R==');
logger.log('====================');
logger.log('++++++++++++++++++++');
logger.log('\n');
logger.log('START :\t' + (new Date()).toUTCString());

/*
	ENV
	SECRET
		TCP_PORT
			HTTP_PORT
				LOCAL
*/
/*
	passphrase must be set
*/
if(!process.env.SECRET){
	console.log("please enter the secret passphrase");
	return;
}else{
	secret = crypto.createHash('md5').update(process.env.SECRET).digest("hex");
}
if(process.env.TCP_PORT)
	tcpport = process.env.TCP_PORT;
if(process.env.HTTP_PORT)
	httpport = process.env.HTTP_PORT;

/*
	HTTP SERVER
*/
/*
set up which hosts can perform connection to this server, and trigger something on the other end (my PC)
*/
var allowedSites = {'christian-fei.com':1,'opentalk.me':1,'soundvot.es':1};
if(process.env.LOCAL){
	allowedSites['localhost:'+httpport] = 1;
	allowedSites['37.139.20.20:'+httpport] = 1;
}

logger.log('accepting HTTP requests from the following hosts:');
logger.log('\t' + JSON.stringify(allowedSites));


var httpserver = http.createServer(function(req,res){
	var who = (req.headers.origin ? req.headers.origin : req.headers.host).replace(/^http:\/\//,'');

	logger.log('REQUEST :\t' + who + '\t' + (new Date()).toUTCString());
	/*
		block assholes
		`!==` because some browsers (Chrome?) request the server for a favicon, so the second request would be '/favicon.ico'
	*/
	if( req.url === '/favicon.ico' || !(who in allowedSites) ){
		logger.log('DENIED :\t' + who + req.url + '\t' + (new Date()).toUTCString());
		var html = '<html><body><h1>fuck off</h1></body></html>';
		res.writeHead(403, {
			'Content-Length': html.length,
			'Content-Type': 'text/html' 
		});
		res.write(html);
		res.end();
		return;
	}
	logger.log('ALLOWED :\t' + who + req.url + '\t' + (new Date()).toUTCString());
	
	var html = '<html><body><h1>leds blink now at my house</h1></body></html>';
	/*some subliminal message*/
	res.writeHead(200, {
		'Content-Length': html.length,
		'Content-Type': 'text/html',
		'Vary' : 'Accept-Encoding',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With'
	});
	res.write(html);
	res.end();
	
	if(connListener){
		connListener.write(who+req.url);
	}
});
httpserver.listen(httpport,function(){
	logger.log('STARTED HTTP SERVER @' +httpport+' \t' + (new Date()).toUTCString());
});

/*
	TCP SERVER
*/
var tcpserver = net.createServer(function(c) {
	logger.log('CLIENT CONNECTED \t' + (new Date()).toUTCString());
	/*
		to be able to access the connectionListener globally
	*/
	connListener = c;

	c.setKeepAlive(true);
	/*
		The clients send some data (the secret), if it's equivalent to the one passed to the server accept the connection, else fuck off.
	*/
	c.on('data', function(data) {
		if(data.toString() === 'keepalive'){
			logger.log('keepalive ' + (new Date()).toUTCString());
			return;
		}else{
			logger.log('CLIENT WANTS TO CONNECT WITH :\t' + data.toString() + '\t' + (new Date()).toUTCString());
			if( data.toString() === secret ) {
				logger.log('CLIENT AUTHORIZED');
				c.write("welcome!");
			}else{
				logger.log('CLIENT DENIED');
				c.write("fuck off!");
				c.destroy();
			}
		}
	});

	c.on('end', function() {
		logger.log('CLIENT DISCONNECTED \t' + (new Date()).toUTCString())
		connListener = null;
		c.destroy(); //probably not needed
	});
});
tcpserver.listen(tcpport, function() {
	logger.log('STARTED TCP SERVER @'+tcpport+'\t' + (new Date()).toUTCString());
});

//this is one man show
tcpserver.maxConnections = 1;