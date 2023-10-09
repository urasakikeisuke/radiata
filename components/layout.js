/** @format */

import styles from "./components.module.sass";
import React from "react";
import { useDefaultFetcher, contains } from "./utils";

export default function Container({ children, style }) {
  return <div className={style}>{children}</div>;
}

export function Grid({ children, style }) {
  return <div className={style}>{children}</div>;
}

export function Box({ header, body, style, onClick }) {
  const handleChildClick = (event) => {
    if (contains(event.target.classList, "Mui")) {
      return;
    }

    if (event.target.classList.length === 0) {
      return;
    }

    onClick();
  };

  return (
    <div
      className={`${styles.box} ${style ? style : ""}`}
      onClick={handleChildClick}
    >
      <div className={styles.box_header}>{header}</div>
      <div className={styles.box_body}>{body}</div>
    </div>
  );
}

export function Streaming({
  endpoint,
  title,
  style,
  intervalMs,
  parser = (x) => (x == null ? "N/A" : x),
  fetcher = useDefaultFetcher
}) {
  const data = fetcher(endpoint, intervalMs);

  return (
    <div className={style}>
      <ul>
        <li>
          <p>{title}</p>
        </li>
        <li>
          <h3>
            <code>{parser(data)}</code>
          </h3>
        </li>
      </ul>
    </div>
  );
}

export function Constants({ value, title, style }) {
  return (
    <div className={style}>
      <ul>
        <li>
          <p>{title}</p>
        </li>
        <li>
          <h3>
            <code>{value}</code>
          </h3>
        </li>
      </ul>
    </div>
  );
}

export function OneShot({
  endpoint,
  title,
  style,
  parser = (x) => (x == null ? "N/A" : x),
  fetcher = useDefaultFetcher
}) {
  const data = fetcher(endpoint, 999999999);

  return (
    <div className={style}>
      <ul>
        <li>
          <p>{title}</p>
        </li>
        <li>
          <h3>
            <code>{parser(data)}</code>
          </h3>
        </li>
      </ul>
    </div>
  );
}
