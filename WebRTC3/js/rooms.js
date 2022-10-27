'use strict';

var pcConfig = {//stun 서버, turn 서버
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }
    , {
        urls: "turn:numb.viagenie.ca"
        , credential: "muazkh"
        , username: "webrtc@live.com"
    }]
};

var room = localStorage.getItem('roomNm');

var socket = io.connect();


if (room !== '') {
    socket.emit('create or join', room);
}

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var caller = new RTCPeerConnection();//연결 객체 생성
var callee = new RTCPeerConnection(pcConfig);


navigator.mediaDevices.getUserMedia({//웹캠과 마이크의 권한 획득
    video: true
    , audio: false
})
    .then(gotStream)
    .catch(function (e) {
        alert('getUserMedia() error: ' + e.name);
    });

function gotStream(stream) {
    localVideo.srcObject = stream;
    caller.addStream(stream); //미디어 스트림 입력
    createOffer();
}

function createOffer() {//sdp 생성
    caller.createOffer()
        .then((sdp) => createOfferSuccess)
        .catch(function (e) {
            alert('createOffer() error: ' + e.name);
        });
}

function createOfferSuccess(sdp) {
    caller.setLocalDescription(sdp);
    callee.setRemoteDescription(sdp);
    callee.createAnswer()
        .then(() => createAnswerSuccess)
        .catch(function (e) {
            alert('createAnswer() error: ' + e.name);
        });
}

function createAnswerSuccess(sdp) {
    callee.setLocalDescription(sdp);
    caller.setRemoteDescription(sdp);
}

caller.onicecandidate = handlerCallerOnicecandidate;
callee.onicecandidate = handlerCalleeOnicecandidate;

function handlerCallerOnicecandidate(e) {
    if (e.candidate) callee.addIceCandidate(e.candidate);
}

function handlerCalleeOnicecandidate(e) {
    if (e.candidate) caller.addIceCandidate(e.candidate);
}

callee.onaddstream = handleeCalleeOnAddStream;

function handleeCalleeOnAddStream(e) {
    remoteVideo.srcObject = e.stream
}

function fnExitRoom() {

}