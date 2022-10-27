'use strict';

var room = getParameterByName('room');
var socket = io.connect();

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

////////////////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var localStream;
var remoteStream;

var peerConn;


peerConn = new RTCPeerConnection(null);

navigator.mediaDevices.getUserMedia({
    audio: false
    , video: true
})
    .then(gotStream)
    .catch(function (e) {
        alert('getUserMedia() error: ' + e.name);
    });

function gotStream(stream) {
    localStream = stream.getTracks().forEach(track => peerConn.addTrack(track));
    localVideo.srcObject = stream;
}

///////////////////////////////////////////////////////////////////

function sendMessage(message) {
    console.log(hour+':'+min+':'+sec+' Client sending message: ', message);
    socket.emit('message', message);
}

socket.on('log', function (message) {
    console.log(hour+':'+min+':'+sec+' Client received message: ', message);
    switch (message.type) {
        case 'offer':
            peerConn.setRemoteDescription(new RTCSessionDescription(message));
            var answerSDP = peerConn.createAnswer();
            console.log(answerSDP);
            peerConn.setLocalDescription(answerSDP);
            socket.emit('message', answerSDP);
        case 'answer':
            peerConn.setRemoteDescription(new RTCSessionDescription(message));
        case 'candidate':
            peerConn.addIceCandidate(new RTCIceCandidate({
                candidate: message.candidate,
                sdpMLineIndex: message.label,
                sdpMid: message.id
            }));
    }
});

////////////////////////////////////////////////////////////////

//var peerConn;

// stun 서버, turn 서버
/*var pcConfig = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }
    , {
        urls: "turn:numb.viagenie.ca"
        , credential: "muazkh"
        , username: "webrtc@live.com"
    }]
};*/


//peerConn = new RTCPeerConnection(null);
console.log(peerConn);

var sdp = peerConn.createOffer();
console.log('sdp : ', sdp);
peerConn.setLocalDescription(sdp);
sendMessage(sdp);

peerConn.onicecandidate = (event) => {
    console.log('candidate event : ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    }
};

peerConn.onaddstream = (event) => {
    remoteStream = event.track;
    remoteVideo.srcObject = remoteStream;
};


