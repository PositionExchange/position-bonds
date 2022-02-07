import {expect} from "chai";
import {IERC20, MockToken, TestPositionBond} from "../../typechain";
// import {deployMockToken} from "./utils/mock";
import {
    expectEvent,
    deployContract,
    toWei,
    expectEqual,
    now,
    expectERC20Balance,
    expectBalanceOfToken,
    expectMultiERC20Balance,
    ExpectErc20Detail,
    setDataForExpectedMap,
    approveAndMintToken,
    BondPriceRange
} from "../utils/utils";
import dayjs from "dayjs";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {deployMockToken} from "../utils/mock";

describe("Flexible Price TimeLock", async () => {
    const now = dayjs().unix();
    const startSale = now + 100, active = now + 2000, maturity = now + 5000, liquidated = now + 86400;
    let [issuer, user1, user2, user3, user4, user5]: SignerWithAddress[] = []
    let fixedPriceBond: TestPositionBond;
    let mockCollateralToken: MockToken, mockFaceToken: MockToken;
    const collateralAmountInWei = toWei(1000);
    const faceValue = toWei(1);
    const name = "Fixed Price Hold Token Bond";
    const symbol = "FPB-001";
    const totalSupply = toWei(1_000_000);
    const oneHundredThousandToWei = toWei(100000)
    const bondPriceRange : BondPriceRange[] = []
    beforeEach(async () => {
        [issuer, user1, user2, user3, user4, user5] = await ethers.getSigners();

        mockCollateralToken = await deployMockToken("MockCollateral");
        mockFaceToken = await deployMockToken("MockFaceToken");
        fixedPriceBond = await deployContract(
            "TestFlexiblePriceTimeLock",
            name,
            symbol,
            mockCollateralToken.address,
            collateralAmountInWei,
            mockFaceToken.address,
            faceValue,
            totalSupply,
            toWei(0.5),
            mockCollateralToken.address,
            toWei(10)
        );


        await approveAndMintToken(
            mockCollateralToken,
            mockFaceToken,
            fixedPriceBond,
            [issuer, user1, user2, user3, user4, user5].slice(1, ),
            issuer
        )
    });

    const expStatus = async (s: number) => {
        const status = await fixedPriceBond.getStatus();
        expect(status).to.equal(s);
    };

    describe(" active ", async () => {

    })
})