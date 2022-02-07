import { ethers } from "hardhat";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { TestBondMath } from "../../typechain";
import {expectEqual, toWei} from "../utils/utils";
import {BigNumber} from "ethers";
use(solidity);

describe("BondMath", async () => {
    const bondUnitInWei = toWei(1000)
    const faceValueInWei = toWei(1)
    const bondBalanceInWei  = toWei(100)
    const bondSupplyInWei = toWei(1000000)
    const underlyingAmountInWei = toWei(500000)
    const remainderAmountInWei = toWei((1000000 - 1000) / 1000000 * 500000)
    let bondMath: TestBondMath
    beforeEach(async () => {
        const BondMath = await ethers.getContractFactory("TestBondMath")
        bondMath = await BondMath.deploy()
        await bondMath.deployed()
    })
    it("should calculate face value correct",  async() => {
        expect(await bondMath.calculateFaceValue(bondUnitInWei, faceValueInWei)).to.be.equal(bondUnitInWei)
    })

    it("should calculate underlying asset correct",  async() => {
        expect(await bondMath.calculateUnderlyingAsset(bondBalanceInWei, bondSupplyInWei, underlyingAmountInWei)).to.be.equal(toWei(50))
    })

    it("should calculate remainder underlying asset", async () => {
        expect(await bondMath.calculateRemainderUnderlyingAsset(bondSupplyInWei, bondUnitInWei, underlyingAmountInWei)).to.be.equal(remainderAmountInWei)
    })
})