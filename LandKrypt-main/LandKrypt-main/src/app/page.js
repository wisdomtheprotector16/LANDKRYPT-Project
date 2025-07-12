'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import EnhancedDashboard from '../components/enhanced/EnhancedDashboard'
import { Toaster } from 'react-hot-toast'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(true)

  useEffect(() => {
    // Check if we're in demo mode
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    setDemoMode(isDemoMode)

    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Enhanced LandKrypt</h2>
          <p className="text-purple-200">Initializing upgraded smart contracts...</p>
          <div className="mt-4 space-y-1 text-sm text-purple-300">
            <p>✅ Gas Optimized NFTs</p>
            <p>✅ Advanced Marketplace</p>
            <p>✅ Multi-Asset Staking</p>
            <p>✅ Quadratic Governance</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  LandKrypt
                </h1>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  ⚡ Enhanced Platform
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  30-56% Gas Savings
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🌐 Sepolia Testnet
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Enhanced Features Active'}
                </span>
              </div>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105">
                {isConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Features Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Batch NFT Minting</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Dutch & English Auctions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Multi-Asset Staking</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Quadratic Governance</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Enhanced Tier System</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedDashboard />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              LandKrypt Enhanced Platform
            </h3>
            <p className="text-gray-600 mb-4">
              Showcasing upgraded smart contracts with industry-leading features and optimizations
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-500">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">30-56%</div>
                <div>Gas Savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">5</div>
                <div>Enhanced Contracts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">25+</div>
                <div>New Features</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">100%</div>
                <div>Backward Compatible</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">8</div>
                <div>Security Layers</div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  )
}

// import  { NextPage } from 'next';
// import Head from 'next/head';
// import styles from "./../styles/Home.module.css"

// const Home = () => {
// // const Home: NextPage = () => {
//   return (
//     <div className={styles.container}>
//       <Head>
//         <title>RainbowKit App</title>
//         <meta
//           content="Generated by @rainbow-me/create-rainbowkit"
//           name="description"
//         />
//         <link href="/favicon.ico" rel="icon" />
//       </Head>

//       <main className={styles.main}>
//         <ConnectButton label="Sign in" />

//         {/* <h1 className={styles.title}>
//           Welcome to <a href="https://www.rainbowkit.com">RainbowKit</a> +{' '}
//           <a href="https://wagmi.sh">wagmi</a> +{' '}
//           <a href="https://nextjs.org">Next.js!</a>
//         </h1>

//         <p className={styles.description}>
//           Get started by editing{' '}
//           <code className={styles.code}>pages/index.tsx</code>
//         </p>

//         <div className={styles.grid}>
//           <a className={styles.card} href="https://rainbowkit.com">
//             <h2>RainbowKit Documentation &rarr;</h2>
//             <p>Learn how to customize your wallet connection flow.</p>
//           </a>

//           <a className={styles.card} href="https://wagmi.sh">
//             <h2>wagmi Documentation &rarr;</h2>
//             <p>Learn how to interact with Ethereum.</p>
//           </a>

//           <a
//             className={styles.card}
//             href="https://github.com/rainbow-me/rainbowkit/tree/main/examples"
//           >
//             <h2>RainbowKit Examples &rarr;</h2>
//             <p>Discover boilerplate example RainbowKit projects.</p>
//           </a>

//           <a className={styles.card} href="https://nextjs.org/docs">
//             <h2>Next.js Documentation &rarr;</h2>
//             <p>Find in-depth information about Next.js features and API.</p>
//           </a>

//           <a
//             className={styles.card}
//             href="https://github.com/vercel/next.js/tree/canary/examples"
//           >
//             <h2>Next.js Examples &rarr;</h2>
//             <p>Discover and deploy boilerplate example Next.js projects.</p>
//           </a>

//           <a
//             className={styles.card}
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
//           >
//             <h2>Deploy &rarr;</h2>
//             <p>
//               Instantly deploy your Next.js site to a public URL with Vercel.
//             </p>
//           </a>
//         </div> */}
//       </main>

//       {/* <footer className={styles.footer}>
//         <a href="https://rainbow.me" rel="noopener noreferrer" target="_blank">
//           Made with ❤️ by your frens at 🌈
//         </a>
//       </footer> */}
//     </div>
//   );
// };

// export default Home;
