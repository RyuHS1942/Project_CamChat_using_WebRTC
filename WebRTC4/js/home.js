'use strict';

var socket = io();


//룸이 존재하는지 확인
socket.on('isrooms', function(rooms, socket) {
    var s = Object.keys(socket);


    rooms = rooms.filter(x => s.includes(x));

    for(var x in rooms){
        fnMakeButton(rooms[x]);
    }
});

//그냥 클릭 했을 때 이벤트리스너가 없다면 실행되지 않음
document.addEventListener('click', function (e) {
    
    if (e.target && e.target.name == 'btnEnterRoom') {
        var room = e.target.value;
        
        window.location.href = "index.html?room=" + room;
    }
})

function fnMakeRoom() {//create and join

    window.room = prompt("Enter room name:");
    if(!room) return;

    window.location.href = "index.html?room=" + room;
}

function fnReload() {
    
    window.location.reload();
}

function fnMakeButton(room) {
    var html = '';
    

    html += '<div class="item" style="flex: 1 1 30%">';
    html += '   <img src="../no-image.png" style="width: 500px">';
    html += '   <input type="button" name="btnEnterRoom" value="'+room+'"></input>';
    html += '</div>';

    document.getElementById('container').insertAdjacentHTML("beforeend", html);
}