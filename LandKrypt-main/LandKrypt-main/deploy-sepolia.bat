@echo off
echo ========================================
echo LandKrypt Enhanced - Sepolia Deployment
echo ========================================
echo.

echo Checking environment variables...
if "%ALCHEMY_API_KEY%"=="" (
    echo ERROR: ALCHEMY_API_KEY not set
    echo Please set your Alchemy API key in environment variables
    pause
    exit /b 1
)

if "%DEPLOYER_PRIVATE_KEY%"=="" (
    echo ERROR: DEPLOYER_PRIVATE_KEY not set
    echo Please set your deployer private key in environment variables
    pause
    exit /b 1
)

if "%PINATA_API_KEY%"=="" (
    echo ERROR: PINATA_API_KEY not set
    echo Please set your Pinata API key in environment variables
    pause
    exit /b 1
)

if "%PINATA_SECRET_API_KEY%"=="" (
    echo ERROR: PINATA_SECRET_API_KEY not set
    echo Please set your Pinata secret API key in environment variables
    pause
    exit /b 1
)

echo ✅ Environment variables verified
echo.

echo Starting deployment to Sepolia...
echo This will:
echo - Deploy 6 enhanced contracts to Sepolia
echo - Upload NFT images to Pinata IPFS
echo - Mint 5 NFTs to your address
echo - Update environment files
echo.

set /p confirm="Continue with deployment? (y/N): "
if /i not "%confirm%"=="y" (
    echo Deployment cancelled
    pause
    exit /b 0
)

echo.
echo 🚀 Starting Sepolia deployment...
npx hardhat run scripts/deploy-sepolia-enhanced.js --network sepolia

echo.
echo Deployment complete!
echo Check the deployment report in deployments/sepolia-enhanced-deployment.json
echo.
pause
