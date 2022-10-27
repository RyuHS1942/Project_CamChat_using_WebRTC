'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var numInRoom = document.getElementById('numInRoom');
var participation = document.getElementById('participation');
var btnRemove = document.getElementById('remove');
var btnExit = document.getElementById('exit');

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var photo = document.getElementById('photo');
var photoContext = photo.getContext('2d');

var photoContextW;
var photoContextH;

/*
* stun서버와 turn서버
* new RTCPeerConnection(pcConfig) 방식으로 사용 -> 현재는 null로 함
*/
var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }
    , {
    urls: "turn:numb.viagenie.ca"
    , credential: "muazkh"
    , username: "webrtc@live.com"
  }]
};

/*
* url에서 room 값을 가져오기
*/
var room = getParameterByName('room');


function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/****************************************************************************
* Signaling server
****************************************************************************/

var socket = io.connect();


/*
* socket.emit('name', param) -> 서버로 데이터 송신
* socket.on('name', function(param){실행할 코드})) -> 서버에서 데이터 수신
*/
if (room !== '') {
  socket.emit('create or join', room);
}

socket.on('created', function (numClients, whoIsRoom) {

  numInRoom.innerText = room + '(' + (numClients + 1) + ')' + '-' + socket.id;
  participation.innerText = whoIsRoom[0];

  localVideo.style.border = '4px solid #87CEEB';

  btnRemove.hidden = false;
  btnExit.hidden = true;

  isInitiator = true;
  socket.username = 'host';
});

socket.on('join', function (numClients, whoIsRoom) {

  numInRoom.innerText = '';
  numInRoom.innerText = room + '(' + (numClients + 1) + ')' + '-' + socket.id;

  participation.innerText = '';
  participation.innerText = whoIsRoom[0] + '\n' + whoIsRoom[1];

  isChannelReady = true;
});

socket.on('joined', function () {

  localVideo.style.border = '4px solid #87CEEB';

  isChannelReady = true;
  socket.username = 'guest';
});

socket.on('full', function () {

  alert('This room is full.');

  window.location.href = "home.html";
});

socket.on('log', function (array) {

  console.log.apply(console, array);
});

socket.on('bye', function () {

  if (!isInitiator) {
    window.location.reload();
  }
});

////////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message, room);
}

// This client receives a message
socket.on('message', function (message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
  }
});
/*
* 로컬비디오 스트리밍
*/
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
  .then(gotStream)
  .catch(function (e) {
    alert('getUserMedia() error: ' + e.name);
  });

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  localVideo.onloadedmetadata = function () {
    photo.width = photoContextW = localVideo.videoWidth;
    photo.height = photoContextH = localVideo.videoHeight;
  }
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}
/*
* 스크린 샷
* 데이터 채널 사용해서 데이터 주고 받을 때 사용할 수 있음. 데이터 채널은 구현 안함.
*/
function fnSnap() {
  photoContext.drawImage(localVideo, 0, 0, photo.width, photo.height);
}

var constraints = {
  video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

/*
* WebRTC 시작
* 객체 생성 -> sdp 생성 후 교환 -> ice 생성 후 교환 -> 연결 완료 & 스트리밍
*/
function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();//객체 생성
    pc.addStream(localStream);//로컬 비디오를 객체에 담음
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();//sdp생성 후 전송
    }
  }
}

/*
* 윈도우 창이 닫혔을 때
*/
window.onbeforeunload = function () {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////
/*
* 연결 객체 생성
*/
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);             //객체 생성
    pc.onicecandidate = handleIceCandidate;       //ice 생성 후 전송
    pc.onaddstream = handleRemoteStreamAdded;     //리모트 비디오 스트리밍
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}
/*
* ice후보 생성 & 전송
*/
function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}
/*
* remote 비디오 스트리밍
*/
function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}
/*
* turn서버
*/
function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}

/////////////////////////////////////////////////////////

function fnExit() {
  socket.emit('leaveGuest', room);

  window.location.href = "home.html";
}

socket.on('leaveGuest', function () {
  alert('guest leaved.');

  window.location.reload();
});

function fnRemove() {
  var result = confirm('Do you break room?');

  if (result) {
    socket.emit('breakRoom', room);
  }
}

socket.on('breakRoom', function () {
  alert('rooms is broke.');

  window.location.href = "home.html";
});

function fnReload() {
  socket.emit('reload', room);
}

socket.on('reload', function () {
  window.location.reload();
});