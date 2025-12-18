// src/services/contractServices.js
import { ethers } from "ethers";
import {
    contractAddresses,
    contractABIs,
} from "../components/Utils/contract-config";

const PARTNER_REGISTRY_ADDRESS = "0x5E148A6a1B7A6DCE6a4c8bFF4044A3d99E23b899";
async function getChainIdFromProviderOrSigner(providerOrSigner) {
    if (!providerOrSigner) {
        console.error("Provider or Signer is not provided to obtain chainId.");
        return null;
    }

    try {
        let network;
        if (typeof providerOrSigner.provider !== "undefined") {
            network = await providerOrSigner.provider.getNetwork();
        } else if (typeof providerOrSigner.getNetwork === "function") {
            network = await providerOrSigner.getNetwork();
        } else {
            console.error(
                "Unable to determine the providerOrSigner type to obtain the chainId."
            );
            return null;
        }
        return network.chainId;
    } catch (error) {
        console.error("Error retrieving chainId from providerOrSigner:", error);
        return null;
    }
}
const partnerRegistryAbi = [
    "function addPartner(string memory _name, string memory _description, string memory _referralLink, address _partnerWallet) external returns (uint256)",
];
const formatChainIdToHex = (chainId) => {
    if (typeof chainId === "bigint") {
        return `0x${chainId.toString(16)}`;
    }
    if (typeof chainId === "number") {
        return `0x${chainId.toString(16)}`;
    }
    return String(chainId).toLowerCase();
};

const getContractAddressesForChain = (chainId) => {
    if (!chainId) {
        console.error("Chain ID is not provided to obtain contract addresses.");
        return null;
    }
    // const hexChainId = formatChainIdToHex(chainId);
    // const addresses = contractAddresses[hexChainId];
    const addresses = contractAddresses[chainId];

    if (!addresses) {
        console.warn(
            `Contracts are not deployed on the network with ID ${chainId}. Check contract-config.js`
        );
        return null;
    }
    return addresses;
};

/**
 * Gets an instance of the ShopCAPToken contract.
 * @param {ethers.Provider | ethers.Signer} providerOrSigner - An ethers. Provider or Signer object.
 * @returns {Promise<ethers.Contract | null>} An instance of the ShopCAPToken contract or null.
 */
export const getShopCAPTokenContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    if (!chainId) return null;

    const addresses = getContractAddressesForChain(chainId);
    if (!addresses || !addresses.shopCAPToken) {
        console.error(
            `ShopCAPToken address not found for network with chainId ${chainId}.`
        );
        return null;
    }
    try {
        return new ethers.Contract(
            addresses.shopCAPToken,
            contractABIs.ShopCAPToken,
            providerOrSigner
        );
    } catch (error) {
        console.error("Error creating the ShopCAPToken contract:", error);
        return null;
    }
};

/**
 * Gets an instance of the PartnerRegistry contract.
 * @param {ethers.Provider | ethers.Signer} providerOrSigner - Provider or Signer object ethers.
 * @returns {Promise<ethers.Contract | null>} An instance of the PartnerRegistry contract or null.
 */
export const getPartnerRegistryContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    if (!chainId) return null;

    const addresses = getContractAddressesForChain(chainId);
    if (!addresses || !addresses.partnerRegistry) {
        console.error(
            `The PartnerRegistry address was not found for the network with chainId ${chainId}.`
        );
        return null;
    }
    try {
        return new ethers.Contract(
            addresses.partnerRegistry,
            contractABIs.PartnerRegistry,
            providerOrSigner
        );
    } catch (error) {
        console.error("Error in creating the PartnerRegistry contract:", error);
        return null;
    }
};

/**
 * Gets an instance of the CashbackManager contract.
 * @param {ethers.Provider | ethers.Signer} providerOrSigner - An ethers. Provider or Signer object.
 * @returns {Promise<ethers.Contract | null>} An instance of the CashbackManager contract or null.
 */
export const getCashbackManagerContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    if (!chainId) return null;

    const addresses = getContractAddressesForChain(chainId);
    if (!addresses || !addresses.cashbackManager) {
        console.error(
            `CashbackManager address not found for network with chainId ${chainId}.`
        );
        return null;
    }
    try {
        return new ethers.Contract(
            addresses.cashbackManager,
            contractABIs.CashbackManager,
            providerOrSigner
        );
    } catch (error) {
        console.error("CashbackManager Contract creation error:", error);
        return null;
    }
};

/**
 * Gets an instance of the ShopCAPPlatform contract.
 * @param {ethers.Provider | ethers.Signer} providerOrSigner - An ethers. Provider or Signer object.
 * @returns {Promise<ethers.Contract | null>} An instance of the ShopCAPPlatform contract or null.
 */
export const getShopCAPPlatformContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    if (!chainId) return null;

    const addresses = getContractAddressesForChain(chainId);
    if (!addresses || !addresses.shopCAPPlatform) {
        console.error(
            `The ShopCAPPlatform address was not found for the network with chainId ${chainId}.`
        );
        return null;
    }
    try {
        return new ethers.Contract(
            addresses.shopCAPPlatform,
            contractABIs.ShopCAPPlatform,
            providerOrSigner
        );
    } catch (error) {
        console.error("ShopCAPPlatform contract creation error:", error);
        return null;
    }
};

