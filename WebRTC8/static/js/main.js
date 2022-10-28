
var ws;
var peerConn;

var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var chating = document.getElementById('chating');
var sessionId = document.getElementById('sessionId');
var chatting = document.getElementById('chatting');
var yourName = document.getElementById('yourName');
var userName = document.getElementById('userName');
var yourMsg = document.getElementById('yourMsg');


function wsOpen() {
	ws = new WebSocket("ws://" + location.host + "/WebRTC");
	peerConn = new RTCPeerConnection();

	wsEvt();
}

function wsEvt() {
	ws.onopen = function (data) {
		send("시스템", userName.value + "님 입장하셨습니다.");
		//streaming();
	}

	ws.onmessage = function (data) {
		var msg = data.data;
		if (msg != null && msg.trim() != '') {
			var d = JSON.parse(msg);

			if (d.type == "getId") {
				var si = d.sessionId != null ? d.sessionId : "";
				if (si != '') {
					sessionId.value = si;
				}
			} else if (d.type == "message") {
				if (d.sessionId == sessionId.value) {
					chating.innerHTML += "<p class='me'>나 :" + d.msg + "</p>";
				} else {
					chating.innerHTML += "<p class='others'>" + d.userName + " : " + d.msg + "</p>";
				}

				//chating.scrollTop(chating.scrollHeight);

			} else if (d.type == "SDP") {
				chating.innerHTML += "<p class='others'>" + d.type + " : " + d.payload + "</p>";
				var SDPpair = new RTCSessionDescription(d.payload);
				peerConn.setRemoteDescription(SDPpair);
				if (d.payload.type === 'offer') {
					sendSdpAnswer();
				}

			} else if (d.type == "ICE") {
				chating.innerHTML += "<p class='others'>" + d.type + " : " + d.payload + "</p>";
				peerConn.addIceCandidate(new RTCIceCandidate({
					candidate: d.payload.candidate,
					sdpMLineIndex: d.payload.label,
					sdpMid: d.payload.id
				}));

			} else {
				console.warn("unknown type!")
			}
		}
	}

	document.addEventListener("keypress", function (e) {
		if (e.keyCode == 13) { //enter press
			send("", "");
		}
	});
}

function chatName() {
	if (userName.value == null || userName.value.trim() == "") {
		alert("사용자 이름을 입력해주세요.");
		userName.focus();
	} else {
		wsOpen();
		yourName.style.display = 'none';
		yourMsg.style.display = "block";
	}
}

function send(name, welcome) {
	var option = {
		type: "message"
		, sessionId: sessionId.value
		, userName: name != "" ? name : userName.value
		, msg: welcome != "" ? welcome : chatting.value
	}
	ws.send(JSON.stringify(option));
	chatting.value = "";
}

function sendMessage(type, payload) {
	var option = {
		type: type
		, payload: payload
	}
	chating.innerHTML += "<p class='me'>나 :" + option.type + " : " + option.payload + "</p>";
	ws.send(JSON.stringify(option));
}

function disconnect() {
	var option = {
		type: "message"
		, sessionId: sessionId.value
		, userName: userName.value
		, msg: "님 퇴장하셨습니다."
	}
	ws.send(JSON.stringify(option));
	ws.close();

	sessionId.value = "";

	yourName.style.display = "block";
	userName.value = "";

	yourMsg.style.display = 'none';
	chatting.value = "";
}

async function sendSdpOffer() {
	var sdpOffer = await peerConn.createOffer();
	await peerConn.setLocalDescription(sdpOffer);
	sendMessage('SDP', sdpOffer)
};

async function sendSdpAnswer() {
	var sdpAnswer = await peerConn.createAnswer();
	await peerConn.setLocalDescription(sdpAnswer);
	sendMessage('SDP', sdpAnswer);
};

function streaming() {
	navigator.mediaDevices
		.getUserMedia({ video: true, audio: false })
		.then(mediaStream => {
			localVideo.srcObject = mediaStream;
			mediaStream.getTracks().forEach(track => peerConn.addTrack(track));
		});

	// exchange SDP
	peerConn.addEventListener('negotiationneeded', () => sendSdpOffer)
	//on

	// exchange ICE
	peerConn.onicecandidate = (event) => {
		if (event.candidate) {
			var option = {
				type: 'candidate',
				label: event.candidate.sdpMLineIndex,
				id: event.candidate.sdpMid,
				candidate: event.candidate.candidate
			}

			sendMessage('ICE', option);
		}
	};
	//on

	// handle remote stream
	peerConn.addEventListener('track', e => remoteVideo.srcObject = new MediaStream([e.track]));
}