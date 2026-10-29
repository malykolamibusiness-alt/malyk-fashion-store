import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SharedIconButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
};

type IconLinkProps = SharedIconButtonProps & {
  href: string;
  disabled?: never;
  onClick?: never;
};

type NativeIconButtonProps = SharedIconButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
    href?: never;
  };

export type IconButtonProps = IconLinkProps | NativeIconButtonProps;

export function IconButton(props: IconButtonProps) {
  if ("href" in props && props.href) {
    const className = `icon-button ${props.className ?? ""}`.trim();

    return (
      <Link className={className} href={props.href} aria-label={props.ariaLabel}>
        {props.children}
      </Link>
    );
  }

  const {
    ariaLabel,
    children,
    className = "",
    ...buttonProps
  } = props;

  return (
    <button
      className={`icon-button ${className}`.trim()}
      type="button"
      aria-label={ariaLabel}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
