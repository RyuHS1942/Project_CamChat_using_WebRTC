'use strict';

import {onMessage, sendMessage} from "./message.js";

var callButton = document.getElementById('call');
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var peerConn = new RTCPeerConnection();

/*var pcConfig = {// stun 서버, turn 서버
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }
    , {
        urls: "turn:numb.viagenie.ca"
        , credential: "muazkh"
        , username: "webrtc@live.com"
    }]
};*/

var sendSdpOffer = async () => {
  var sdpOffer = await peerConn.createOffer();
  await peerConn.setLocalDescription(sdpOffer);
  sendMessage('SDP', sdpOffer)
};

var sendSdpAnswer = async () => {
  var sdpAnswer = await peerConn.createAnswer();
  await peerConn.setLocalDescription(sdpAnswer);
  sendMessage('SDP', sdpAnswer);
};

navigator.mediaDevices
  .getUserMedia({video: true, audio: false})
  .then(mediaStream => {
    localVideo.srcObject = mediaStream;
    mediaStream.getTracks().forEach(track => peerConn.addTrack(track));
  });

// exchange SDP
peerConn.addEventListener('negotiationneeded', () => callButton.disabled = false)
callButton.addEventListener('click', sendSdpOffer)
onMessage('SDP', async receiptedSDP => {
  var SDPpair = new RTCSessionDescription(receiptedSDP);
  await peerConn.setRemoteDescription(SDPpair);
  if (receiptedSDP.type === 'offer') {
    callButton.disabled = true
    await sendSdpAnswer();
  }
})

// exchange ICE
peerConn.addEventListener('icecandidate', e => e.candidate == null || sendMessage('ICE', e.candidate));
onMessage('ICE', candidateInit => peerConn.addIceCandidate(new RTCIceCandidate(candidateInit)))

// handle remote stream
peerConn.addEventListener('track', e => remoteVideo.srcObject = new MediaStream([e.track]));