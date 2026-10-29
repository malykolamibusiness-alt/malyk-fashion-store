import type { ReactNode } from "react";

type ContainerWidth = "narrow" | "content" | "wide" | "full";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  width?: ContainerWidth;
};

export function Container({
  children,
  className = "",
  width = "wide",
}: ContainerProps) {
  return (
    <div className={`container container--${width} ${className}`.trim()}>
      {children}
    </div>
  );
}
