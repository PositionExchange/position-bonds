import { expect } from "chai";
import { ethers } from "hardhat";
import { MockToken, TestUnderlyingContract } from "../../typechain";
import { deployMockToken } from "../utils/mock";
import { deployContract, now } from "../utils/utils";

export const ensureTransferUnderlyingAsset = async (
  underlyingAsset: any,
  mockUnderlyingAsset: any,
  collateralAmount: any
) => {
  expect(await mockUnderlyingAsset.balanceOf(underlyingAsset.address)).to.equal(
    0
  );
  underlyingAsset.transferUnderlyingAsset();
  expect(await mockUnderlyingAsset.balanceOf(underlyingAsset.address)).to.equal(
    collateralAmount
  );
};

describe("UnderlyingAsset", function () {
  let underlyingAsset: TestUnderlyingContract;
  let mockUnderlyingAsset: MockToken;
  let collateralAmount = ethers.utils.parseEther("100");
  beforeEach(async () => {
    mockUnderlyingAsset = await deployMockToken("MockERC20");
    underlyingAsset = await deployContract<TestUnderlyingContract>(
      "TestUnderlyingContract",
      mockUnderlyingAsset.address,
      collateralAmount
    );
    //approve
    await mockUnderlyingAsset.approve(
      underlyingAsset.address,
      ethers.constants.MaxUint256
    );
  });
  it("should transfer underlyingAsset successfully", async () => {
    await ensureTransferUnderlyingAsset(
      underlyingAsset,
      mockUnderlyingAsset,
      collateralAmount
    );
  });
});
