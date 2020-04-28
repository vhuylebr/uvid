import 'semantic-ui-css/semantic.min.css'
import "../styles.css";

export default function MyApp({ Component, pageProps }) {
    return (
        <>
            <Component {...pageProps} />
        </>
    )
}