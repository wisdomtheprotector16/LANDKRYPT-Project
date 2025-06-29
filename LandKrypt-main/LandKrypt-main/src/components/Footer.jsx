import React from "react";
import { Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  // Footer content configuration
  const footerContent = {
    mainDescription: {
      title: "Building Wealth, One Krypt At A Time",
      description:
        "Empowering digital land ownership through verified assets, community governance, and smart investment. Built on transparency, innovation, and decentralization. LandKrypt gives you the tools to own, grow, and shape the future of virtual real estate.",
    },
    columns: [
      {
        title: "Quick Links",
        links: [
          { text: "Anthos Verification", href: "/anthos" },
          { text: "NFT Marketplace", href: "/marketplace" },
          { text: "Governance DAO", href: "/govermentdao" },
          { text: "Account Dashboard", href: "/dashboard" },
        ],
      },
      {
        title: "Help & Resources",
        links: [
          { text: "Documentation", href: "/docs" },
          { text: "FAQ", href: "/#faq" },
          { text: "Community Forum", href: "#" },
          { text: "Contact Support", href: "#" },
        ],
      },
    ],
    legalLinks: [
      { text: "Privacy Policy", href: "#" },
      { text: "Terms Of Service", href: "#" },
      { text: "Legal", href: "#" },
    ],
    socialLinks: [
      { icon: <Twitter size={20} />, href: "#" },
      { icon: <Instagram size={20} />, href: "#" },
      { icon: <Linkedin size={20} />, href: "#" },
    ],
  };

  return (
    <footer className="bg-slate-900 text-gray-400 py-16 px-6 relative overflow-hidden">
      {/* Large background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[80vw] h-full w-full md:text-[15vw] font-bold tracking-tighter opacity-5 whitespace-nowrap md:whitespace-normal transform rotate-90 md:rotate-0 flex items-center justify-center origin-center leading-none">
          LANDKRYPT
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Left Column - Main Description */}
          <div className="space-y-6">
            <h2 className="text-gray-300 text-sm font-medium tracking-wider uppercase">
              {footerContent.mainDescription.title}
            </h2>
            <p className="text-gray-400 leading-relaxed text-sm max-w-sm">
              {footerContent.mainDescription.description}
            </p>
          </div>

          {/* Mapped Columns */}
          {footerContent.columns.map((column, index) => (
            <div key={index} className="space-y-6">
              <h3 className="text-gray-300 text-sm font-medium tracking-wider uppercase">
                {column.title}
              </h3>
              <nav className="space-y-4 text-2xl">
                {column.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.href}
                    className="block text-gray-400 hover:text-white transition-colors"
                    onClick={
                      link.text === "FAQ"
                        ? (e) => {
                            e.preventDefault();
                            document
                              .getElementById("faq")
                              .scrollIntoView({ behavior: "smooth" });
                          }
                        : undefined
                    }
                  >
                    {link.text}
                  </a>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Footer Links */}
            <div className="flex flex-wrap gap-6 text-xs text-gray-500">
              {footerContent.legalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="hover:text-gray-300 transition-colors"
                >
                  {link.text}
                </a>
              ))}
            </div>

            {/* Social Media Icons */}
            <div className="flex space-x-4">
              {footerContent.socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-600">
              {new Date().getFullYear()} LANDKRYPT ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;