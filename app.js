var game = require('./lib/game.js');
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log('Server listening at port %d', port);
});
app.use(express.static(__dirname + '/public'));

app.get( '/', function( req, res ){ 
    res.sendFile( __dirname + '/public/index.html' );
});

app.get( '/2D', function( req, res ){ 
    res.sendFile( __dirname + '/public/2D.html' );
});

app.get( '/3D', function( req, res ){ 
    res.sendFile( __dirname + '/public/3D.html' );
});

io.on('connection', (socket) => {
  console.log(socket.id);
	var addedUser = false;
	socket.on('update', (data) => {
    console.log(socket.id);
		var message = JSON.parse(data);
		if (!game.room['users'])
		{
			game.room = {
				'users' : [message['user']], 
				'usersIds' : [socket.id]
			};
		}
		else
		{
			if (game.room['users'].indexOf(message['user']) != -1)
			{
				message['type'] = 'error';
				message['error'] = 'Error: The player \'' + message['user'] + '\' is in the game.';
			}
			else
			{
				if ((message['user'] != undefined) && (message['user'] != ''))
				{
					game.room['users'].push(message['user']);
					game.room['usersIds'].push(socket.id);
					message['usersInRoom'] = [...game.room['users']];
				}
			}
		}
    message['id'] = socket.id;console.log(message);
    socket.emit('update', message);
    socket.broadcast.emit('update', message);
	});
	socket.on('expectatorNeedsInfo', (data) => {
    var message = JSON.parse(data);
    socket.emit('returningGameInfo', message);
    socket.broadcast.emit('returningGameInfo', message);
  });
  socket.on('drawing', (data) => {
    var message = JSON.parse(data);
    socket.emit('drawing', message);
    socket.broadcast.emit('drawing', message);
  });
  socket.on('chatMsg', (data) => {
    var message = JSON.parse(data);
    socket.emit('chatMsg', message);
    socket.broadcast.emit('chatMsg', message);
  });
  socket.on('disconnect', () => {
    console.log(socket.id);
    if (game.room['usersIds'] && game.room['usersIds'].length)
    {
  		userInfo = game.userDisconected(socket.id);
      var message = {
        'type' : 'userDisconected', 
        'user' : userInfo
      }
      socket.broadcast.emit('userDisconected', message);
    }
	});
});
