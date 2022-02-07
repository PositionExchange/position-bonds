const {formatBytes32String} = require( "ethers/lib/utils");
const { ethers } = require("hardhat") ;
const hre = require("hardhat");
// const = require
const { version } = require('chai');
const {BigNumber} = require('ethers')


async function verifyContract(address, args, contract ) {
    const verifyObj = {address}
    if(args){
        verifyObj.constructorArguments = args
    }
    if(contract){
        verifyObj.contract = contract;
    }
    console.log("verifyObj", verifyObj)
    return hre
        .run("verify:verify", verifyObj)
        .then(() =>
            console.log(
                "Contract address verified:",
                address
            )
        );
}

async function main() {
    const DeployContract = await ethers.getContractFactory("TestHoldTokenAndStake");
    const hardhatDeployContract = await DeployContract.deploy(
        "0x5ca42204cdaa70d5c773946e69de942b85ca6706",
        BigNumber.from("100000000000000000000"));

    await hardhatDeployContract.deployTransaction.wait(3);

    console.log("ChainLink deployed to:", hardhatDeployContract.address);
    await verifyContract(hardhatDeployContract.address,
        ["0x5ca42204cdaa70d5c773946e69de942b85ca6706",  BigNumber.from("100000000000000000000")])
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
