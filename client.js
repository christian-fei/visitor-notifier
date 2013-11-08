var net = require('net'),
	fs = require('fs'),
	logger = require('./logger.js'),
	crypto = require('crypto'),
	tcpport = 3004,
	tcpsocket = new net.Socket({allowHalfOpen: false}), /*i have no idea what I'm doing*/
	bounceServer = 'localhost',
	secret = '';

logger.setup({logFile:'client.txt',toConsole:true});

if(process.env.LOGFILE)
	logger.setup({logFile:process.env.LOGFILE});

logger.log('\n\n\n');
logger.log('++++++++++++++++++++');
logger.log('====================');
logger.log('==C==L==I==E==N==T==');
logger.log('====================');
logger.log('++++++++++++++++++++');
logger.log('\n');
logger.log('START :\t' + (new Date()).toUTCString());
/*
	HARDWARE PART
*/
var five = require("johnny-five"),
	board = new five.Board(),
	active=false;
	leds=null;

board.on("ready", function() {
	logger.log('board is ready ' + (new Date()).toUTCString());
	leds = {};
	leds.red = new five.Led(11);
	leds.yellow = new five.Led(10);
	leds.green = new five.Led(9);
});
function rotateLeds(){
	var blinkdur = 80,
		max = 15;
	/*the multiplication between blinkdur and max results in the total duration of the animation*/

	for(var i=0;i<max;i++){
		for(led in leds){
			(function(j,l){
				var delay = l === 'red' ? blinkdur/3 : l === 'yellow' ? blinkdur/3*2 : blinkdur/3*3;
				setTimeout(function(){
					if(j % 2 === max % 2)
						leds[l].on();
					else
						leds[l].off();
					if( j === max -1)
						active=false;
					//logger.log(l + ' ' + ( j % 2 === max % 2 ? 'on' : 'off' ) + ' after ' + j * blinkdur);
				},blinkdur * j + delay);
			})(i,led);
		}
	}
	/*
	for(led in leds){
		for(var i=0;i<max;i++){
			(function(j,l){
				setTimeout(function(){
					if(j % 2 === max % 2)
						leds[l].on();
					else
						leds[l].off();
					if( j === max -1)
						active=false;
					//console.log(l + ' after ' + j * blinkdur);
				},blinkdur * i);
			})(i,led);
		}
	}*/
}
/*
	ENV
	SECRET
		TCP_PORT
			BOUNCE_SERVER
*/
/*
	passphrase must be set
*/
if(!process.env.SECRET){
	console.log("please enter the secret passphrase");
	return;
}else{
	secret = process.env.SECRET;
}
if(process.env.TCP_PORT)
	tcpport = process.env.TCP_PORT;
if(process.env.BOUNCE_SERVER)
	bounceServer = process.env.BOUNCE_SERVER;

/*
	TCP SERVER
*/
tcpsocket.connect(tcpport,bounceServer,function(){
	logger.log('client connected to ' + bounceServer + ':' + tcpport + ' \t @' + (new Date()).toUTCString());
});
/*
	send the secret to the server
*/
tcpsocket.write( crypto.createHash('md5').update(secret).digest("hex") );


/*
	the server responds wether or not the connection has been accepted
*/
tcpsocket.on('data',function(data){
	logger.log('got data from server ' + (new Date()).toUTCString() + ' \n'+data.toString());
	if(leds && !active){
		//ALWAYS ACTIVE
		//active=true;
		rotateLeds();
	}
});
/*
	If the server is down or some other scenario, this event happenes and 
	with handling the event 'error' we avoid uncaught errors
*/
tcpsocket.on('error',function(err){
	logger.log('something weird happened\n'+err);
	/*
		CONNECT AGAIN?
	*/
	logger.log('CONNECTING AGAIN');
	tcpsocket.connect(tcpport,bounceServer,function(){
		logger.log('client connected to ' + bounceServer + ':' + tcpport + ' \t @' + (new Date()).toUTCString());
	});
});

/*
	TESTTESTTESTTEST
	to keep the connection alive
*/
function stayAliveMotherfucker(){
	tcpsocket.write( 'keepalive' );
	logger.log('keepalive ' + (new Date()).toUTCString());
}
setInterval(stayAliveMotherfucker,10000);