// test/PartnerRegistry.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { PartnerRegistry } from "../typechain-types/contracts/PartnerRegistry";
import { PartnerRegistry__factory } from "../typechain-types/factories/contracts/PartnerRegistry__factory";

describe("PartnerRegistry", function () {
    let partnerRegistry: PartnerRegistry;
    let owner: any;
    let addr1: any;
    let addr2: any;
    let nonOwner: any;

    // Data for creating a partner
    const partnerName = "Test Partner";
    const partnerDescription = "A partner for testing purposes";
    const referralLink = "https://testpartner.com/ref";

    beforeEach(async function () {
        [owner, addr1, addr2, nonOwner] = await ethers.getSigners();
        const PartnerRegistryFactory = (await ethers.getContractFactory(
            "PartnerRegistry",
            owner
        )) as PartnerRegistry__factory;

        partnerRegistry =
            (await PartnerRegistryFactory.deploy()) as PartnerRegistry;
        await partnerRegistry.waitForDeployment();
    });

    // Checking the owner's installation
    it("Should set the right owner upon deployment", async function () {
        expect(await partnerRegistry.owner()).to.equal(owner.address);
    });

    // Adding a new partner
    it("Should allow owner to add a new partner", async function () {
        await expect(
            partnerRegistry
                .connect(owner)
                .addPartner(
                    partnerName,
                    partnerDescription,
                    referralLink,
                    addr1.address
                )
        )
            .to.emit(partnerRegistry, "PartnerAdded")
            .withArgs(1, partnerName, addr1.address); // Expected ID 1, as this is the first added partner

        // Checking the details of the added partner
        const [isActive, name, description, link, wallet] =
            await partnerRegistry.getPartnerDetails(1);
        expect(isActive).to.be.true;
        expect(name).to.equal(partnerName);
        expect(description).to.equal(partnerDescription);
        expect(link).to.equal(referralLink);
        expect(wallet).to.equal(addr1.address);
    });

    // Updating partner information
    it("Should allow owner to update a partner's information", async function () {
        // Adding a partner first
        await partnerRegistry
            .connect(owner)
            .addPartner(
                partnerName,
                partnerDescription,
                referralLink,
                addr1.address
            );

        const updatedName = "Updated Partner Name";
        const updatedDescription = "New description";
        const updatedReferralLink = "https://newlink.com";
        const newPartnerWallet = addr2.address;

        await expect(
            partnerRegistry
                .connect(owner)
                .updatePartner(
                    1,
                    updatedName,
                    updatedDescription,
                    updatedReferralLink,
                    newPartnerWallet
                )
        )
            .to.emit(partnerRegistry, "PartnerUpdated")
            .withArgs(1, updatedName, newPartnerWallet);

        // Checking the updated details
        const [isActive, name, description, link, wallet] =
            await partnerRegistry.getPartnerDetails(1);
        expect(isActive).to.be.true; // The activity status does not change during the update
        expect(name).to.equal(updatedName);
        expect(description).to.equal(updatedDescription);
        expect(link).to.equal(updatedReferralLink);
        expect(wallet).to.equal(newPartnerWallet);
    });

    //You cannot update a partner with an invalid ID
    it("Should revert if updating non-existent partner ID", async function () {
        await expect(
            partnerRegistry
                .connect(owner)
                .updatePartner(
                    999,
                    partnerName,
                    partnerDescription,
                    referralLink,
                    addr1.address
                )
        ).to.be.revertedWith("Invalid partner ID");
    });

    //You cannot change the status of a partner with an invalid ID
    it("Should revert if toggling status for non-existent partner ID", async function () {
        await expect(
            partnerRegistry.connect(owner).togglePartnerStatus(999, false)
        ).to.be.revertedWith("Invalid partner ID");
    });

    // Getting partner details
    it("Should return correct partner details for a valid ID", async function () {
        await partnerRegistry
            .connect(owner)
            .addPartner(
                partnerName,
                partnerDescription,
                referralLink,
                addr1.address
            );

        const [isActive, name, description, link, wallet] =
            await partnerRegistry.getPartnerDetails(1);
        expect(isActive).to.be.true;
        expect(name).to.equal(partnerName);
        expect(description).to.equal(partnerDescription);
        expect(link).to.equal(referralLink);
        expect(wallet).to.equal(addr1.address);
    });

    // You cannot get details for an invalid ID
    it("Should revert if getting details for non-existent partner ID", async function () {
        await expect(partnerRegistry.getPartnerDetails(999)).to.be.revertedWith(
            "Invalid partner ID"
        );
    });

    // Receiving a partner's wallet
    it("Should return correct partner wallet for a valid ID", async function () {
        await partnerRegistry
            .connect(owner)
            .addPartner(
                partnerName,
                partnerDescription,
                referralLink,
                addr1.address
            );

        expect(await partnerRegistry.getPartnerWallet(1)).to.equal(
            addr1.address
        );
    });

    // You cannot get a wallet for an invalid ID
    it("Should revert if getting wallet for non-existent partner ID", async function () {
        await expect(partnerRegistry.getPartnerWallet(999)).to.be.revertedWith(
            "Invalid partner ID"
        );
    });
});
