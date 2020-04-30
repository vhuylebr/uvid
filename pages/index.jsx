
import { useRouter } from "next/router";
import { useState } from "react";
import { Button } from "semantic-ui-react";
import firebase from "../services/firebase";

export default () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onSubmit = () => {
    setLoading(true);
    firebase.createRoom().then((id) => {
      setLoading(false);
      router.push("/[roomId]", `/${id}`)
    });
  }
  return (
    <Button
      loading={loading}
      color="green"
      onClick={onSubmit}
      type="submit"
      style={{ color: "white" }}
      size="huge"
      circular
      content="Create room"
    />
  )
}
