import { Link } from "@tanstack/react-router";
import Navigation from "./navigation";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center border-b border-black/20 justify-between bg-transparent backdrop-blur-md text-foreground h-20">
      <Link to="/" className="flex items-center cursor-pointer">
        <img
          src="/ap-logo.svg"
          alt="Apolloz Company Logo"
          className="h-16 w-auto lg:ml-4"
        />
      </Link>
      <Navigation />
    </header>
  );
};

export default Header;
