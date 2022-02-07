import {expect} from "chai";
import {IERC20, MockToken, TestFlexiblePriceBondHoldTokenTimeLock} from "../../typechain";
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

describe("Full strategy contract", async () => {
    const now = dayjs().unix();
    const startSale = now, active = now + 20000, maturity = now + 50000, liquidated = now + 86400;
    let [issuer, user1, user2, user3, user4, user5]: SignerWithAddress[] = []
    let fullStrategyContract: TestFlexiblePriceBondHoldTokenTimeLock;
    let mockCollateralToken: MockToken, mockFaceToken: MockToken;
    const collateralAmountInWei = toWei(1000);
    const faceValue = toWei(2);
    const name = "Fixed Strategy Bond";
    const symbol = "FSB-001";
    const totalSupply = toWei(1_000_000);
    const oneHundredThousandToWei = toWei(100000)
    const holdTokenRequireAmount = toWei(1)
    const priceRange = [
        {
            min : BigNumber.from(0),
            max : BigNumber.from('4000000000000000000000'),
            price : BigNumber.from('1000000000000000000')
        },
        {
            min : BigNumber.from('4000000000000000000000'),
            max : BigNumber.from('7000000000000000000000'),
            price : BigNumber.from('1250000000000000000')
        },
        {
            min : BigNumber.from('7000000000000000000000'),
            max : BigNumber.from('10000000000000000000000'),
            price : BigNumber.from('1500000000000000000')
        }
    ]
    beforeEach(async () => {
        [issuer, user1, user2, user3, user4, user5] = await ethers.getSigners();

        mockCollateralToken = await deployMockToken("MockCollateral");
        mockFaceToken = await deployMockToken("MockFaceToken");
        fullStrategyContract = await deployContract(
            "TestFlexiblePriceBondHoldTokenTimeLock",
            name,
            symbol,
            mockCollateralToken.address,
            collateralAmountInWei,
            mockFaceToken.address,
            faceValue,
            totalSupply,
            priceRange,
            mockCollateralToken.address,
            holdTokenRequireAmount,
            1
        );


        await approveAndMintToken(
            mockCollateralToken,
            mockFaceToken,
            fullStrategyContract,
            [issuer, user1, user2, user3, user4, user5].slice(1, ),
            issuer
        )
    });

    const expStatus = async (s: number) => {
        const status = await fullStrategyContract.getStatus();
        expect(status).to.equal(s);
    };

    describe("full flow test", async function () {
        it('should can claim value with full flow', async function () {
            await fullStrategyContract.active(startSale, active, maturity);

            const collateralAmount = 1000
            const mockBondAmount  = 10000
            const mockBondAmountInWei = toWei(10000)

            // purchase success after start sale time
            await fullStrategyContract.setMockTime(startSale + 1)
            console.log(99)
            // not purchasable cause not holding any required token
            await expect(fullStrategyContract.connect(user1).purchase(mockBondAmountInWei)).to.be.revertedWith("not purchasable")

            await mockCollateralToken.mint(user1.address, BigNumber.from(toWei(1000)))
            console.log(104)
            let expectedMapPurchase = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapPurchase = await setDataForExpectedMap(expectedMapPurchase, fullStrategyContract, [user1.address], [4000 ])
            expectedMapPurchase = await setDataForExpectedMap(expectedMapPurchase, mockFaceToken, [user1.address, fullStrategyContract.address], [-4000 , 4000 ])
            await expectMultiERC20Balance(expectedMapPurchase, async () => await fullStrategyContract.connect(user1).purchase(mockBondAmountInWei))

            console.log(113)
            await fullStrategyContract.setMockTime(startSale + 100)

            let expectedMapPurchaseSecondTime = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapPurchaseSecondTime = await setDataForExpectedMap(expectedMapPurchaseSecondTime, fullStrategyContract, [user1.address], [3000 ])
            expectedMapPurchaseSecondTime = await setDataForExpectedMap(expectedMapPurchaseSecondTime, mockFaceToken, [user1.address, fullStrategyContract.address], [-3750 , 3750 ])
            await expectMultiERC20Balance(expectedMapPurchaseSecondTime, async () => await fullStrategyContract.connect(user1).purchase(mockBondAmountInWei))
            console.log(120)
            await fullStrategyContract.setMockTime(active + 1)

            let expectedMapClaimSold = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapClaimSold = await setDataForExpectedMap(expectedMapClaimSold, mockFaceToken, [fullStrategyContract.address, issuer.address], [-7750 , 7750])

            await expectMultiERC20Balance(expectedMapClaimSold, async () => await fullStrategyContract.connect(issuer).claimSoldAmount(toWei('7750')))

            // repay after matured time
            await fullStrategyContract.setMockTime(maturity + 1)

            let expectedMapRepay = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapRepay = await setDataForExpectedMap(expectedMapRepay, mockFaceToken, [fullStrategyContract.address, issuer.address], [14000, -14000])

            await expectMultiERC20Balance(expectedMapRepay, async () => await fullStrategyContract.connect(issuer).repay())

            // issuer claim underlying asset after repay
            let expectedMapClaimUnderlying = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapClaimUnderlying = await setDataForExpectedMap(expectedMapClaimUnderlying, mockCollateralToken, [fullStrategyContract.address, issuer.address], [-collateralAmount, collateralAmount])

            await expectMultiERC20Balance(expectedMapClaimUnderlying, async () => await fullStrategyContract.connect(issuer).claimUnderlyingAsset())

            // user claim face value after issuer claim underlying asset
            let expectedClaimFaceValue = new Map<IERC20, ExpectErc20Detail[]>()

            expectedClaimFaceValue = await setDataForExpectedMap(expectedClaimFaceValue, mockFaceToken, [user1.address, fullStrategyContract.address], [14000, -14000])
            expectedClaimFaceValue = await setDataForExpectedMap(expectedClaimFaceValue, fullStrategyContract, [user1.address], [-7000])

            await expectMultiERC20Balance(expectedClaimFaceValue, async () => await fullStrategyContract.connect(user1).claimFaceValue())
        });
    })
})