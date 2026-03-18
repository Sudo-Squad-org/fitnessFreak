import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const links = {
  Product: [
    { label: "Live Classes", href: "/classes" },
    { label: "On Demand", href: "/classes" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Support: [
    { label: "Pricing", href: "#" },
    { label: "Documentation", href: "#" },
    { label: "Guides", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

const socials = [
  { Icon: Facebook, label: "Facebook" },
  { Icon: Instagram, label: "Instagram" },
  { Icon: Twitter, label: "Twitter" },
  { Icon: Youtube, label: "YouTube" },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground transition-transform group-hover:scale-105">
                <div className="h-4 w-4 rounded-full bg-background" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">FitnessFreak</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-xs">
              Transforming fitness routines into high-energy, community-driven experiences.
            </p>
            <div className="mt-6 flex gap-4">
              {socials.map(({ Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{title}</h3>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FitnessFreak, Inc. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ for fitness enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
};
