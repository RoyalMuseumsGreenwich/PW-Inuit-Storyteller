var net         = require('net'),
    express     = require('express'),
    cors        = require('cors'),
    bodyParser  = require('body-parser'),
    logger      = require('morgan');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

var PORT = 4886; 
var IP = '172.16.4.33';
// var IP = '172.16.13.115';      //  Uncomment for production IP

var status = {
  type: 'playing'
}


//  'Player' regularly polls for new status
app.get('/status', function(req, res) {
  console.log("Get request to status!")
  res.send(JSON.stringify(status));
});

//  'Controller' sets status when user control requests are made
app.post('/status', function(req, res) {
  console.log(req.body);
  console.log("Post received to status!");
  if(req.body !== status) {
    console.log("Updating status...");
    status = req.body;
  }
  res.send(JSON.stringify(status));
});

//  Listen for requests
app.listen(PORT, IP, function() {
  console.log("Server started");
});

