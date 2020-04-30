import { useRouter } from 'next/router';
import firebase from "../services/firebase";
import { useState } from 'react';
import { Grid, Button, Label } from 'semantic-ui-react';
import Form from '../components/Form';
import Cookies from "js-cookie";

const styleLabel = { position: "absolute", bottom: "3%", right: "10%", backgroundColor: "#1d1732", color: "white" };

export default () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [names, setNames] = useState(["", "", "", ""])
    const [isSettingName, setSettingName] = useState(true);
    const [copied, setCopied] = useState(false);
    const onSubmit = (name) => {
        setLoading(true);
        Cookies.set("name", name);
        firebase.openUserMedia().then(() => {
            if (router.query.roomId) {
                firebase.joinRoomById(router.query.roomId, name, setNames).then(() => {
                    setSettingName(false);
                    setLoading(false)
                });
            }
        })
    };
    const onCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 3000)
    }
    if (isSettingName) {
        return <Form defaultValue={Cookies.get('name') || ""} onSubmit={onSubmit} loading={loading} />
    }
    return (
        <>
            <Grid centered>
                <Grid.Row columns={3} stretched >
                    <Grid.Column stretched verticalAlign="middle" >
                        <div width="100%">
                            <video ref={video => video && (video.srcObject = firebase.localStream)} muted autoPlay width="100%" ></video>
                            <Label style={styleLabel} >{firebase.localStream.name}</Label>
                        </div>
                    </Grid.Column>
                    <Grid.Column stretched verticalAlign="middle" >
                        <div width="100%">
                            <video ref={video => video && (video.srcObject = firebase.remoteStreams[0])} autoPlay width="100%" ></video>
                            <Label style={styleLabel} >{names[0]}</Label>
                        </div>
                    </Grid.Column>
                    <Grid.Column verticalAlign="middle" >
                        <div width="100%">
                            <video ref={video => video && (video.srcObject = firebase.remoteStreams[1])} autoPlay width="100%" ></video>
                            <Label style={styleLabel} >{names[1]}</Label>
                        </div>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={3}>
                    <Grid.Column verticalAlign="middle" >
                        <div width="100%">
                            <video ref={video => video && (video.srcObject = firebase.remoteStreams[2])} autoPlay width="100%" ></video>
                            <Label style={styleLabel} >{names[2]}</Label>
                        </div>
                    </Grid.Column>
                    <Grid.Column verticalAlign="middle" >
                        <div width="100%">
                            <video ref={video => video && (video.srcObject = firebase.remoteStreams[3])} autoPlay width="100%" ></video>
                            <Label style={styleLabel} >{names[3]}</Label>
                        </div>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
            <Grid centered style={{ position: "fixed", bottom: "5%", transform: "translateX(-50%)", left: "50%" }}>
                <Grid.Row columns={3} >
                    <Grid.Column textAlign="center">
                        <Button circular size="massive" icon='microphone' color="green" />
                        <p>audio on</p>
                    </Grid.Column>
                    <Grid.Column textAlign="center">
                        <Button circular size="massive" icon='camera' color="green" />
                        <p>Camera on</p>
                    </Grid.Column>
                    <Grid.Column textAlign="center">
                        <Button circular size="massive" icon='linkify' color="green" onClick={onCopyLink} />
                        {copied ? (<p>Copied!</p>) : (<p>Copy link</p>)}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    )
}