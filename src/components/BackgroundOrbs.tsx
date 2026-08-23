"use client";

import Parallax from "./Parallax";

export default function BackgroundOrbs() {
  return (
    <div className="orbs" aria-hidden>
      <Parallax speed={0.14} className="orb orb-a">
        <div className="orb-inner" />
      </Parallax>
      <Parallax speed={0.18} className="orb orb-b">
        <div className="orb-inner" />
      </Parallax>
      <Parallax speed={0.1} className="orb orb-c">
        <div className="orb-inner" />
      </Parallax>
    </div>
  );
}
