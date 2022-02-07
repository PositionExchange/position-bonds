const { formatBytes32String } = require("ethers/lib/utils");
import { ethers } from "hardhat";
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
    max: toWei(15000),
    price: toWei(7),
  },
  {
    min: toWei(15000),
    max: toWei(30000),
    price: toWei(8),
  },
  {
    min: toWei(30000),
    max: toWei(45000),
    price: toWei(9),
  },
  {
    min: toWei(45000),
    max: toWei(60000),
    price: toWei(10),
  },
  {
    min: toWei(60000),
    max: toWei(75000),
    price: toWei(11),
  },
  {
    min: toWei(75000),
    max: toWei(90000),
    price: toWei(12),
  },
  {
    min: toWei(90000),
    max: toWei(105000),
    price: toWei(13),
  },
];
const priceRangeTest = [
    {
        min: toWei(10),
        max: toWei(100),
        price: toWei(10),
    },
]

async function main() {
  const DeployContract = await ethers.getContractFactory("PositionBond002");
  const args: any[] = [
    // Name
    "Position Bond 002",
    // Symbol
    "PBOND-002",
    // Underlying Asset: POSI
    "0x0000000000000000000000000000000000000000",
    // collateral Amount:  1
    toWei(0),
    // Face asset
    "0x5ca42204cdaa70d5c773946e69de942b85ca6706",
    // Face value
    toWei(13),
    // Tottal supply
    toWei(105000),
    // Purchase Lock Duration: 4 hours
    14400,
    // Range Bond Price
    priceRange,
  ]
  
  //@ts-ignore
  const hardhatDeployContract = await DeployContract.deploy(...args);

  await hardhatDeployContract.deployTransaction.wait(5);

  console.log("Bond deployed to:", hardhatDeployContract.address);
  await verifyContract(hardhatDeployContract.address, args);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
