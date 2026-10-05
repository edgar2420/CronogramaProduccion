// React 19 ya no declara el namespace global `JSX` (solo `React.JSX`), pero
// los tipos de @dnd-kit/core 6.x todavía lo referencian. Este puente apunta el
// global a los tipos de React para que `tsc -b` compile.
import type React from "react";

declare global {
  namespace JSX {
    type Element = React.JSX.Element;
    type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}
