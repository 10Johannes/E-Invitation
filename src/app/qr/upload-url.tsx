"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getUploadUrl = () => `${window.location.origin}/upload`;
const getServerUploadUrl = () => "";

/** Shows the real /upload URL of whatever domain the card is opened on. */
export default function UploadUrl() {
  const url = useSyncExternalStore(
    emptySubscribe,
    getUploadUrl,
    getServerUploadUrl
  );

  return (
    <p className="break-all text-sm tracking-wide text-charcoal">
      {url ? url.replace(/^https?:\/\//, "") : "\u00A0"}
    </p>
  );
}
