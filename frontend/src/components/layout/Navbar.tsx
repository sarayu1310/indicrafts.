import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, ChevronDown, LogOut, Settings, Store, Heart } from 'lucide-react';
import { Shield } from 'lucide-react';
import logoImage from '@/assets/logo_2.png';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    {
      name: 'Products',
      path: '/products',
      subLinks: [
        { name: 'Browse All', path: '/products' },
        { name: 'Handicrafts & Art', path: '/products?category=handicrafts-art' },
        { name: 'Textiles & Apparel', path: '/products?category=textiles-apparel' },
        { name: 'Jewelry & Accessories', path: '/products?category=jewelry-accessories' },
        { name: 'Home & Living', path: '/products?category=home-living' },
        { name: 'Food & Wellness', path: '/products?category=food-wellness' },
        { name: 'Eco-Friendly Products', path: '/products?category=eco-friendly' },
        { name: 'Cultural & Ritual Products', path: '/products?category=cultural-ritual' },
      ],
    },
    { name: 'Contact Us', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-[80px]">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src={logoImage}
              alt="IndiCrafts Logo"
              className="h-28 w-28 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-merriweather text-xl font-bold text-primary leading-tight">
                {/* IndiCrafts */}
              </span>
              <span className="font-poppins text-sm text-burnt-orange leading-tight">
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <div key={link.name}>
                {link.subLinks ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`font-poppins flex items-center space-x-1 ${isActive(link.path) ? 'text-primary' : ''
                          }`}
                      >
                        <span>{link.name}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {link.subLinks.map((subLink) => (
                        <DropdownMenuItem key={subLink.name} asChild>
                          <Link to={subLink.path} className="font-poppins">
                            {subLink.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to={link.path}>
                    <Button
                      variant="ghost"
                      className={`font-poppins ${isActive(link.path) ? 'text-primary' : ''
                        }`}
                    >
                      {link.name}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthenticated ? (
                  <>
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {user?.name}
                    </div>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      {user?.email}
                    </div>
                    <DropdownMenuSeparator />
                    {user?.role === 'producer' && (
                      <DropdownMenuItem asChild>
                        <Link to="/producer/dashboard" className="flex items-center">
                          <Store className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {user?.role !== 'producer' && (
                      <DropdownMenuItem asChild>
                        <Link to="/wishlist" className="flex items-center">
                          <Heart className="h-4 w-4 mr-2 text-burnt-orange" />
                          Wishlist
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="flex items-center text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/register/producer">Producer Registration</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/register/customer">Customer Registration</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/login">Login</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-burnt-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navLinks.map((link) => (
                    <div key={link.name}>
                      <Link
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`block py-2 font-poppins text-lg ${isActive(link.path) ? 'text-primary font-semibold' : ''
                          }`}
                      >
                        {link.name}
                      </Link>
                      {link.subLinks && (
                        <div className="ml-4 mt-2 space-y-2">
                          {link.subLinks.map((subLink) => (
                            <Link
                              key={subLink.name}
                              to={subLink.path}
                              onClick={() => setIsOpen(false)}
                              className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                              {subLink.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="border-t pt-4 space-y-2">
                    {isAuthenticated ? (
                      <>
                        <div className="px-2 py-1.5 text-sm font-medium">
                          {user?.name}
                        </div>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          {user?.email}
                        </div>
                        {user?.role === 'producer' && (
                          <Link
                            to="/producer/dashboard"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center py-2 font-poppins"
                          >
                            <Store className="h-4 w-4 mr-2" />
                            Dashboard
                          </Link>
                        )}
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center py-2 font-poppins"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Admin
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center py-2 font-poppins"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                        {user?.role !== 'producer' && (
                          <Link
                            to="/wishlist"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center py-2 font-poppins"
                          >
                            <Heart className="h-4 w-4 mr-2 text-burnt-orange" />
                            Wishlist
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setIsOpen(false);
                          }}
                          className="flex items-center py-2 font-poppins text-red-600 w-full text-left"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/register/producer"
                          onClick={() => setIsOpen(false)}
                          className="block py-2 font-poppins"
                        >
                          Producer Registration
                        </Link>
                        <Link
                          to="/register/customer"
                          onClick={() => setIsOpen(false)}
                          className="block py-2 font-poppins"
                        >
                          Customer Registration
                        </Link>
                        <Link
                          to="/login"
                          onClick={() => setIsOpen(false)}
                          className="block py-2 font-poppins"
                        >
                          Login
                        </Link>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;