/**
 * Gets the token balance for a given address.
 * @param {ethers.Contract} tokenContract - Token contract instance (ShopCAPToken).
 * @param {string} userAddress - User address.
 * @returns {Promise<string>} Token balance in an easy-to-read format.
 */
export const getTokenBalance = async (tokenContract, userAddress) => {
    if (!tokenContract) {
        console.error(
            "getTokenBalance: The token contract has not been provided."
        );
        return "0";
    }
    if (!userAddress) {
        console.error("getTokenBalance: The user's address is not provided.");
        return "0";
    }
    try {
        const balanceBigNumber = await tokenContract.balanceOf(userAddress);
        const decimals = await tokenContract.decimals();
        return ethers.formatUnits(balanceBigNumber, decimals);
    } catch (error) {
        console.error(
            `Error when getting the balance for ${userAddress}:`,
            error
        );
        return "0";
    }
};
export const transferTokens = async (tokenContract, toAddress, amount) => {
    if (!tokenContract) {
        throw new Error(
            "transferTokens: The ShopCAPToken contract is unavailable."
        );
    }
    if (!tokenContract.runner || !tokenContract.runner.provider) {
        throw new Error(
            "transferTokens:The ShopCAPToken contract must be initialized with a Signer to execute a transaction."
        );
    }

    try {
        const decimals = await tokenContract.decimals();
        const amountWei = ethers.parseUnits(amount, decimals);
        const tx = await tokenContract.transfer(toAddress, amountWei);
        await tx.wait();
        console.log(
            `Tokens have been successfully transferred. Transaction hash: ${tx.hash}`
        );
        return tx;
    } catch (error) {
        console.error(
            `Error when translating tokens ${amount} to ${toAddress}:`,
            error
        );
        throw error;
    }
};
export const addPartner = async (
    signer,
    partnerName,
    description,
    referralLink,
    ownerAddress
) => {
    if (!signer) {
        throw new Error("addPartner: Signer not provided.");
    }

    try {
        const registryContract = new ethers.Contract(
            PARTNER_REGISTRY_ADDRESS,
            partnerRegistryAbi,
            signer
        );

        console.log("Calling PartnerRegistry.addPartner directly...");

        const tx = await registryContract.addPartner(
            partnerName,
            description,
            referralLink,
            ownerAddress
        );

        console.log("The transaction has been sent to the registry...");
        await tx.wait();

        console.log(
            `The partner "${partnerName}" is registered directly in the registry.`
        );
        return tx;
    } catch (error) {
        console.error(
            `Error in direct-addPartner for "${partnerName}":`,
            error
        );
        throw error;
    }
};

export const getPartnerDetails = async (platformContract, partnerId) => {
    if (!platformContract) {
        throw new Error(
            "getPartnerDetails: The ShopCAPPlatform contract is not available."
        );
    }
    try {
        const partner = await platformContract.getPartner(partnerId);
        return {
            id: partner.id.toString(),
            name: partner.name,
            description: partner.description,
            referralLink: partner.referralLink,
            owner: partner.owner,
            isActive: partner.isActive,
        };
    } catch (error) {
        console.error(
            `Error while retrieving partner details with ID ${partnerId}:`,
            error
        );
        throw error;
    }
};
export const getTotalPartners = async (platformContract) => {
    if (!platformContract) {
        throw new Error(
            "getTotalPartners: The ShopCAPPlatform contract is unavailable."
        );
    }
    try {
        const count = await platformContract.totalPartners();
        return Number(count);
    } catch (error) {
        console.error(
            "Error when getting the total number of partners:",
            error
        );
        throw error;
    }
};

export const mintTokens = async (signer, recipientAddress, amount) => {
    if (!signer) {
        throw new Error(
            "mintTokens: Signer is not provided. Wallet connection is required."
        );
    }

    try {
        const tokenContract = await getShopCAPTokenContract(signer);

        if (!tokenContract) {
            throw new Error("Couldn't get a ShopCAPToken instance.");
        }
        const tokenDecimals = await tokenContract.decimals();
        const amountToMint = ethers.parseUnits(
            amount.toString(),
            tokenDecimals
        );
        const tx = await tokenContract.mint(recipientAddress, amountToMint);
        console.log("The transaction has been sent, awaiting confirmation...");
        const receipt = await tx.wait();

        console.log(
            `Successfully mined ${amount} SCAP for ${recipientAddress}. Hash: ${tx.hash}`
        );

        return receipt;
    } catch (error) {
        console.error(
            `Error when minting tokens for ${recipientAddress}:`,
            error
        );
        throw error;
    }
};

export const getShopCAPBalance = async (provider, accountAddress) => {
    if (!provider) {
        throw new Error("getShopCAPBalance: The provider is not provided.");
    }
    if (!accountAddress) {
        throw new Error(
            "getShopCAPBalance: The account address is not provided."
        );
    }

    try {
        const tokenContract = await getShopCAPTokenContract(provider);

        if (!tokenContract) {
            throw new Error("Failed to retrieve a ShopCAPToken instance.");
        }

        const balanceBigInt = await tokenContract.balanceOf(accountAddress);
        const tokenDecimals = await tokenContract.decimals();

        return ethers.formatUnits(balanceBigInt, tokenDecimals);
    } catch (error) {
        console.error(
            `Error when requesting a SCAP balance for ${accountAddress}:`,
            error
        );
        throw error;
    }
};
