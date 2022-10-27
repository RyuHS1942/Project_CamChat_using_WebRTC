'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new (nodeStatic.Server)();
var app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(3000);

var io = socketIO.listen(app);


io.sockets.on('connection', function (socket) {
  
  socket.on('create or join', function (room) {
    console.log('room : ' + io.sockets.adapter.rooms);
    
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    
    console.log('Room ' + room + ' now has ' + numClients + ' client(s)');
    
    if (numClients === 0) {
      socket.join(room);
      console.log('Client ID ' + socket.id + ' created room ' + room);
    } else if (numClients === 1) {
      console.log('Client ID ' + socket.id + ' joined room ' + room);
      socket.join(room);
    } else { // max two clients
      //socket.to(socket.id).emit('full', room);
    }
  });
});