import { Form } from "semantic-ui-react"
import { useState, useEffect } from "react"

export default ({ onSubmit, defaultValue, loading }) => {
    const [name, setName] = useState("");
    useEffect(() => {
        setName(defaultValue)
    }, [])
    return (
        <Form style={{ textAlign: "center" }} onSubmit={() => onSubmit(name)}>
            <h1>Welcome to Uvid</h1>
            <h2>Please enter your name before joining</h2>
            <Form.Input
                defaultValue={defaultValue}
                size='huge'
                placeholder='Add your name'
                fluid
                onChange={({ target: { value } }) => setName(value)}
            >
                <input style={{ textAlign: "center" }} />
            </Form.Input>
            <Form.Button
                loading={loading}
                color="green"
                type="submit"
                disabled={name.length === 0}
                style={{ color: "white" }}
                size="huge"
                circular
                content="Join"
            />
        </Form>
    )
}