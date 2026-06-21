import type { CSSProperties } from "react";

export function Stars() {
  return <div className="stars" aria-hidden="true">{Array.from({ length: 200 }, (_, i) => {
    const dust = i % 4 === 3;
    const driftX = (i % 2 ? 1 : -1) * (38 + (i % 7) * 12);
    const style = {
      left: `${(i * 61.803 + 7) % 100}%`,
      top: `${(i * 37.117 + 11) % 100}%`,
      width: `${dust ? .8 + (i % 3) * .35 : 1.5 + (i % 3) * .7}px`,
      height: `${dust ? .8 + (i % 3) * .35 : 1.5 + (i % 3) * .7}px`,
      animationDelay: `-${(i * 1.7) % 24}s`,
      animationDuration: `${dust ? 15 + (i % 9) * 2.2 : 8 + (i % 7) * 2}s`,
      "--star-x": `${driftX}px`,
      "--star-x-start": `${driftX * -.35}px`,
      "--star-x-mid": `${driftX * .35}px`,
      "--star-y": `${-58 - (i % 8) * 17}px`,
      "--star-r": `${(i % 2 ? 1 : -1) * (8 + (i % 5) * 4)}deg`,
    } as CSSProperties;
    return <i className={`${dust ? "stardust" : "bright-star"} star-depth-${i % 3}`} key={i} style={style} />;
  })}</div>;
}
