'use strict';

var socket = io();


socket.on('isrooms', function(rooms, socket) {
  var s = Object.keys(socket);

  rooms = rooms.filter(x => s.includes(x));
  console.log(rooms);
  for(var x in rooms){
      fnMakeButton(rooms[x]);
  }
});

document.addEventListener('click', function (e) {
    
  if (e.target && e.target.name == 'btnEnterRoom') {
      var room = e.target.value;
      
      window.location.href = "room.html?room=" + room;
  }
})

function fnMakeRoom() {

  window.room = prompt("Enter room name:");
  if(!room) return;
  fnMakeButton(room)
  //window.location.href = "room.html?room=" + room;
}

function fnMakeButton(room) {
  var html = '';
  

  html += '<div class="item" style="flex: 1 1 30%">';
  html += '   <img src="../no-image.png" style="width: 500px">';
  html += '   <span><input type="button" name="btnEnterRoom" value="'+room+'"></input></span>';
  html += '</div>';

  document.getElementById('container').insertAdjacentHTML("beforeend", html);
}