import { useRouter } from 'next/router';
import firebase from "../services/firebase";
import { useEffect, useState } from 'react';

export default () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(true);
        firebase.openUserMedia().then(() => {
            if (router.query.roomId) {
                firebase.joinRoomById(router.query.roomId).then(() => setLoading(false));
            }
        });

    }, [router.query])

    if (loading) {
        return <>loading</>
    }
    return (
        <>
            <video ref={video => video && (video.srcObject = firebase.localStream)} muted autoPlay playsInline  ></video>
            <video ref={video => video && (video.srcObject = firebase.remoteStream)} muted autoPlay playsInline  ></video>
            <video ref={video => video && (video.srcObject = firebase.remoteStream2)} muted autoPlay playsInline  ></video>
            <video id="#video4" autoPlay playsInline></video>
            <video id="#video5" autoPlay playsInline></video>
        </>
    )
}