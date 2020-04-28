import Form from "../components/Form"
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { useState } from "react";
import firebase from "../services/firebase";

export default () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onSubmit = (name) => {
    setLoading(true);
    Cookies.set('name', name);
    firebase.createRoom().then((id) => {
      setLoading(false);
      router.push(`/${id}`)
    });
  }
  return (
    <Form defaultValue={Cookies.get('name') || ""} onSubmit={onSubmit} loading={loading} />
  )
}
