@echo off
echo Starting LandKrypt Enhanced Contract Deployment...
echo.

echo Starting Hardhat node...
start /B npx hardhat node --hostname 0.0.0.0 --port 8545

echo Waiting for node to start...
timeout /t 10 /nobreak > nul

echo Deploying contracts...
npx hardhat run scripts/simple-deploy.js --network localhost

echo.
echo Deployment complete!
pause
