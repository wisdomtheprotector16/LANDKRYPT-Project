import { Plus } from "lucide-react";
import React from "react";

const SemiFeatures = () => {
  const features = [
    {
      title: "Encrypted Security",
      description:
        "Our platform has a strict security and safe land sales that is safe from name theft.",
      linePosition: "right",
    },
    {
      title: "Fast Transaction",
      description:
        "We have an easy, fast, and certainly not complicated purchase transaction flow.",
      linePosition: "left",
    },
  ];

  return (
    <div className="md:px-8 py-6 text-white space-y-4">
      {features.map((feature, index) => (
        <div key={index} className="grid grid-cols-12 gap-2">
          {feature.linePosition === "left" && (
            <div className="col-span-12 md:col-span-3 flex items-center max-md:order-2">
              <img
                className="w-full"
                src="/elements/whiteline.png"
                alt="Divider line"
              />
            </div>
          )}

          <div className="md:col-span-9 col-span-12 flex items-center justify-center gap-2 relative p-[1px]">
            {/* Gradient border wrapper */}
            <div className="relative z-10 skew-x-6 bg-gradient-to-br from-amber-200 via-yellow-300 w-full rounded-none p-[1px]">
              <div className="bg-black w-full p-4 flex flex-col md:flex-row items-center ">
                <div className="flex items-center gap-2 -skew-x-6">
                  {/* <Plus className="text-white" /> */}
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 26 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.085 4.51753L14.1267 2.28586C13.5092 2.05836 12.5017 2.05836 11.8842 2.28586L5.92583 4.51753C4.77749 4.95086 3.84583 6.29419 3.84583 7.51836V16.2934C3.84583 17.1709 4.41999 18.33 5.12416 18.85L11.0825 23.3025C12.1333 24.0934 13.8558 24.0934 14.9067 23.3025L20.865 18.85C21.5692 18.3192 22.1433 17.1709 22.1433 16.2934V7.51836C22.1542 6.29419 21.2225 4.95086 20.085 4.51753ZM13.8125 13.9425V16.7917C13.8125 17.2359 13.4442 17.6042 13 17.6042C12.5558 17.6042 12.1875 17.2359 12.1875 16.7917V13.9425C11.0933 13.5959 10.2917 12.5775 10.2917 11.375C10.2917 9.88003 11.505 8.66669 13 8.66669C14.495 8.66669 15.7083 9.88003 15.7083 11.375C15.7083 12.5884 14.9067 13.5959 13.8125 13.9425Z"
                      fill="white"
                    />
                  </svg>

                  <div className="text-2xl font-medium">{feature.title}</div>
                </div>
                <div className="text-neutral-300 -skew-x-6">
                  {feature.description}
                </div>
              </div>
            </div>
          </div>

          {feature.linePosition === "right" && (
            <div className="col-span-12 md:col-span-3 flex items-center">
              <img
                className="w-full"
                src="/elements/whiteline.png"
                alt="Divider line"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SemiFeatures;
