"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { AnchorHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: LinkProps["href"];
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  end?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, end, children, ...props }, ref) => {
    const pathname = usePathname();
    const toPath = typeof to === "string" ? to : to.pathname || "";
    const isActive = end ? pathname === toPath : pathname === toPath || pathname.startsWith(`${toPath}/`);

    return (
      <Link href={to} legacyBehavior passHref>
        <a
          ref={ref}
          className={cn(className, isActive && activeClassName, !isActive && pendingClassName)}
          {...props}
        >
          {children}
        </a>
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
