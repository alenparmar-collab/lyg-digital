import Link from "next/link";
import styles from "./StampButton.module.css";

/**
 * StampButton. Renders as a link when given href, otherwise a real button, so
 * navigation stays navigation and keyboard behaviour comes for free.
 */
export default function StampButton({
  children,
  href,
  type = "button",
  disabled,
  className,
  ...rest
}: {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const cn = [styles.stamp, className].filter(Boolean).join(" ");

  if (href) {
    return (
      <Link href={href} className={cn} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cn} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
