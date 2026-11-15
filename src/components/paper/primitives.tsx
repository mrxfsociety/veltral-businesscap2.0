import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";
import { BrandLockup } from "../../../public/brand/lockup";
import { Icon, type IconName } from "./icons";

/*
 * Paper primitives. The look lives in src/app/globals.css (.sheet, .btn,
 * .stamp, .kicker) so plain pages can use the same classes without React.
 */

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

type SheetProps<T extends ElementType> = {
  as?: T;
  /** 1 resting, 2 raised, 3 lifted. */
  lift?: 1 | 2 | 3;
  tone?: "sheet" | "cream" | "kraft";
  /** Hero sheets may sit rotated by up to 1.2 degrees. */
  tilt?: "left" | "right";
  /** A strip of tape at the top edge. */
  tape?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Sheet<T extends ElementType = "div">({
  as,
  lift = 1,
  tone = "sheet",
  tilt,
  tape,
  className,
  children,
  ...rest
}: SheetProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cx("sheet", className)}
      data-lift={lift === 1 ? undefined : lift}
      data-tone={tone === "sheet" ? undefined : tone}
      data-tilt={tilt}
      data-tape={tape ? "" : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

type ButtonLook = {
  variant?: "primary" | "secondary" | "ink" | "ghost";
  size?: "small" | "medium" | "large";
  icon?: IconName;
  /** Icon after the label instead of before it. */
  iconAfter?: boolean;
  className?: string;
  children: ReactNode;
};

function ButtonInner({
  icon,
  iconAfter,
  children,
}: Pick<ButtonLook, "icon" | "iconAfter" | "children">) {
  return (
    <>
      {icon && !iconAfter && <Icon name={icon} />}
      <span>{children}</span>
      {icon && iconAfter && <Icon name={icon} />}
    </>
  );
}

export function Button({
  variant = "primary",
  size = "medium",
  icon,
  iconAfter,
  className,
  children,
  type = "button",
  ...rest
}: ButtonLook & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  return (
    <button
      type={type}
      className={cx("btn", className)}
      data-variant={variant === "primary" ? undefined : variant}
      data-size={size === "medium" ? undefined : size}
      {...rest}
    >
      <ButtonInner icon={icon} iconAfter={iconAfter}>
        {children}
      </ButtonInner>
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "medium",
  icon,
  iconAfter,
  className,
  children,
  ...rest
}: ButtonLook & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "children" | "className"
  >) {
  return (
    <Link
      href={href}
      className={cx("btn", className)}
      data-variant={variant === "primary" ? undefined : variant}
      data-size={size === "medium" ? undefined : size}
      {...rest}
    >
      <ButtonInner icon={icon} iconAfter={iconAfter}>
        {children}
      </ButtonInner>
    </Link>
  );
}

/** Helpful = teal with a check, unhelpful = tomato with a cross. Never colour alone. */
export function Stamp({
  kind = "neutral",
  solid,
  icon,
  className,
  children,
  ...rest
}: {
  kind?: "helpful" | "unhelpful" | "neutral" | "pass";
  solid?: boolean;
  icon?: IconName | null;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">) {
  const glyph =
    icon === null
      ? null
      : (icon ??
        (kind === "helpful"
          ? "check"
          : kind === "unhelpful"
            ? "cross"
            : kind === "pass"
              ? "ticket"
              : null));
  return (
    <span
      className={cx("stamp", className)}
      data-kind={kind}
      data-solid={solid ? "" : undefined}
      {...rest}
    >
      {glyph && <Icon name={glyph} size={14} />}
      {children}
    </span>
  );
}

export function Kicker({
  as,
  accent,
  className,
  children,
}: {
  as?: "p" | "span" | "h2" | "h3";
  accent?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const Tag = as ?? "p";
  return (
    <Tag
      className={cx("kicker", className)}
      data-accent={accent ? "" : undefined}
    >
      {children}
    </Tag>
  );
}

/** The Veltral lockup (authored by BRAND in public/brand). Decorative: wrap it in a labelled link. */
export function Wordmark({
  className,
  height = 30,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <BrandLockup
      decorative
      height={height}
      className={cx("wordmark", className)}
    />
  );
}
