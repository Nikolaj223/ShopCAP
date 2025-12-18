// src/components/Auth/Web3AuthContext.js
import React, {
    createContext,
    useState,
    useEffect,
    useCallback,
    useContext,
} from "react";
import { ethers, BrowserProvider } from "ethers";
import {
    EXPECTED_CHAIN_ID,
    EXPECTED_CHAIN_NAME,
} from "../Utils/contract-config";
import * as ContractServices from "../../services/contractServices";
export const AuthContext = createContext(null);
export const useWeb3Auth = () => {
    const context = useContext(AuthContext);
    if (context === null || context === undefined) {
        throw new Error("useWeb3Auth must be used within an AuthProvider");
    }
    return context;
};

const connectWeb3Internal = async () => {
    if (!window.ethereum) {
        throw new Error("MetaMask (or another Web3 provider) not detected.");
    }
    const ethereumProvider = new BrowserProvider(window.ethereum);
    const accounts = await ethereumProvider.send("eth_requestAccounts", []);
    if (accounts.length === 0) {
        throw new Error("MetaMask accounts are not connected.");
    }
    const currentAccount = accounts[0];
    const ethSigner = await ethereumProvider.getSigner(currentAccount);
    const currentNetwork = await ethereumProvider.getNetwork();
    if (currentNetwork.chainId.toString() !== EXPECTED_CHAIN_ID.toString()) {
        await switchNetwork(EXPECTED_CHAIN_ID);
        throw new Error(
            `Please switch to the network ${EXPECTED_CHAIN_NAME} (Chain ID: ${EXPECTED_CHAIN_ID}). You are currently on ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId}).`
        );
    }
    return {
        provider: ethereumProvider,
        signer: ethSigner,
        account: currentAccount,
        network: currentNetwork,
    };
};

const switchNetwork = async (chainId) => {
    const hexChainId = `0x${parseInt(chainId, 10).toString(16)}`;
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }],
        });
    } catch (error) {
        if (error.code === 4902) {
            console.warn(
                `The network ${EXPECTED_CHAIN_NAME} (ID: ${chainId}) is not added to MetaMask. Try adding it manually or use "wallet_addEthereumChain".`
            );
            throw new Error(
                `The network ${EXPECTED_CHAIN_NAME} was not found in your MetaMask. Please add it manually or switch to another network.`
            );
        } else {
            throw new Error(
                `Network switching error: ${error.message || error}`
            );
        }
    }
};

const subscribeToWeb3Events = (onAccountsChanged, onChainChanged) => {
    if (window.ethereum) {
        window.ethereum.on("accountsChanged", onAccountsChanged);
        window.ethereum.on("chainChanged", onChainChanged);
    }
};
const unsubscribeFromWeb3Events = (onAccountsChanged, onChainChanged) => {
    if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", onAccountsChanged);
        window.ethereum.removeListener("chainChanged", onChainChanged);
    }
};

export const AuthProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [network, setNetwork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const initWeb3 = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const {
                provider: ethProvider,
                signer: ethSigner,
                account: acc,
                network: net,
            } = await connectWeb3Internal();
            setAccount(acc);
            setProvider(ethProvider);
            setSigner(ethSigner);
            setNetwork(net);
        } catch (err) {
            console.error("Web3 Initialization error:", err);
            setError(err.message || "Couldn't connect to Web3.");
            setAccount(null);
            setProvider(null);
            setSigner(null);
            setNetwork(null);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        initWeb3();
        const handleAccountsChanged = (newAccounts) => {
            if (newAccounts.length > 0) {
                console.log(
                    "The account has been changed. New account:",
                    newAccounts[0]
                );
                initWeb3();
            } else {
                console.log("Кошелек отключен.");
                setAccount(null);
                setProvider(null);
                setSigner(null);
                setNetwork(null);
                setError("MetaMask is disabled or no accounts are selected.");
            }
        };

        const handleChainChanged = (chainIdHex) => {
            console.log("The network has been changed to:", chainIdHex);
            initWeb3();
        };
        subscribeToWeb3Events(handleAccountsChanged, handleChainChanged);
        return () => {
            unsubscribeFromWeb3Events(
                handleAccountsChanged,
                handleChainChanged
            );
        };
    }, [initWeb3]);
    const contextValue = {
        account,
        provider,
        signer,
        network,
        loading,
        error,
        connectWallet: initWeb3,
    };
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
