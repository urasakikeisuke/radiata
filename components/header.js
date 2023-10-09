/** @format */

import Head from "next/head";
import Link from "next/link";
import styles from "./components.module.sass";

export default function Header({ serverURL, setServerURL }) {
  const handleInput = (event) => {
    setServerURL(event.currentTarget.value);
  };

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Radiata | System Resource Monitoring Tool</title>
      </Head>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href="/">
              <p className={styles.logo}>Radiata</p>
            </Link>
          </li>
          <li>
            <Link href="/cpu">CPU</Link>
          </li>
          <li>
            <Link href="/gpu">GPU</Link>
          </li>
          <li>
            <Link href="/process">Process</Link>
          </li>
          <li>
            <Link href="/network">Network</Link>
          </li>
          <li>
            <Link href="/disk">Disk</Link>
          </li>
          <li>
            <input
              type="text"
              id="server-url"
              value={serverURL}
              onInput={handleInput}
              autoComplete="on"
            />
          </li>
        </ul>
      </nav>
    </>
  );
}
