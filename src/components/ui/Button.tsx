import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "text";

type SharedButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type ButtonLinkProps = SharedButtonProps & {
  href: string;
  target?: "_blank" | "_self";
  rel?: string;
};

type NativeButtonProps = SharedButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: never;
  };

export type ButtonProps = ButtonLinkProps | NativeButtonProps;

export function Button(props: ButtonProps) {
  if ("href" in props && props.href) {
    const variant = props.variant ?? "primary";
    const className = `button button--${variant} ${props.className ?? ""}`.trim();

    return (
      <Link
        className={className}
        href={props.href}
        target={props.target}
        rel={props.rel}
      >
        {props.children}
      </Link>
    );
  }

  const {
    children,
    className = "",
    variant = "primary",
    ...buttonProps
  } = props;

  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      type="button"
      {...buttonProps}
    >
      {children}
    </button>
  );
}
