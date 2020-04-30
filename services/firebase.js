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
firebase.maxNbUser = 2;
firebase.peerConnections = [];
firebase.localStream = null;
firebase.remoteStreams = Array(4);
firebase.roomId = null;
firebase.joinRoomById = async (roomId, name, setNames) => {
    const db = firebase.firestore();
    const roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    if (roomSnapshot.exists) {
        const offers = await roomSnapshot.data();
        firebase.idUser = Object.keys(offers).length;
        firebase.localStream.name = name;
        for (let i = 0; i < firebase.maxNbUser; i++) {
            firebase.peerConnections.push(new RTCPeerConnection(configuration));
            firebase.localStream.getTracks().forEach(track => {
                firebase.peerConnections[i].addTrack(track, firebase.localStream);
            });
            firebase.peerConnections[i].addEventListener('track', event => {
                console.log("Got remote tracks", i)
                event.streams[0].getTracks().forEach(track => {
                    console.log('Add a track to the remoteStream: ', i, " tracks = ", track);
                    firebase.remoteStreams[i].addTrack(track);
                });
            });
            const calleeCandidatesCollection = roomRef.collection(`calleeCandidates${firebase.idUser}${i >= firebase.idUser ? i + 1 : i}`);
            firebase.peerConnections[i].addEventListener('icecandidate', event => {
                if (!event.candidate) {
                    console.log('Got final candidate! for user ', i);
                    return;
                }
                console.log('Got candidate: ', event.candidate, " for user ", i);
                calleeCandidatesCollection.add(event.candidate.toJSON());
            });
        }

        const arr = [];
        for (let i = 0; i < firebase.idUser; i++) {
            await firebase.peerConnections[i].setRemoteDescription(new RTCSessionDescription(offers[`offer${i}`].offers[firebase.idUser]));
            console.log('Got offer:', offers[`offer${i}`].offers[firebase.idUser], " from user ", i);
            setNames(names => {
                names[i] = offers[`offer${i}`].name;
                return [...names];
            });
            const answer = await firebase.peerConnections[i].createAnswer();
            console.log('Created answer:', answer, ", For user ", i);
            await firebase.peerConnections[i].setLocalDescription(answer);
            arr.push({
                type: answer.type,
                sdp: answer.sdp,
            })
        }
        arr.push(null);
        for (let i = firebase.idUser; i < firebase.maxNbUser - 1; i++) {
            const offer = await firebase.peerConnections[i].createOffer();
            console.log('Created offer:', offer, " for user ", i);
            await firebase.peerConnections[i].setLocalDescription(offer);
            arr.push({
                type: offer.type,
                sdp: offer.sdp,
            })
        }
        const roomWithAnswer = {
            [`offer${firebase.idUser}`]: {
                name,
                offers: arr
            },
        };
        await roomRef.update(roomWithAnswer);
        roomRef.onSnapshot(async snapshot => {
            const data = snapshot.data();
            for (let i = firebase.idUser; i < firebase.maxNbUser - 1; i++) {
                if (!firebase.peerConnections[i].currentRemoteDescription && data && data[`offer${i + 1}`]) {
                    console.log('Got remote description: ', data[`offer${i + 1}`], " from user ", i);
                    const rtcSessionDescription = new RTCSessionDescription(data[`offer${i + 1}`].offers[firebase.idUser]);
                    setNames(names => {
                        names[i] = data[`offer${i + 1}`].name;
                        return [...names];
                    });
                    await firebase.peerConnections[i].setRemoteDescription(rtcSessionDescription);
                }
            }
        });
        for (let i = 0; i < firebase.maxNbUser; i++) {
            if (i === firebase.idUser)
                continue;
            roomRef.collection(`calleeCandidates${i}${firebase.idUser}`).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
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
    await roomRef.set({});
    firebase.roomId = roomRef.id;
    return roomRef.id;
}


firebase.openUserMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(
        { video: true, audio: true });
    firebase.localStream = stream;
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