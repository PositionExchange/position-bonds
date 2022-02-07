import dayjs from "dayjs";
import { ethers } from "hardhat";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import {FaceAsset, IERC20, MockToken} from "../../typechain";
import {BigNumber} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

use(solidity);

export interface ExpectErc20Detail {
    user: string,
    changedAmount: number,
    balanceBefore?: BigNumber,
    balanceAfter?: BigNumber,
}

export interface BondPriceRange {
    min: BigNumber,
    max: BigNumber,
    price: BigNumber,
}

export const now = () => dayjs().unix();

export async function deployContract<T>(
    artifactName: string,
    ...args: any[]
): Promise<T> {
    const Contract = await ethers.getContractFactory(artifactName);
    const ins = await Contract.deploy(...args);
    await ins.deployed();
    return ins as unknown as T;
}

export async function expectEvent(
    contract: any,
    call: any,
    eventName: string,
    args: any[]
): Promise<any> {
    await expect(call)
        .to.emit(contract, eventName)
        .withArgs(...args)
}

export async function expectRevert(call: any, message: string) {
    await expect(call).to.revertedWith(message);
}

export function toWei(value: number | string) {
    return ethers.utils.parseEther(value.toString());
}

export function toEther(value: number | string) {
    return ethers.utils.formatEther(value);
}

export async function expectEqual(call: Promise<any>, result: any) {
    console.log(result)
    expect(await call).to.equal(result);
}


/// Check balance of list address
/// Expect with After Balance sub Before Balance
export async function expectERC20Balance(token: IERC20, users: string[], expectAmounts: number[], executeFn: Function) {

    let balanceBefore = await Promise.all(users.map(async (address) => {
            return (await token.balanceOf(address));
        })
    );
    await executeFn.call(undefined)
    // callback execute

    let balanceAfter =  await Promise.all(users.map(async (address) => {
            return (await token.balanceOf(address));
        })
    );

    expectAmounts.forEach((amount, index) => {

        expect(balanceAfter[index].sub(balanceBefore[index]), `expect balance not 
        correct at index ${index} with expect amount ${expectAmounts[index]}`).to.be.equal(toWei(amount), );
    })
}

export async function expectBalanceOfToken(token: IERC20, address: string, expectedAmount: BigNumber) {
    const tokenBalance = await token.balanceOf(address)
    await expect(tokenBalance).eq(expectedAmount)
}

export async function expectMultiERC20Balance(expectedMap: Map<IERC20, ExpectErc20Detail[]>, executeFn: Function) {
    expectedMap.forEach( (value, key, map) => {
        value.map(async (detail) => {
            detail.balanceBefore = await key.balanceOf(detail.user)
        })
    })

    // callback execute
    await executeFn.call(undefined)
    let indexInMap = 0;
    expectedMap.forEach(  (value, key, map) => {
        value.map(async (detail, index) => {
            detail.balanceAfter = await key.balanceOf(detail.user)
            // @ts-ignore
            expect(detail.balanceAfter.sub(detail.balanceBefore), `expect balance not 
        correct at index ${indexInMap} in map, index ${index} in array value with expect amount ${toWei(detail.changedAmount)}`).to.be.equal(toWei(detail.changedAmount));

        })
        indexInMap++

    })
}

export async function setDataForExpectedMap(expectedMap: Map<IERC20, ExpectErc20Detail[]>, token: IERC20, users: string[], changedAmounts: number[]) : Promise<any> {
    let expectedDetails : ExpectErc20Detail[] = []
    users.forEach((user, index) => {
        expectedDetails.push({
            user: user,
            changedAmount: changedAmounts[index]
        })
    })
    expectedMap.set(token, expectedDetails)
    return expectedMap
}


export async function approveAndMintToken(
    mockCollateralToken : MockToken,
    mockFaceToken : MockToken,
    positionBond : any,
    users :SignerWithAddress[],
    issuer : SignerWithAddress){

    // mint collateral token for issuer and approve for bond contract
    await mockCollateralToken.approve(positionBond.address, ethers.constants.MaxUint256);

    await mockFaceToken.connect(issuer).approve(positionBond.address, ethers.constants.MaxUint256);

    // mint face token for user to buy bond
    users.forEach((user) => {
        mockFaceToken.mint(user.address, toWei(100000));
        mockFaceToken.connect(user).approve(positionBond.address, ethers.constants.MaxUint256)
    })

}