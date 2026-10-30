import type { DetailedHTMLProps, HTMLAttributes } from "react";

/* <model-viewer> (@google/model-viewer) est un « web component » : on le déclare pour TypeScript. */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}
