var express 		= require('express'),
		bodyParser 	= require('body-parser'),
		cors				=	require('cors'),
		sendevent 	= require('sendevent');
var app = express();

app.use(cors());
 
// create a middlware that handles requests to `/eventstream`
var events = sendevent('/eventstream');
 
app.use(events);
app.use(bodyParser.urlencoded({extended: true}));
//	Serve contents of 'player' directory
app.use(express.static('player'));

var PORT = 4886;
var IP = '127.0.0.1';
// var IP = '172.16.4.33';
// // var IP = '172.16.13.115';      //  Uncomment for production IP



// serve an empty page that just loads the browserify bundle
app.get('/', function(req, res) {
  res.send('index.html');
});
 
app.post('/status', function(req, res) {
	console.log(req.body);
	status = JSON.stringify(req.body);
	events.broadcast(status);
	res.send(status);
});


// broadcast data to all connected clients every 10 seconds
// setInterval(function() {
// 	console.log("Broadcasting...");
//   events.broadcast({ time: Date.now() });
// }, 1000);

// //  Listen for requests
app.listen(PORT, IP, function() {
  console.log("Server started");
});

