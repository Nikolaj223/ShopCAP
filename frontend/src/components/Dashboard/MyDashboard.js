import React, { useState, useEffect, useCallback } from "react";
import {
    getShopCAPTokenContract,
    getShopCAPPlatformContract,
    getTokenBalance,
    mintTokens,
    addPartner,
} from "../../services/contractServices";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import "./MyDashboard.css";

function MyDashboard() {
    const {
        account,
        provider,
        signer,
        network,
        loading,
        error,
        connectWallet,
    } = useWeb3Auth();

    const [scapBalance, setScapBalance] = useState("0");
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);
    const [dashboardSuccessMessage, setDashboardSuccessMessage] =
        useState(null);
    const [partnerName, setPartnerName] = useState("");
    const [partnerDescription, setPartnerDescription] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [partnerOwnerAddress, setPartnerOwnerAddress] = useState("");
    const [isRegisteringPartner, setIsRegisteringPartner] = useState(false);
    const [partnerRegistrationMessage, setPartnerRegistrationMessage] =
        useState("");

    const fetchScapBalance = useCallback(async () => {
        setDashboardError(null);
        setDashboardSuccessMessage(null);

        if (account && (provider || signer)) {
            setIsLoadingDashboard(true);
            try {
                const tokenContract = await getShopCAPTokenContract(
                    provider || signer
                );
                if (tokenContract) {
                    const balance = await getTokenBalance(
                        tokenContract,
                        account
                    );
                    setScapBalance(balance);
                } else {
                    console.warn("SCAP Token contract not initialized.");
                    setScapBalance("0");
                }
            } catch (err) {
                console.error("Error fetching SCAP balance:", err);
                setDashboardError(
                    `Failed to fetch SCAP balance: ${
                        err.message || err.toString()
                    }`
                );
                setScapBalance("0");
            } finally {
                setIsLoadingDashboard(false);
            }
        } else {
            setScapBalance("0");
        }
    }, [account, provider, signer]);

    useEffect(() => {
        fetchScapBalance();
    }, [fetchScapBalance]);

    const handleRegisterPartner = async (e) => {
        e.preventDefault();

        if (!signer) {
            setPartnerRegistrationMessage("Wallet not connected...");
            return;
        }

        setIsRegisteringPartner(true);
        setPartnerRegistrationMessage("");

        try {
            const transaction = await addPartner(
                signer,
                partnerName,
                partnerDescription,
                referralLink,
                partnerOwnerAddress
            );
            setPartnerRegistrationMessage(
                `Partner "${partnerName}" successfully registered! Hash: ${transaction.hash}`
            );
            setPartnerName("");
            setPartnerDescription("");
            setReferralLink("");
            setPartnerOwnerAddress("");
        } catch (err) {
            console.error("Error registering partner:", err);
            setPartnerRegistrationMessage(
                `Registration error: ${
                    err.reason || err.message || "Unknown error"
                }`
            );
        } finally {
            setIsRegisteringPartner(false);
        }
    };
    const handleMintTokens = async () => {
        if (!signer) {
            setDashboardError("Wallet not connected...");
            return;
        }

        setIsLoadingDashboard(true);
        setDashboardError(null);
        setDashboardSuccessMessage(null);

        try {
            const amountToMint = "100";
            const transaction = await mintTokens(signer, account, amountToMint);

            setDashboardSuccessMessage(
                `${amountToMint} SCAP successfully minted to your account! Transaction hash: ${transaction.hash}`
            );
            await fetchScapBalance();
        } catch (err) {
            console.error("Error minting SCAP:", err);

            const errorMessage = err.reason || err.message || "Unknown error";
            setDashboardError(`Minting error: ${errorMessage}`);
        } finally {
            setIsLoadingDashboard(false);
        }
    };
    if (loading) {
        return <div className="dashboard-loading">Connecting to wallet...</div>;
    }
    if (error) {
        return (
            <div className="dashboard-error dashboard-card">
                <h2>Web3 Error:</h2>
                <p>{error}</p>
                <button onClick={connectWallet} className="connect-button">
                    Try to reconnect
                </button>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="dashboard-not-connected dashboard-card">
                <p>To access the dashboard, you need to connect your wallet.</p>
                <button onClick={connectWallet} className="connect-button">
                    Connect Wallet
                </button>
            </div>
        );
    }
    return (
        <div className="my-dashboard">
            <h2 className="dashboard-title">My Dashboard</h2>

            <div className="info-card">
                <p>
                    Connected Account: <strong>{account}</strong>
                </p>
                <p>
                    Network:{" "}
                    <strong>
                        {network
                            ? `${network.name} (ID: ${network.chainId})`
                            : "Unknown"}
                    </strong>
                </p>
                <p>
                    SCAP Balance:{" "}
                    <strong>
                        {isLoadingDashboard ? "Loading..." : scapBalance}
                    </strong>
                </p>
            </div>

            {/* Error and success messages */}
            {dashboardError && (
                <div className="message-box error-message">
                    {dashboardError}
                </div>
            )}
            {dashboardSuccessMessage && (
                <div className="message-box success-message">
                    {dashboardSuccessMessage}
                </div>
            )}

            {/* A button for minting tokens */}
            <button
                onClick={handleMintTokens}
                disabled={isLoadingDashboard || !signer}
                className="mint-button"
            >
                {isLoadingDashboard ? "Minting..." : "Mint 100 SCAP (for test)"}
            </button>

            {/* Partner registration Form */}
            <h3 className="section-title">Register a New Partner</h3>
            <form
                onSubmit={handleRegisterPartner}
                className="registration-form"
            >
                <div className="form-group">
                    <label htmlFor="partnerName">Partner Name:</label>
                    <input
                        id="partnerName"
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        required
                        disabled={isRegisteringPartner || !signer}
                        className="form-input"
                        placeholder="Enter partner's name"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="partnerDescription">Description:</label>
                    <textarea
                        id="partnerDescription"
                        value={partnerDescription}
                        onChange={(e) => setPartnerDescription(e.target.value)}
                        required
                        disabled={isRegisteringPartner || !signer}
                        className="form-textarea"
                        placeholder="Enter partner's description"
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="referralLink">Referral Link:</label>
                    <input
                        id="referralLink"
                        type="url"
                        value={referralLink}
                        onChange={(e) => setReferralLink(e.target.value)}
                        required
                        disabled={isRegisteringPartner || !signer}
                        className="form-input"
                        placeholder="e.g., https://example.com/referral"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="partnerOwnerAddress">
                        Partner Owner's Address:
                    </label>
                    <input
                        id="partnerOwnerAddress"
                        type="text"
                        value={partnerOwnerAddress}
                        onChange={(e) => setPartnerOwnerAddress(e.target.value)}
                        required
                        disabled={isRegisteringPartner || !signer}
                        className="form-input"
                        placeholder={account || "Enter address or use your own"}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isRegisteringPartner || !signer}
                    className="submit-button"
                >
                    {isRegisteringPartner
                        ? "Registering..."
                        : "Register Partner"}
                </button>
            </form>
            {partnerRegistrationMessage && (
                <div
                    className={
                        partnerRegistrationMessage.includes("Error")
                            ? "message-box error-message"
                            : "message-box success-message"
                    }
                >
                    {partnerRegistrationMessage}
                </div>
            )}
        </div>
    );
}

export default MyDashboard;
