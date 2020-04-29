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
firebase.maxNbUser = 5;
firebase.peerConnection = null;
firebase.peerConnections = [];
firebase.peerConnection2 = null;
firebase.localStream = null;
firebase.remoteStream = null;
firebase.remoteStreams = Array(4);
firebase.remoteStream2 = null;
firebase.roomId = null;
firebase.joinRoomById = async (roomId) => {
    const db = firebase.firestore();
    const roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    if (roomSnapshot.exists) {
        const offers = await roomSnapshot.data();
        firebase.idUser = Object.keys(offers).length;
        const calleeCandidatesCollection = roomRef.collection(`calleeCandidates${firebase.idUser}`);
        for (let i = 0; i < firebase.maxNbUser; i++) {
            firebase.peerConnections.push(new RTCPeerConnection(configuration));
            firebase.localStream.getTracks().forEach(track => {
                firebase.peerConnections[i].addTrack(track, firebase.localStream);
            });
            firebase.peerConnections[i].addEventListener('icecandidate', event => {
                if (!event.candidate) {
                    return;
                }
                calleeCandidatesCollection.add(event.candidate.toJSON());
            });
            firebase.peerConnections[i].addEventListener('track', event => {
                event.streams[0].getTracks().forEach(track => {
                    firebase.remoteStreams[i].addTrack(track);
                });
            });
        }

        const arr = [];
        for (let i = 0; i < firebase.idUser; i++) {
            await firebase.peerConnections[i].setRemoteDescription(new RTCSessionDescription(offers[`offer${i}`][firebase.idUser]));
            const answer = await firebase.peerConnections[i].createAnswer();
            await firebase.peerConnections[i].setLocalDescription(answer);
            arr.push({
                type: answer.type,
                sdp: answer.sdp,
            })
        }
        arr.push(null);
        for (let i = firebase.idUser; i < firebase.maxNbUser - 1; i++) {
            const offer = await firebase.peerConnections[i].createOffer();
            await firebase.peerConnections[i].setLocalDescription(offer);
            arr.push({
                type: offer.type,
                sdp: offer.sdp,
            })
        }
        const roomWithAnswer = {
            [`offer${firebase.idUser}`]: arr,
        };
        await roomRef.update(roomWithAnswer);
        roomRef.onSnapshot(async snapshot => {
            const data = snapshot.data();
            for (let i = firebase.idUser; i < firebase.maxNbUser - 1; i++) {
                if (!firebase.peerConnections[i].currentRemoteDescription && data && data[`offer${i + 1}`]) {
                    const rtcSessionDescription = new RTCSessionDescription(data[`offer${i + 1}`][firebase.idUser]);
                    await firebase.peerConnections[i].setRemoteDescription(rtcSessionDescription);
                }
            }
        });
        for (let i = 0; i < firebase.maxNbUser; i++) {
            if (i === firebase.idUser)
                continue;
            roomRef.collection(`calleeCandidates${i}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        await firebase.peerConnections[i > firebase.idUser ? i - 1 : i].addIceCandidate(new RTCIceCandidate(data));
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
    firebase.remoteStreams = Array.from(Array(4).keys()).map(() => new MediaStream());
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