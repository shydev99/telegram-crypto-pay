import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "appkit-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: "sm" | "md" | "lg";
        label?: string;
      };
    }
  }
}
export {};
