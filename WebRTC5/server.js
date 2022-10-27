'use strict'

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');


var fileServer = new (nodeStatic.Server)();
var app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(3000);

var io = socketIO.listen(app);

var today = new Date();

var hour = today.getHours();
var min = today.getMinutes();
var sec = today.getSeconds();


io.sockets.on('connection', function(socket){

  function log() {
    var array = [hour+':'+min+':'+sec+' Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function (message, room) {
    log(hour+':'+min+':'+sec+' Client said: ', message);
    socket.in(room).emit('message', message);
  });
});