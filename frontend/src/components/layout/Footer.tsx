import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-merriweather text-xl font-bold mb-4">
              IndiCrafts
            </h3>
            <p className="font-poppins text-sm opacity-90">
              Empowering rural and tribal artisans by connecting their authentic
              handmade products with conscious consumers worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-merriweather text-lg font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 font-poppins text-sm">
              <li>
                <Link to="/about" className="hover:text-mustard transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-mustard transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/register/producer" className="hover:text-mustard transition-colors">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-mustard transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-merriweather text-lg font-semibold mb-4">
              Categories
            </h4>
            <ul className="space-y-2 font-poppins text-sm">
              <li>
                <Link
                  to="/products?category=handicrafts-art"
                  className="hover:text-mustard transition-colors"
                >
                  Handicrafts & Art
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=textiles-apparel"
                  className="hover:text-mustard transition-colors"
                >
                  Textiles & Apparel
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=jewelry-accessories"
                  className="hover:text-mustard transition-colors"
                >
                  Jewelry & Accessories
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=eco-friendly"
                  className="hover:text-mustard transition-colors"
                >
                  Eco-Friendly Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-merriweather text-lg font-semibold mb-4">
              Connect With Us
            </h4>
            <div className="space-y-3 font-poppins text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>indicrafts2u@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 74328 83118</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Center for Rural Development <br /> IIT Kharagpur - 721 302, West Bengal, India</span>
              </div>
              {/* <div className="flex space-x-4 mt-4">
                <a href="#" className="hover:text-mustard transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="hover:text-mustard transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="hover:text-mustard transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </div> */}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="font-poppins text-sm opacity-90">
            © 2025 IndiCrafts. All rights reserved. | Supporting Traditional Crafts
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;