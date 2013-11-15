var net = require('net'),
	fs = require('fs'),
	logger = require('./logger.js'),
	crypto = require('crypto'),
	tcpport = 3004,
	tcpsocket = new net.Socket({allowHalfOpen: false}), /*i have no idea what I'm doing*/
	bounceServer = 'localhost',
	secret = '';

var anim =rotateLeds;

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
	leds=null,
	aliveLed=null,
	ledsArray = ['red','yellow1','green','yellow2'];

board.on("ready", function() {
	logger.log('board is ready ' + (new Date()).toUTCString());
	leds = {};
	leds.red = new five.Led(11);
	leds.yellow1 = new five.Led(10);
	leds.green = new five.Led(9);
	leds.yellow2 = new five.Led(6);
	aliveLed = new five.Led(5);
});


function ledMadness(duration){
	var pulse = 30;
	for(var i=0;i<duration;i+=pulse){
		(function(j){
			setTimeout(function(){
				var on = Math.floor(Math.random()*1.9) === 0 ? true : false;
				var l = ledsArray[Math.floor(Math.random()*ledsArray.length) ];
				if(on)
					leds[l].pulse(pulse);
				else
					leds[l].stop().off();
				/*turn the leds off*/
				if(j>=duration-pulse){
					var k=0;
					while(ll=ledsArray[k++])
						leds[ll].stop().off();
				}
			},j);
		})(i);
	}
}

function rotateLeds(duration){
	var lastStateLed = [true,true,true,true],
		dur = 80;
	for(var i=j=0;i<duration;i+=dur,j++){
		lastStateLed[j%lastStateLed.length] = !lastStateLed[j%lastStateLed.length];
		(function(time,ledid,lsl){
			setTimeout(function(){
				var l = ledsArray[ledid % ledsArray.length];
				//console.log(l + ' ' + lsl + ' after ' + time);
				if(lsl)
					leds[l].on();
				else
					leds[l].off();
				if(time >= duration - dur)
					for(var k=0;k<ledsArray.length;k++)
						leds[ledsArray[k]].off();
			},time);
		})(i,j,lastStateLed[j%lastStateLed.length]);
	}
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
	if(leds){
		anim(2000);
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
	areYouAliveMotherfucker();
	logger.log('keepalive ' + (new Date()).toUTCString());
}
function areYouAliveMotherfucker(){
	if(aliveLed){
		aliveLed.on();
		setTimeout(function(){
			aliveLed.off();
		},1000);
	}
}
setInterval(stayAliveMotherfucker,10000);