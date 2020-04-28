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
firebase.peerConnection2 = null;
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
        firebase.peerConnection = new RTCPeerConnection(configuration);
        firebase.peerConnection2 = new RTCPeerConnection(configuration);

        firebase.registerPeerConnectionListeners();
        firebase.localStream.getTracks().forEach(track => {
            firebase.peerConnection.addTrack(track, firebase.localStream);
            firebase.peerConnection2.addTrack(track, firebase.localStream);
        });
        const offers = await roomSnapshot.data();
        firebase.idUser = Object.keys(offers).length;
        console.log(offers, firebase.idUser);
        const calleeCandidatesCollection = roomRef.collection(`calleeCandidates${firebase.idUser}`);
        firebase.peerConnection.addEventListener('icecandidate', event => {
            if (!event.candidate) {
                return;
            }
            calleeCandidatesCollection.add(event.candidate.toJSON());
        });
        firebase.peerConnection2.addEventListener('icecandidate', event => {
            if (!event.candidate) {
                return;
            }
            calleeCandidatesCollection.add(event.candidate.toJSON());
        });
        firebase.peerConnection.addEventListener('track', event => {
            event.streams[0].getTracks().forEach(track => {
                console.log('Add a track to the remoteStream:', track);
                firebase.remoteStream.addTrack(track);
            });
        });
        firebase.peerConnection2.addEventListener('track', event => {
            event.streams[0].getTracks().forEach(track => {
                console.log('Add a track to the remoteStream:', track);
                firebase.remoteStream2.addTrack(track);
            });
        });
        if (firebase.idUser === 0) {
            const offer = await firebase.peerConnection.createOffer();
            const offer2 = await firebase.peerConnection2.createOffer();
            await firebase.peerConnection.setLocalDescription(offer);
            await firebase.peerConnection2.setLocalDescription(offer2);
            const roomWithAnswer = {
                offer0: [{}, {
                    type: offer.type,
                    sdp: offer.sdp,
                }, {
                    type: offer2.type,
                    sdp: offer2.sdp,
                }],
            };
            await roomRef.update(roomWithAnswer);
            roomRef.onSnapshot(async snapshot => {
                const data = snapshot.data();
                if (!firebase.peerConnection.currentRemoteDescription && data && data.offer1) {
                    const rtcSessionDescription = new RTCSessionDescription(data.offer1[0]);
                    await firebase.peerConnection.setRemoteDescription(rtcSessionDescription);
                }
                if (!firebase.peerConnection2.currentRemoteDescription && data && data.offer2) {
                    const rtcSessionDescription = new RTCSessionDescription(data.offer2[0]);
                    await firebase.peerConnection2.setRemoteDescription(rtcSessionDescription);
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
            roomRef.collection(`calleeCandidates${2}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                        await firebase.peerConnection2.addIceCandidate(new RTCIceCandidate(data));
                    }
                });
            });
        } else if (firebase.idUser === 1) {
            await firebase.peerConnection.setRemoteDescription(new RTCSessionDescription(offers.offer0[1]));
            const offer2 = await firebase.peerConnection2.createOffer();
            const answer = await firebase.peerConnection.createAnswer();
            await firebase.peerConnection.setLocalDescription(answer);
            await firebase.peerConnection2.setLocalDescription(offer2);
            roomRef.onSnapshot(async snapshot => {
                const data = snapshot.data();
                if (!firebase.peerConnection2.currentRemoteDescription && data && data.offer2) {
                    const rtcSessionDescription = new RTCSessionDescription(data.offer2[1]);
                    await firebase.peerConnection2.setRemoteDescription(rtcSessionDescription);
                }
            });
            const roomWithAnswer = {
                offer1: [{
                    type: answer.type,
                    sdp: answer.sdp,
                }, {}, {
                    type: offer2.type,
                    sdp: offer2.sdp
                }],
            };
            await roomRef.update(roomWithAnswer);
            roomRef.collection(`calleeCandidates${0}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        await firebase.peerConnection.addIceCandidate(new RTCIceCandidate(data));
                    }
                });
            });
            roomRef.collection(`calleeCandidates${2}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        await firebase.peerConnection2.addIceCandidate(new RTCIceCandidate(data));
                    }
                });
            });
        } else if (firebase.idUser === 2) {
            await firebase.peerConnection.setRemoteDescription(new RTCSessionDescription(offers.offer0[2]));
            await firebase.peerConnection2.setRemoteDescription(new RTCSessionDescription(offers.offer1[2]));;
            const answer = await firebase.peerConnection.createAnswer();
            const answer2 = await firebase.peerConnection2.createAnswer();
            await firebase.peerConnection.setLocalDescription(answer);
            await firebase.peerConnection2.setLocalDescription(answer2);
            const roomWithAnswer = {
                offer2: [{
                    type: answer.type,
                    sdp: answer.sdp,
                }, {
                    type: answer2.type,
                    sdp: answer2.sdp
                }, {}],
            };
            await roomRef.update(roomWithAnswer);
            roomRef.collection(`calleeCandidates${0}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        await firebase.peerConnection.addIceCandidate(new RTCIceCandidate(data));
                    }
                });
            });
            roomRef.collection(`calleeCandidates${1}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        await firebase.peerConnection2.addIceCandidate(new RTCIceCandidate(data));
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