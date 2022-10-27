'use strict';

var rooms = new Set();

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');
const { disconnect } = require('process');

var fileServer = new (nodeStatic.Server)();
var app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(3000);

var io = socketIO.listen(app);

/*
* socket.emit('name', param) -> 데이터를 보낸 클라이언트로 데이터 송신
* socket.broadcast.emit('name', param) -> 데이터를 보낸 클라이언트를 제외한 모두(룸 안의)에게 데이터 송신
* socket.in('room').emit('name', param) -> 'room' 안 데이터를 보낸 클라이언트를 제외한 인원들에게 데이터 송신 //to('room') 같은 기능
* io.emit('name', param) -> 데이터를 보낸 클라이언트를 포함한 모두에게 데이터 송신
* socket.on('name', function(param){실행할 코드})) -> 클라이언트에서 데이터 수신
*/
io.sockets.on('connection', function (socket) {

  socket.emit('isrooms', Array.from(rooms), io.sockets.adapter.rooms);

  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function (message, room) {
    log('Client said: ', message);
    socket.in(room).emit('message', message);
  });

  socket.on('create or join', function (room) {
    log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;


    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.username = 'host';
      socket.join(room);

      rooms.add(room);
      socket.emit('created', numClients, Object.keys(io.sockets.adapter.rooms[room]['sockets']));

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      socket.username = 'guest';
      socket.join(room);

      io.sockets.in(room).emit('join', numClients, Object.keys(io.sockets.adapter.rooms[room]['sockets']));
      socket.emit('joined');

    } else {
      socket.emit('full', room);
    }
  });

  socket.on('leaveGuest', function (room) {
    socket.in(room).emit('leaveGuest');
  });

  socket.on('breakRoom', function (room) {
    io.in(room).emit('breakRoom');
  });

  socket.on('reload', function (room) {
    io.in(room).emit('reload');
  });

  socket.on('disconnect', function (reason) {
    //socket.broadcast.emit('bye');
  });
});