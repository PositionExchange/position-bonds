import {expect} from "chai";
import {IERC20, MockToken, TestPositionBond} from "../typechain";
import {deployMockToken} from "./utils/mock";
import {
    expectEvent,
    deployContract,
    toWei,
    expectEqual,
    now,
    expectERC20Balance,
    expectBalanceOfToken, expectMultiERC20Balance, ExpectErc20Detail, setDataForExpectedMap, approveAndMintToken, toEther
} from "./utils/utils";
import dayjs from "dayjs";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("PositionBond", async () => {
    const now = dayjs().unix();
    const startSale = now + 100, active = now + 2000, maturity = now + 5000, liquidated = now + 86400;
    let [issuer, user1, user2, user3, user4, user5]: SignerWithAddress[] = []
    let positionBond: TestPositionBond;
    let mockCollateralToken: MockToken, mockFaceToken: MockToken;
    const collateralAmountInWei = toWei(1000);
    const faceValue = toWei(1);
    const name = "Test Bond";
    const symbol = "TBOND-001";
    const totalSupply = toWei(1_000_000);
    const oneHundredThousandToWei = toWei(100000)
    beforeEach(async () => {
        [issuer, user1, user2, user3, user4, user5] = await ethers.getSigners();

        mockCollateralToken = await deployMockToken("MockCollateral");
        mockFaceToken = await deployMockToken("MockFaceToken");
        positionBond = await deployContract(
            "TestPositionBond",
            name,
            symbol,
            mockCollateralToken.address,
            collateralAmountInWei,
            mockFaceToken.address,
            faceValue,
            totalSupply
        );


        await approveAndMintToken(
            mockCollateralToken,
            mockFaceToken,
            positionBond,
            [issuer, user1, user2, user3, user4, user5].slice(1, ),
            issuer
        )

    });

    const expStatus = async (s: number) => {
        const status = await positionBond.getStatus();
        expect(status).to.equal(s);
    };

    it("should deploy contract successful", async () => {
        await expectEqual(positionBond.bondSupply(), totalSupply);
        await expectEqual(positionBond.symbol(), symbol);
        await expectEqual(positionBond.name(), name);
    });

    describe(" liquidation deadline ", async  ()=> {
        it('should get liquidation deadline', async function () {
            expect((await positionBond.getLiquidationDeadline())  ).equal(180)
        });
    })

    describe("issue price", async () => {
        it('should get correctly issue price', async function () {
            await positionBond.mockIssuePrice(toWei(1.5))
            await expectEqual(positionBond.issuePrice(), toWei(1.5))
        });
    })

    describe(" claim underlyingAsset ", async () => {
        const now = dayjs().unix();
        beforeEach(async () => {
            await positionBond.active(startSale, active, maturity);
        })
        it('should be matured', async function () {

            await positionBond.setMockTime(now)
            await expect(positionBond.claimUnderlyingAsset()).to.be.revertedWith("only matured")

            await positionBond.setMockTime(startSale)
            await expect(positionBond.claimUnderlyingAsset()).to.be.revertedWith("only matured")

            await positionBond.setMockTime(maturity)
            await expect(positionBond.claimUnderlyingAsset()).to.be.revertedWith("only matured")

            await positionBond.setMockTime(maturity + 1)
            await expect(positionBond.claimUnderlyingAsset()).to.be.not.revertedWith("only matured")
        });

        it('should be issuer', async function () {
            await positionBond.setMockTime(maturity + 1)
            await expect(positionBond.connect(user1).claimUnderlyingAsset()).to.be.revertedWith("only issuer")
            await expect(positionBond.claimUnderlyingAsset()).to.be.not.revertedWith("only issuer")
        });

        it('should claim claimUnderlying asset successful', async function () {
            await positionBond.setMockTime(maturity + 1);
            await positionBond.setUnderlyingAssetStatusReadyToClaimMock()
            await expectERC20Balance(
                mockCollateralToken,
                [issuer.address],
                [1000],
                async () => {
                    await positionBond.claimUnderlyingAsset()
                })
        });

    })


    describe(" claim face value ", async () => {
        it("should repay success", async () => {
            await positionBond.active(3000, 5000, 6000);

            const mockBondAmount = toWei(10000)

            await positionBond.mockBondAmount(mockBondAmount)
            await positionBond.mockCanPurchase(true)

            // purchase success after start sale time
            await positionBond.setMockTime(4000)

            await expectERC20Balance(
                mockFaceToken,
                [positionBond.address, user1.address],
                [10000, -10000],
                async () => await positionBond.connect(user1).purchase(mockBondAmount))

            // expect bond unit of user before matured
            await expectBalanceOfToken(positionBond, user1.address, mockBondAmount)

            await positionBond.setMockTime(6100)
            await positionBond.setUnderlyingAssetStatusReadyToClaimMock();
            await positionBond.setUnderlyingAssetStatusRefundedMock();
            // suppose issuer already repay face value, user can claim face value from contract
            await expectERC20Balance(
                mockFaceToken,
                [positionBond.address, user1.address],
                [-10000, 10000],
                async () => await positionBond.connect(user1).claimFaceValue())

            // expect bond unit of user after matured
            await expectBalanceOfToken(positionBond, user1.address, BigNumber.from(0))

        })

        it('should be matured', async function () {
            await positionBond.active(startSale, active, maturity);
            await positionBond.setMockTime(now)
            await expect(positionBond.claimFaceValue()).to.be.revertedWith("only matured")

            await positionBond.setMockTime(startSale)
            await expect(positionBond.claimFaceValue()).to.be.revertedWith("only matured")

            await positionBond.setMockTime(maturity)
            await expect(positionBond.claimFaceValue()).to.be.revertedWith("only matured")

            await positionBond.setMockTime(maturity + 1)
            await expect(positionBond.claimFaceValue()).to.be.not.revertedWith("only matured")
        });
        it('should can claim face value only Refunded', async function () {
            await positionBond.active(startSale, active, maturity);

            const mockBondAmount = 10000
            const mockBondAmountInWei = toWei(10000)

            await positionBond.mockBondAmount(mockBondAmountInWei)
            await positionBond.mockCanPurchase(true)

            // purchase success after start sale time
            await positionBond.setMockTime(startSale + 1)

            let expectedMapPurchase = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapPurchase = await setDataForExpectedMap(expectedMapPurchase, positionBond, [user1.address], [mockBondAmount ])
            expectedMapPurchase = await setDataForExpectedMap(expectedMapPurchase, mockFaceToken, [user1.address, positionBond.address], [-mockBondAmount , mockBondAmount ])
            await expectMultiERC20Balance(expectedMapPurchase, async () => await positionBond.connect(user1).purchase(mockBondAmountInWei))

            // claim sold amount after active time
            await positionBond.setMockTime(active + 1)

            let expectedMapClaimSold = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapClaimSold = await setDataForExpectedMap(expectedMapClaimSold, mockFaceToken, [positionBond.address, issuer.address], [-mockBondAmount , mockBondAmount ])

            await expectMultiERC20Balance(expectedMapClaimSold, async () => await positionBond.connect(issuer).claimSoldAmount(mockBondAmountInWei))

            // try claim face value after matured time
            await positionBond.setMockTime(maturity + 1)
            await expect(positionBond.connect(user1).claimFaceValue()).to.be.revertedWith("only refunded")
        });
    })

    describe("active bond", async () => {
        it("should revert while activating", async () => {
            await expect(positionBond.active(10, 5, 3)).to.be.revertedWith("!time");
            await expect(positionBond.active(10, 5, 8)).to.be.revertedWith("!time");

            const collateralAmount = 1000

            // expect issuer and position collateral's balance before and after issuer active bond
            await expectERC20Balance(mockCollateralToken, [issuer.address, positionBond.address], [-collateralAmount, collateralAmount], async () => await positionBond.active(3, 5, 6))

            await positionBond.setMockTime(4);
            await expStatus(1);

            await expect(positionBond.active(3, 5, 8)).to.be.revertedWith("!pending");
        })

        it("should active fail cause not enough underlying asset", async () => {
            await mockCollateralToken.connect(issuer).transfer(user1.address, toWei(9999))
            await expect(positionBond.connect(issuer).active(3, 5, 6)).to.be.revertedWith("ERC20: transfer amount exceeds balance")
        })
    });

    describe("purchase", () => {
        it("should purchase success when start sale", async () => {
            await positionBond.active(3000, 5000, 6000);

            const mockBondAmount = 10000
            const mockBondAmountInWei = toWei(10000)

            await positionBond.mockBondAmount(mockBondAmountInWei)
            await positionBond.mockCanPurchase(true)

            // try to purchase before start sale time but will be reverted
            await expect(positionBond.connect(user1).purchase(mockBondAmountInWei)).to.be.revertedWith("only on sale")

            // purchase success after start sale time
            await positionBond.setMockTime(4000)

            let expectedMap = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMap = await setDataForExpectedMap(expectedMap, positionBond, [user1.address], [mockBondAmount])
            expectedMap = await setDataForExpectedMap(expectedMap, mockFaceToken, [user1.address, positionBond.address], [-mockBondAmount, mockBondAmount])


            await expectMultiERC20Balance(expectedMap, async () => await positionBond.connect(user1).purchase(mockBondAmountInWei))
            await expect(positionBond.connect(user1).transfer(user4.address, toWei(10))).to.be.revertedWith("not transferable")

            // try to purchase after active time but will be reverted
            await positionBond.setMockTime(6000)
            await expect(positionBond.connect(user2).purchase(mockBondAmountInWei)).to.be.revertedWith("only on sale")

            // transfer bond
            const balanceBefore = await positionBond.balanceOf(user4.address);
            await positionBond.connect(user1).transfer(user4.address, toWei(10))
            const balanceAfter = await positionBond.balanceOf(user4.address);
            expect(balanceAfter.sub(balanceBefore)).to.be.eq(toWei(10))

        })

        it("should purchase fail", async () => {
            await positionBond.active(3000, 5000, 6000);

            const mockBondAmount = toWei(10000)

            await positionBond.mockBondAmount(mockBondAmount)

            // try to purchase before start sale time but will be reverted
            await expect(positionBond.connect(user1).purchase(mockBondAmount)).to.be.revertedWith("only on sale")

            // try to purchase after start sale but not purchasable
            await positionBond.setMockTime(4000)
            await expect(positionBond.connect(user1).purchase(mockBondAmount)).to.be.revertedWith("not purchasable")

            // try to purchase after active time but will be reverted
            await positionBond.setMockTime(6000)
            await expect(positionBond.connect(user2).purchase(mockBondAmount)).to.be.revertedWith("only on sale")
        })
    });

    describe("repay", async () => {
        // amount BUSD when user bought.
        // With issue price is 0.5$ => 2000$ * 0.5 = 1000 BOND_UINT => totalSupply() = 1000
        const amountPurchased = toWei(2000)
        const bondAmount = toWei(1000);

        beforeEach(async () => {
            await positionBond.active(startSale, active, maturity);
        })

        it('should only issuer', async function () {
            await positionBond.setMockTime(maturity + 1)
            await expect(positionBond.connect(user1).repay()).to.be.revertedWith("only issuer")
        });
        it('should matured', async function () {

            await positionBond.setMockTime(maturity)
            await expect(positionBond.repay()).to.be.revertedWith("only matured")
            await positionBond.setMockTime(maturity + 1)
            await expect(positionBond.repay()).to.be.not.revertedWith("only matured")
            await positionBond.setMockTime(liquidated)
            await expect(positionBond.repay()).to.be.revertedWith("only not reach liquidation time")
        });
        it('should repay successfully and update underlying asset status is 3 (ready to claim)', async function () {
            // mock BOND start sale
            await positionBond.setMockTime(startSale + 1);
            // mock can purchase
            await positionBond.mockCanPurchase(true);

            // mock bond amount when purchase
            await positionBond.mockBondAmount(bondAmount)

            // mock user1 purchase BOND
            await positionBond.connect(user1).purchase(amountPurchased)

            // mock BOND mature
            await positionBond.setMockTime(maturity + 1)

            // total soldAmount is 1000$ ~ 100 BOND => 10$/BOND.
            // Face price is 12$ after maturity, issuer must repay 1200$
            await expectERC20Balance(
                mockFaceToken,
                [issuer.address, positionBond.address],
                [-1000, 1000],
                async () => {
                    await positionBond.repay()
                })

            expect((await positionBond.getUnderlyingAssetStatus())).to.be.equal(3)

        });

        it('should can not repay when reach liquidate time', async function () {
            const collateralAmount = 1000
            const mockBondAmount  = 10000
            const mockBondAmountInWei = toWei(10000)

            await positionBond.mockBondAmount(mockBondAmountInWei)
            await positionBond.mockCanPurchase(true)

            // purchase success after start sale time
            await positionBond.setMockTime(startSale + 1)

            let expectedMapPurchase = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapPurchase = await setDataForExpectedMap(expectedMapPurchase, positionBond, [user1.address], [mockBondAmount ])
            expectedMapPurchase = await setDataForExpectedMap(expectedMapPurchase, mockFaceToken, [user1.address, positionBond.address], [-mockBondAmount , mockBondAmount ])
            await expectMultiERC20Balance(expectedMapPurchase, async () => await positionBond.connect(user1).purchase(mockBondAmountInWei))

            // claim sold amount after active time
            await positionBond.setMockTime(active + 1)

            let expectedMapClaimSold = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapClaimSold = await setDataForExpectedMap(expectedMapClaimSold, mockFaceToken, [positionBond.address, issuer.address], [-mockBondAmount , mockBondAmount ])

            await expectMultiERC20Balance(expectedMapClaimSold, async () => await positionBond.connect(issuer).claimSoldAmount(mockBondAmountInWei))

            // try to repay after liquidated time but fail
            await positionBond.setMockTime(maturity + 86400)

            await expect(positionBond.connect(issuer).repay()).to.be.revertedWith("only not reach liquidation time")
        });
    });

    describe("claim sold amount", async () => {
        // amount BUSD when user bought.
        // With issue price is 0.5$ => 2000$ * 0.5 = 1000 BOND_UINT => totalSupply() = 1000
        const amountPurchased = toWei(2000)
        const bondAmount = toWei(1000);

        beforeEach(async () => {
            await positionBond.active(startSale, active, maturity);

            await positionBond.setMockTime(startSale + 1)

            await positionBond.mockBondAmount(bondAmount)
            await positionBond.mockCanPurchase(true)

            // try to purchase before start sale time but will be reverted
            await positionBond.connect(user1).purchase(amountPurchased);

        })

        it('should only issuer', async function () {
            await positionBond.setMockTime(active + 1)
            await expect(positionBond.connect(user1).claimSoldAmount(amountPurchased)).to.be.revertedWith("only issuer")
            await expect(positionBond.claimSoldAmount(amountPurchased)).to.be.not.revertedWith("only issuer")
        });

        it('should only active', async function () {
            await positionBond.setMockTime(active)
            await expect(positionBond.claimSoldAmount(amountPurchased)).to.be.revertedWith("only active")

            await positionBond.setMockTime(active + 1)
            await expect(positionBond.claimSoldAmount(amountPurchased)).to.be.not.revertedWith("only active")

            await positionBond.setMockTime(maturity + 1)
            await expect(positionBond.claimSoldAmount(amountPurchased)).to.be.revertedWith("only active")
        });

        it('should claim sold amount less than total faceValue (2000$)', async function () {
            await positionBond.setMockTime(active + 1)

            await expectERC20Balance(
                mockFaceToken,
                [positionBond.address, issuer.address],
                [-1500, 1500],
                async () => await positionBond.claimSoldAmount(amountPurchased.sub(toWei(500)))
            )

            await expect(positionBond.claimSoldAmount(amountPurchased)).to.be.revertedWith("ERC20: transfer amount exceeds balance")

            await expectERC20Balance(
                mockFaceToken,
                [positionBond.address, issuer.address],
                [-500, 500],
                async () => await positionBond.claimSoldAmount(toWei(500))
            )


        });
    })

    describe("liquidated", async () => {
        const liquidate = maturity + 100;
        beforeEach(async () => {
            await positionBond.active(startSale, active, maturity);
            await positionBond.setMockTimeLiquidate(liquidate);
        })

        it('should only reach liquidate', async function () {
            await positionBond.setMockTime(active);
            await expect(positionBond.liquidate()).to.be.revertedWith("only reach liquidation time")

            await positionBond.setMockTime(maturity);
            await expect(positionBond.liquidate()).to.be.revertedWith("only reach liquidation time")

            await positionBond.setMockTime(liquidate);
            await expect(positionBond.liquidate()).to.be.revertedWith("only reach liquidation time")

            await positionBond.setMockTime(liquidate + 1);
            await expect(positionBond.liquidate()).to.be.not.revertedWith("only reach liquidation time")

        });
        it('should set underlying asset status to liquidated', async function () {

            await positionBond.setMockTime(liquidate);
            await expect(positionBond.liquidate()).to.be.revertedWith("only reach liquidation time")

            expect((await positionBond.getUnderlyingAssetStatus())).equal(1)

            await positionBond.setMockTime(liquidate + 1);
            await positionBond.connect(user1).liquidate();
            expect((await positionBond.getUnderlyingAssetStatus())).equal(2)

        });

        it('should set underlying asset status to liquidated one time', async function () {
            // on hold
            expect((await positionBond.getUnderlyingAssetStatus())).equal(1)
            // mock time to reach liquidation time
            await positionBond.setMockTime(liquidate + 1);
            await positionBond.connect(user1).liquidate();
            expect((await positionBond.getUnderlyingAssetStatus())).equal(2)
            await expect(positionBond.connect(user1).liquidate()).to.be.revertedWith("!OnHold")

        });

    })

    describe("full flow test", async function () {
        it('should can claim value with full flow', async function () {
            await positionBond.active(startSale, active, maturity);

            const collateralAmount = 1000
            const mockBondAmount  = 10000
            const mockBondAmountInWei = toWei(10000)

            await positionBond.mockBondAmount(mockBondAmountInWei)
            await positionBond.mockCanPurchase(true)

            // purchase success after start sale time
            await positionBond.setMockTime(startSale + 1)

            let expectedMapPurchase = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapPurchase = await setDataForExpectedMap(expectedMapPurchase, positionBond, [user1.address], [mockBondAmount ])
            expectedMapPurchase = await setDataForExpectedMap(expectedMapPurchase, mockFaceToken, [user1.address, positionBond.address], [-mockBondAmount , mockBondAmount ])
            await expectMultiERC20Balance(expectedMapPurchase, async () => await positionBond.connect(user1).purchase(mockBondAmountInWei))

            // claim sold amount after active time
            await positionBond.setMockTime(active + 1)

            let expectedMapClaimSold = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapClaimSold = await setDataForExpectedMap(expectedMapClaimSold, mockFaceToken, [positionBond.address, issuer.address], [-mockBondAmount , mockBondAmount ])

            await expectMultiERC20Balance(expectedMapClaimSold, async () => await positionBond.connect(issuer).claimSoldAmount(mockBondAmountInWei))

            // repay after matured time
            await positionBond.setMockTime(maturity + 1)

            let expectedMapRepay = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapRepay = await setDataForExpectedMap(expectedMapRepay, mockFaceToken, [positionBond.address, issuer.address], [mockBondAmount, -mockBondAmount])

            await expectMultiERC20Balance(expectedMapRepay, async () => await positionBond.connect(issuer).repay())

            // issuer claim underlying asset after repay
            let expectedMapClaimUnderlying = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMapClaimUnderlying = await setDataForExpectedMap(expectedMapClaimUnderlying, mockCollateralToken, [positionBond.address, issuer.address], [-collateralAmount, collateralAmount])

            await expectMultiERC20Balance(expectedMapClaimUnderlying, async () => await positionBond.connect(issuer).claimUnderlyingAsset())

            // user claim face value after issuer claim underlying asset
            let expectedClaimFaceValue = new Map<IERC20, ExpectErc20Detail[]>()

            expectedClaimFaceValue = await setDataForExpectedMap(expectedClaimFaceValue, mockFaceToken, [user1.address, positionBond.address], [mockBondAmount, -mockBondAmount])
            expectedClaimFaceValue = await setDataForExpectedMap(expectedClaimFaceValue, positionBond, [user1.address], [-mockBondAmount])

            await expectMultiERC20Balance(expectedClaimFaceValue, async () => await positionBond.connect(user1).claimFaceValue())
        });
    })

    describe("claim liquidated underlying asset", async () => {
        const mockBondAmount = 10000
        const mockBondAmountInWei = toWei(10000)
        const collateralAmount = 1000
        const totalSupplyBond = 1000000
        beforeEach(async () => {
            await positionBond.active(startSale, active, maturity);
        })
        it("should claim fail cause invalid status", async () => {
            await positionBond.mockBondAmount(mockBondAmountInWei)
            await positionBond.mockCanPurchase(true)

            await positionBond.setMockTime(startSale + 1)
            await positionBond.connect(user1).purchase(mockBondAmountInWei)
            await expect(positionBond.connect(user1).claimLiquidatedUnderlyingAsset()).to.be.revertedWith("only matured")

            await positionBond.setMockTime(maturity + 1)
            await expect(positionBond.connect(user1).claimLiquidatedUnderlyingAsset()).to.be.revertedWith("only liquidated")
        })
        it("should claim underlying success", async () => {
            await positionBond.mockBondAmount(mockBondAmountInWei)
            await positionBond.mockCanPurchase(true)

            await positionBond.setMockTime(startSale + 1)
            await positionBond.connect(user1).purchase(mockBondAmountInWei)

            await positionBond.setMockTime(maturity + 1)
            await positionBond.setUnderlyingAssetStatusLiquidatedMock()


            const expectedCollateralClaimed = mockBondAmount * collateralAmount / totalSupplyBond

            let expectedMap = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMap = await setDataForExpectedMap(expectedMap, positionBond, [user1.address], [-mockBondAmount])
            expectedMap = await setDataForExpectedMap(expectedMap, mockCollateralToken, [user1.address, positionBond.address], [expectedCollateralClaimed, -expectedCollateralClaimed])

            await expectMultiERC20Balance(expectedMap, async () => await positionBond.connect(user1).claimLiquidatedUnderlyingAsset())
        })
    })

    describe("claim remainder underlying asset", async () => {
        it("should claim remainder underlying asset", async () => {
            const mockBondAmount = 10000
            const mockBondAmountInWei = toWei(10000)
            const halfMockBondAmount = 5000
            const collateralAmount = 1000
            const totalSupplyBond = 1000000
            const expectedRemainder = (totalSupplyBond - mockBondAmount) * collateralAmount / totalSupplyBond
            await positionBond.active(startSale, active, maturity);

            await positionBond.mockBondAmount(mockBondAmountInWei)
            await positionBond.mockCanPurchase(true)

            await positionBond.setMockTime(startSale + 1)

            await expect(positionBond.connect(issuer).claimRemainderUnderlyingAsset()).to.be.revertedWith("only reach active time")

            await positionBond.connect(user1).purchase(mockBondAmountInWei)

            await positionBond.setMockTime(active + 1)

            let expectedMap = new Map<IERC20, ExpectErc20Detail[]>()
            expectedMap = await setDataForExpectedMap(expectedMap, mockCollateralToken, [issuer.address, positionBond.address], [expectedRemainder, -expectedRemainder])

            await expectMultiERC20Balance(expectedMap, async () => await positionBond.connect(issuer).claimRemainderUnderlyingAsset())

            await expect(positionBond.connect(issuer).claimRemainderUnderlyingAsset()).to.be.revertedWith("already claimed")
        })
    })
})
