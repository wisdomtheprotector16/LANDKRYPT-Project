import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'LandKrypt App',
  projectId: '5fa297ea757b04cd0350a7a5b8de27bc',
  chains: [
    sepolia, // Prioritize Sepolia for development
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true,
});


// https://cloud.reown.com/app/21f4d9c0-7810-4c36-894e-dc05a78c2efa/project/78de6928-45cb-46c2-b820-8f266f992e4d