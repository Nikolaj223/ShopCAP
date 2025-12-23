import { ethers } from "ethers";
import {
    contractAddresses,
    contractABIs,
} from "../components/Utils/contract-config";

async function getChainIdFromProviderOrSigner(providerOrSigner) {
    if (!providerOrSigner) return null;
    try {
        let network;
        if (providerOrSigner.provider) {
            network = await providerOrSigner.provider.getNetwork();
        } else {
            network = await providerOrSigner.getNetwork();
        }
        return network.chainId;
    } catch (error) {
        console.error("Error retrieving chainId:", error);
        return null;
    }
}

const getContractAddressesForChain = (chainId) => {
    if (!chainId) return null;
    const addresses = contractAddresses[chainId];
    if (!addresses) {
        console.warn(`Contracts not found for chain ${chainId}`);
        return null;
    }
    return addresses;
};

export const getShopCAPTokenContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses?.shopCAPToken) return null;
    return new ethers.Contract(
        addresses.shopCAPToken,
        contractABIs.ShopCAPToken,
        providerOrSigner
    );
};

export const getPartnerRegistryContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses?.partnerRegistry) return null;
    return new ethers.Contract(
        addresses.partnerRegistry,
        contractABIs.PartnerRegistry,
        providerOrSigner
    );
};

export const getPlatformContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses?.shopCAPPlatform) return null;
    return new ethers.Contract(
        addresses.shopCAPPlatform,
        contractABIs.ShopCAPPlatform,
        providerOrSigner
    );
};

// --- Interaction functions ---

export const addPartner = async (
    signer,
    partnerName,
    description,
    referralLink,
    ownerAddress
) => {
    const registry = await getPartnerRegistryContract(signer);
    if (!registry) throw new Error("Registry contract not found");

    const tx = await registry.addPartner(
        partnerName,
        description,
        referralLink,
        ownerAddress
    );
    await tx.wait();
    return tx;
};

export const mintTokens = async (signer, recipientAddress, amount) => {
    const tokenContract = await getShopCAPTokenContract(signer);
    if (!tokenContract) throw new Error("Token contract not found");

    const decimals = await tokenContract.decimals();
    const tx = await tokenContract.mint(
        recipientAddress,
        ethers.parseUnits(amount.toString(), decimals)
    );
    return await tx.wait();
};

export const getShopCAPBalance = async (provider, accountAddress) => {
    const tokenContract = await getShopCAPTokenContract(provider);
    if (!tokenContract) return "0";
    const balance = await tokenContract.balanceOf(accountAddress);
    const decimals = await tokenContract.decimals();
    return ethers.formatUnits(balance, decimals);
};

export const getAllPartners = async (registryContract) => {
    if (!registryContract) {
        console.error("Registry contract instance is missing");
        return [];
    }

    const partners = [];
    let id = 1;
    let keepGoing = true;

    const MAX_PARTNERS_LIMIT = 500;

    while (keepGoing && id <= MAX_PARTNERS_LIMIT) {
        try {
            // Trying to get partner data by ID through a public mapping
            // In ethers v6, mapping is called as a function
            const p = await registryContract.partners(id);

            // If the id in the structure is 0, then we have reached an empty space in the mapping
            if (!p || p.id.toString() === "0") {
                keepGoing = false;
            } else {
                partners.push({
                    id: p.id.toString(),
                    isActive: p.isActive,
                    name: p.name,
                    description: p.description,
                    referralLink: p.referralLink,
                    partnerWallet: p.partnerWallet,
                });
                id++;
            }
        } catch (error) {
            // If the contract throws an error (for example, require in getPartnerDetails),
            // then there are no more partners
            keepGoing = false;
        }
    }

    return partners;
};

/**
 * NEW: Getting a referrer ID for a user (Personal account)
 */
export const getUserReferrerId = async (provider, userAddress) => {
    const platform = await getPlatformContract(provider);
    if (!platform) return "0";
    try {
        // getUserReferrerInfo(address _user)
        const refId = await platform.getUserReferrerInfo(userAddress);
        return refId.toString();
    } catch (e) {
        return "0";
    }
};

/**
 * 70/20/10 distribution math (for Dashboard)
 */
export const calculateVisualDistribution = (amount) => {
    const val = parseFloat(amount || 0);
    return {
        user: (val * 0.7).toFixed(2),
        reserve: (val * 0.2).toFixed(2),
        burn: (val * 0.1).toFixed(2),
    };
};
export const getCashbackManagerContract = async (providerOrSigner) => {
    // CashbackManager
    const address = "0x603Ab4020eF47a48966736dcBBCef15212602085";

    // ABI должен включать все функции и переменные, к которым вы обращаетесь в MyDashboard.js
    const abi = [
        // public
        "function cashbackBasePercent() view returns (uint256)",
        "function userCashbackShare() view returns (uint256)",
        "function reserveShare() view returns (uint256)",
        "function burnShare() view returns (uint256)",
        "function referrerBonusPercent() view returns (uint256)",
        "function userReferrerPartnerId(address) view returns (uint256)",

        // Management functions
        "function registerUser(address user, uint256 referrerId) external",
        "function setCashbackParams(uint256, uint256, uint256, uint256) external",
        "function setReferrerBonusPercent(uint256) external",

        // View
        "function getReferrerInfo(address user) view returns (uint256)",
        "function getShopCapTokenBalance() view returns (uint256)",
    ];

    return new ethers.Contract(address, abi, providerOrSigner);
};
