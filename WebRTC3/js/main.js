'use strict';

function fnMakeRoom() {//create and join

    // Could prompt for room name:
    window.room = prompt("Enter room name:");
    localStorage.setItem('roomNm', room);

    var newBtn = document.createElement('input');


    newBtn.type = 'button';
    newBtn.value = room;
    newBtn.name = 'btnEnterRoom';
    newBtn.class = 'btnEnterRoom';

    document.getElementById('preview').append(newBtn);

    window.location.href = "rooms.html";
}

document.addEventListener('click', function (e) {
    if (e.target && e.target.name == 'btnEnterRoom') {

        localStorage.setItem('roomNm', e.target.value);

        window.location.href = "rooms.html";
    }
})