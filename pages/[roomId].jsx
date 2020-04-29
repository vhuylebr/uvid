import { useRouter } from 'next/router';
import firebase from "../services/firebase";
import { useState } from 'react';
import { Grid } from 'semantic-ui-react';
import Form from '../components/Form';
import Cookies from "js-cookie";

export default () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isSettingName, setSettingName] = useState(true);
    const onSubmit = () => {
        setLoading(true);
        firebase.openUserMedia().then(() => {
            if (router.query.roomId) {
                firebase.joinRoomById(router.query.roomId).then(() => {
                    setLoading(false);
                    setSettingName(false);
                });
            }
        });

    };
    if (isSettingName) {
        return <Form defaultValue={Cookies.get('name') || ""} onSubmit={onSubmit} loading={loading} />
    }
    return (
        <Grid centered>
            <Grid.Row columns={3} centered>
                <Grid.Column verticalAlign="middle" stretched >
                    <video ref={video => video && (video.srcObject = firebase.localStream)} muted autoPlay ></video>
                </Grid.Column>
                <Grid.Column verticalAlign="middle" stretched >
                    <video ref={video => video && (video.srcObject = firebase.remoteStreams[0])} muted autoPlay  ></video>
                </Grid.Column>
                <Grid.Column verticalAlign="middle" stretched >
                    <video ref={video => video && (video.srcObject = firebase.remoteStreams[1])} muted autoPlay  ></video>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={3} centered>
                <Grid.Column verticalAlign="middle" stretched >
                    <video ref={video => video && (video.srcObject = firebase.remoteStreams[2])} muted autoPlay  ></video>
                </Grid.Column>
                <Grid.Column verticalAlign="middle" stretched >
                    <video ref={video => video && (video.srcObject = firebase.remoteStreams[3])} muted autoPlay  ></video>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}