'use strict';

var socket = window.io();

export var sendMessage = (type, payload) => socket.emit('message', room, { type, payload });
export var onMessage = (type, callback) => socket.on('message', message => (
  message.type === type && callback(message.payload)
));

var room = getParameterByName('room');

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}