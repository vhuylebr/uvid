import * as firebase from "firebase/app";

import "firebase/auth";
import "firebase/firestore";

const configuration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};

firebase.peerConnection = null;
firebase.localStream = null;
firebase.remoteStream = null;
firebase.remoteStream2 = null;
firebase.roomId = null;
firebase.joinRoomById = async (roomId) => {
    const db = firebase.firestore();
    const roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    console.log('Got room:', roomSnapshot.exists);
    if (roomSnapshot.exists) {
        console.log('Create PeerConnection with configuration: ', configuration);
        firebase.peerConnection = new RTCPeerConnection(configuration);
        firebase.registerPeerConnectionListeners();
        firebase.localStream.getTracks().forEach(track => {
            firebase.peerConnection.addTrack(track, firebase.localStream);
        });
        const offers = await roomSnapshot.data().offers;
        console.log("Got offer:", offers[0]);
        firebase.idUser = offers.length;
        const calleeCandidatesCollection = roomRef.collection(`calleeCandidates${firebase.idUser}`);
        firebase.peerConnection.addEventListener('icecandidate', event => {
            if (!event.candidate) {
                console.log('Got final candidate!');
                return;
            }
            console.log('Got candidate: ', event.candidate);
            calleeCandidatesCollection.add(event.candidate.toJSON());
        });
        firebase.peerConnection.addEventListener('track', event => {
            console.log('Got remote track:', event.streams[0]);
            event.streams[0].getTracks().forEach(track => {
                console.log('Add a track to the remoteStream:', track);
                firebase.remoteStream.addTrack(track);
            });
        });
        if (firebase.idUser === 0) {
            const offer = await firebase.peerConnection.createOffer();
            console.log('Created offer:', offer);
            await firebase.peerConnection.setLocalDescription(offer);
            const roomWithAnswer = {
                offers: [{
                    type: offer.type,
                    sdp: offer.sdp,
                }],
            };
            await roomRef.update(roomWithAnswer);
            roomRef.onSnapshot(async snapshot => {
                const data = snapshot.data();
                if (!firebase.peerConnection.currentRemoteDescription && data && data.offers[1]) {
                    console.log('Got remote description: ', data.offers[1]);
                    const rtcSessionDescription = new RTCSessionDescription(data.offers[1]);
                    await firebase.peerConnection.setRemoteDescription(rtcSessionDescription);
                }
            });
            roomRef.collection(`calleeCandidates${1}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                        await firebase.peerConnection.addIceCandidate(new RTCIceCandidate(data));
                    }
                });
            });
        } else {
            await firebase.peerConnection.setRemoteDescription(new RTCSessionDescription(offers[0]));
            const answer = await firebase.peerConnection.createAnswer();
            console.log('Created answer:', answer);
            await firebase.peerConnection.setLocalDescription(answer);
            const roomWithAnswer = {
                offers: [...offers, {
                    type: answer.type,
                    sdp: answer.sdp,
                }],
            };
            await roomRef.update(roomWithAnswer);
            roomRef.collection(`calleeCandidates${0}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                        await firebase.peerConnection.addIceCandidate(new RTCIceCandidate(data));
                    }
                });
            });
        }
    }
}
firebase.createRoom = async () => {
    const db = firebase.firestore();
    const roomRef = await db.collection('rooms').doc();

    await roomRef.set({
        offers: []
    });
    firebase.roomId = roomRef.id;
    console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);

    return roomRef.id;
}

firebase.registerPeerConnectionListeners = () => {
    firebase.peerConnection.addEventListener('icegatheringstatechange', () => {
        console.log(
            `ICE gathering state changed: ${firebase.peerConnection.iceGatheringState}`);
    });

    firebase.peerConnection.addEventListener('connectionstatechange', () => {
        console.log(`Connection state change: ${firebase.peerConnection.connectionState}`);
    });

    firebase.peerConnection.addEventListener('signalingstatechange', () => {
        console.log(`Signaling state change: ${firebase.peerConnection.signalingState}`);
    });

    firebase.peerConnection.addEventListener('iceconnectionstatechange ', () => {
        console.log(
            `ICE connection state change: ${firebase.peerConnection.iceConnectionState}`);
    });
}

firebase.openUserMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(
        { video: true, audio: true });
    firebase.localStream = stream;
    firebase.remoteStream = new MediaStream();
    firebase.remoteStream2 = new MediaStream();
}

const firebaseConfig = {
    apiKey: "AIzaSyA5ukzvCh3LBVM0798kbq-Mvw06bOxTHwE",
    authDomain: "uvid-88fcd.firebaseapp.com",
    databaseURL: "https://uvid-88fcd.firebaseio.com",
    projectId: "uvid-88fcd",
    storageBucket: "uvid-88fcd.appspot.com",
    messagingSenderId: "420003435189",
    appId: "1:420003435189:web:c6cf0960b1237ae756a4fc",
    measurementId: "G-ND5RTXVHVW"
};

if (firebase.isInitialized === undefined) {
    firebase.initializeApp(firebaseConfig);
    firebase.isInitialized = true;
}

export default firebase;    