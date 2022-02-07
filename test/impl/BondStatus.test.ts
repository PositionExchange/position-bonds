import { expect, use } from "chai";
import { ethers } from "hardhat";
import { deployContract, MockProvider, solidity } from "ethereum-waffle";
import { TestBondStatus } from "../../typechain";
import dayjs from "dayjs";
use(solidity);
describe("BondStatus", () => {
  let bondStatus: TestBondStatus;
  let now: number;
  beforeEach(async () => {
    const BondStatus = await ethers.getContractFactory("TestBondStatus");
    bondStatus = await BondStatus.deploy();
    await bondStatus.deployed();
    now = dayjs().unix();
  });

  const expStatus = async (s: number) => {
    const status = await bondStatus.getStatus();
    expect(status).to.equal(s);
  };

  it("active", async () => {
    await expect(bondStatus.active(10, 5, 3)).to.be.revertedWith("!time");
    await expect(bondStatus.active(10, 5, 8)).to.be.revertedWith("!time");
    await bondStatus.active(3, 5, 6);
    await bondStatus.setMockTime(4);
    await expStatus(1);
    await expect(bondStatus.active(3, 5, 8)).to.be.revertedWith("!pending");
  });

  describe("check status", async () => {
    it("similate time", async () => {
      await expStatus(0);
      const startSale = now + 100,
        active = now + 200,
        maturity = now + 500;

      await bondStatus.active(startSale, active, maturity);

      await bondStatus.setMockTime(now);
      await expStatus(0);

      await bondStatus.setMockTime(now + 50);
      await expStatus(0);

      await bondStatus.setMockTime(startSale + 1);
      await expStatus(1);

      await bondStatus.setMockTime(now + 205);
      await expStatus(2);

      await bondStatus.setMockTime(now + 500);
      await expStatus(2);

      await bondStatus.setMockTime(now + 501);
      await expStatus(3);

      await bondStatus.setMockTime(now + 600);
      await expStatus(3);
    });

    it("should not call active() double times", async () => {
      const n = now;
      await bondStatus.active(n - 100, n + 100, n + 200);
      await expect(
        bondStatus.active(n - 100, n + 100, n + 200)
      ).to.revertedWith("!pending");
    });
  });
});
