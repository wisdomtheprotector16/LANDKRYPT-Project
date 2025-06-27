"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Play, Users, Shield, Zap, Globe, Star, Award, TrendingUp } from 'lucide-react';

const LandKryptLanding = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "What is LandKrypt?",
      answer: "LandKrypt is a revolutionary platform that transforms land ownership through blockchain technology, making real estate investment accessible to everyone."
    },
    {
      question: "How does tokenization work?",
      answer: "We convert physical real estate into digital tokens on the blockchain, allowing fractional ownership and easy trading of property assets."
    },
    {
      question: "Is LandKrypt secure?",
      answer: "Yes, we use advanced blockchain security protocols and smart contracts to ensure all transactions are safe and transparent."
    },
    {
      question: "What are the minimum investment requirements?",
      answer: "Our platform allows investments starting from as low as $100, making real estate accessible to all investors."
    },
    {
      question: "How do I get started with LandKrypt?",
      answer: "Simply create an account, complete the verification process, and start exploring available properties to invest in."
    }
  ];

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Blockchain Security",
      description: "Advanced cryptographic protection for all transactions"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Transactions",
      description: "Lightning-fast property transfers and investments"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Access",
      description: "Invest in properties worldwide from anywhere"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "High Returns",
      description: "Maximize your investment potential with tokenized real estate"
    }
  ];

  const partners = ["Binance", "Ethereum", "Polygon", "Chainlink", "OpenSea"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-indigo-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

     

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Beyond Play:
            <br />
            Own The World
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Transform your investment journey with tokenized real estate. 
            Own fractions of premium properties worldwide through blockchain technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 border-none px-8 py-3 text-lg">
              Start Investing
            </Button>
            
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">$50M+</div>
              <div className="text-gray-400">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">10K+</div>
              <div className="text-gray-400">Investors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">500+</div>
              <div className="text-gray-400">Properties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">25%</div>
              <div className="text-gray-400">Avg Returns</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why LandKrypt Section */}
      <section className="relative z-10 px-6 py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Why LandKrypt?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg font-medium">{faq.question}</span>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 text-gray-300 border-t border-white/10 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="relative z-10 px-6 py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            Powering the LandKrypt Vision
          </h2>
          
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            {partners.map((partner, index) => (
              <div key={index} className="text-2xl font-bold hover:opacity-100 transition-opacity cursor-pointer">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Land Ownership?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of investors who are already building wealth through tokenized real estate.
          </p>

          <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 border-none px-12 py-4 text-lg">
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 bg-black/30 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">LandKrypt</span>
          </div>
          
          <div className="text-gray-400 text-center md:text-right">
            <p>&copy; 2024 LandKrypt. All rights reserved.</p>
            <p className="text-sm mt-1">Transforming real estate through blockchain technology</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandKryptLanding;