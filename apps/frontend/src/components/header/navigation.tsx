import { Link } from "@tanstack/react-router";
import { FlipperLink } from "../flipper-link";

const Navigation = () => {
  const links = [
    {
      title: "What we do",
      label: "Our Services",
      to: "/services",
    },
    {
      title: "Our Story",
      label: "About us",
      to: "/about",
    },
    {
      title: "Book a Call",
      label: "Contact us",
      to: "/contact",
    },
  ];

  return (
    <>
      <nav className="flex items-center h-full">
        {links.map((link, index) => {
          const number = String(index + 1).padStart(2, "0");
          return (
            <div
              key={link.to}
              className="flex flex-col items-start space-y-1 justify-center border-l border-black/20 h-full px-8"
            >
              <span className="capitalize text-xs px-1 font-medium text-muted hidden lg:block">
                ({number}) {link.title}
              </span>
              <Link to={link.to}>
                <FlipperLink className="uppercase tracking-wide font-light">
                  {link.label}
                </FlipperLink>
              </Link>
            </div>
          );
        })}
      </nav>
    </>
  );
};

export default Navigation;
