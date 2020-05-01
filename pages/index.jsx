
import { useRouter } from "next/router";
import { useState } from "react";
import firebase from "../services/firebase";
import { Button } from "semantic-ui-react";

export default () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onSubmit = () => {
    setLoading(true);
    firebase.createRoom().then((id) => {
      setLoading(false);
      router.push({
        pathname: "/room",
        query: {
          roomId: id
        }
      })
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
