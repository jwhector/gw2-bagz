"use client";
import Link from "next/link";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <div className="flex sm:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Logo/Title - centered on mobile, left-aligned on desktop */}
          <div className="flex-1 flex justify-center sm:justify-start">
            <Link
              href="/"
              className="font-bold text-xl text-foreground hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              Guild Wars 2 Bagz
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden sm:flex items-center space-x-8">
            <Link
              href="/data"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
            >
              Data
            </Link>
            <Link
              href="/account"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
            >
              Account
            </Link>
          </nav>
        </div>

        {/* Mobile navigation menu */}
        {isMenuOpen && (
          <div className="sm:hidden py-3 pb-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/data"
                className="px-2 py-1 text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Data
              </Link>
              <Link
                href="/account"
                className="px-2 py-1 text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Account
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
