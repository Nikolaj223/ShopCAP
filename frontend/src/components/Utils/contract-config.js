// src/utils/contract-config.js
import ShopCAPTokenABI from "../../contracts/abi/ShopCAPToken.json";
import PartnerRegistryABI from "../../contracts/abi/PartnerRegistry.json";
import CashbackManagerABI from "../../contracts/abi/CashbackManager.json";
import ShopCAPPlatformABI from "../../contracts/abi/ShopCAPPlatform.json";
export const contractAddresses = {
    // Chain ID Sepolia
    11155111: {
        shopCAPToken: "0x7269828f0337fB9C385Df80F9D4F9b53C3571D8F",
        partnerRegistry: "0x5E148A6a1B7A6DCE6a4c8bFF4044A3d99E23b899",
        cashbackManager: "0x603Ab4020eF47a48966736dcBBCef15212602085",
        shopCAPPlatform: "0xB255fb6B1D48Cbf550a35737977FaD3c4ce7870e",
    },
};

export const contractABIs = {
    ShopCAPToken: ShopCAPTokenABI.abi,
    PartnerRegistry: PartnerRegistryABI.abi,
    CashbackManager: CashbackManagerABI.abi,
    ShopCAPPlatform: ShopCAPPlatformABI.abi,
};

export const EXPECTED_CHAIN_ID = 11155111; // Sepolia Testnet
export const EXPECTED_CHAIN_NAME = "Sepolia";
