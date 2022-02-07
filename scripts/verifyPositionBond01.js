const {formatBytes32String} = require("ethers/lib/utils");
const {ethers} = require("hardhat");
const hre = require("hardhat");
// const = require
const {version} = require('chai');
const {BigNumber} = require('ethers')


async function verifyContract(address, args, contract) {
    const verifyObj = {address}
    if (args) {
        verifyObj.constructorArguments = args
    }
    if (contract) {
        verifyObj.contract = contract;
    }
    verifyObj.contract =  "contracts/PositionBond01.sol:PositionBond01"
    console.log("verifyObj", verifyObj)
    return hre
        .run("verify:verify",
            verifyObj
        )
        .then(() =>
            console.log(
                "Contract address verified:",
                address
            )
        );
}

const priceRange = [
    {
        min: BigNumber.from(0),
        max: BigNumber.from('4000000000000000000'),
        price: BigNumber.from('100000000000000000')
    },
    {
        min: BigNumber.from('4000000000000000000'),
        max: BigNumber.from('7000000000000000000'),
        price: BigNumber.from('125000000000000000')
    },
    {
        min: BigNumber.from('7000000000000000000'),
        max: BigNumber.from('10000000000000000000'),
        price: BigNumber.from('150000000000000000')
    }
]

async function main() {
    await verifyContract("0xC7411cea7275F24FBc95276e878d775661e72DdC", [
        // Name
        "Test Posi Bond 01 Prod",
        // Symbol
        "TBOND-01-PROD",
        // Underlying Asset: POSI
        "0x5ca42204cdaa70d5c773946e69de942b85ca6706",
        // collateral Amount:  1
        BigNumber.from('1000000000000000000'),
        // Face asset BUSD
        "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        // Face value: 0.3
        BigNumber.from('300000000000000000'),
        // Tottal supply: 10
        BigNumber.from('10000000000000000000'),
        // Purchase Lock Duration: 5mins
        300,
        // Range Bond Price
        priceRange,
        // Hold Token: POSI
        "0x5ca42204cdaa70d5c773946e69de942b85ca6706",
        // Mint amount: 1
        "1000000000000000000",
    ])
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
