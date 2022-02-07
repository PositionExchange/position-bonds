const { formatBytes32String } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const hre = require("hardhat");
// const = require
const { version } = require("chai");
const { BigNumber } = require("ethers");

const toWei = (n: number) => ethers.utils.parseEther(n.toString())

async function verifyContract(address: string, args: any, contract: any | undefined = undefined) {
  const verifyObj = { address } as any;
  if (args) {
    verifyObj.constructorArguments = args;
  }
  if (contract) {
    verifyObj.contract = contract;
  }
  console.log("verifyObj", verifyObj);
  return hre
    .run("verify:verify", verifyObj)
    .then(() => console.log("Contract address verified:", address));
}

const priceRange = [
  {
    min: toWei(0),
    max: toWei(5000),
    price: toWei(6),
  },
  {
    min: toWei(5000),
    max: toWei(10000),
    price: toWei(7),
  },
  {
    min: toWei(10000),
    max: toWei(15000),
    price: toWei(8),
  },
  {
    min: toWei(15000),
    max: toWei(20000),
    price: toWei(9),
  },
  {
    min: toWei(20000),
    max: toWei(25000),
    price: toWei(10),
  },
];

async function main() {
  const DeployContract = await ethers.getContractFactory("PositionBond01");
  const args = [
    // Name
    "Position Bond 001",
    // Symbol
    "PBOND-001",
    // Underlying Asset: POSI
    "0x5CA42204cDaa70d5c773946e69dE942b85CA6706",
    // collateral Amount:  1
    toWei(100000),
    // Face asset BUSD
    "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    // Face value: 0.2
    toWei(12),
    // Tottal supply: 10
    toWei(25000),
    // Purchase Lock Duration: 4 hours
    14400,
    // Range Bond Price
    priceRange,
    // Hold Token: POSI
    "0x5CA42204cDaa70d5c773946e69dE942b85CA6706",
    // Min amount: 1
    toWei(1000),
  ];
  // const hardhatDeployContract = await DeployContract.deploy(...args);

  // await hardhatDeployContract.deployTransaction.wait(5);

  // console.log("Bond deployed to:", hardhatDeployContract.address);
  await verifyContract("0xD4c9123e011066A971FB78D4015CD3f0B8126E75", args);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
