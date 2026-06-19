import type { CSSProperties } from "react";

export function Stars() {
  return <div className="stars" aria-hidden="true">{Array.from({ length: 58 }, (_, i) => {
    const style = {
      left: `${(i * 37 + 7) % 100}%`,
      top: `${(i * 61 + 11) % 100}%`,
      width: `${1 + (i % 3) * .65}px`,
      height: `${1 + (i % 3) * .65}px`,
      animationDelay: `-${(i * 1.7) % 15}s`,
      animationDuration: `${10 + (i % 7) * 2.5}s`,
      "--star-x": `${(i % 2 ? 1 : -1) * (18 + (i % 5) * 7)}px`,
      "--star-y": `${-30 - (i % 6) * 10}px`,
    } as CSSProperties;
    return <i className={`star-depth-${i % 3}`} key={i} style={style} />;
  })}</div>;
}
