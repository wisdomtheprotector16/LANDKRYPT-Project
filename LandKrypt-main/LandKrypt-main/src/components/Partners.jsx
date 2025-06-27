import React from "react";

const Partners = () => {
  return (
    <div className=" py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Title */}
        <div className="text-3xl font-bold  ">
          <h2 className="mb-2">
            Powering the
          </h2>
          <h2 className="mb-8">
            LandKrypt Vision
          </h2>
        </div>

        {/* Logo grid */}
        <div className="grid grid-cols-2 md:grid-cols-5  gap-8 items-center justify-center mt-12">
          {/* Zapier logo - replace with actual image */}
          <div className="flex items-center justify-center h-16">
            <img
              src="/brands/zapier.png"
              alt="Zapier"
              className="h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Spotify logo - replace with actual image */}
          <div className="flex items-center justify-center h-16">
            <img
              src="/brands/spotify.png"
              alt="Spotify"
              className="h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Zoom logo - replace with actual image */}
          <div className="flex items-center justify-center h-16">
            <img
              src="/brands/zoom.png"
              alt="Zoom"
              className="h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Slack logo - replace with actual image */}
          <div className="flex items-center justify-center h-16">
            <img
              src="/brands/slack.png"
              alt="Slack"
              className="h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Amazon logo - replace with actual image */}
          <div className="flex items-center justify-center h-16 max-md:col-span-2 ">
            <img
              src="/brands/amazon.png"
              alt="Amazon"
              className="h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partners;
