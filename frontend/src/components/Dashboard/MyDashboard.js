import React, { useState, useEffect, useCallback } from "react";
import {
    getPartnerRegistryContract,
    getShopCAPBalance,
    mintTokens,
    addPartner,
    getCashbackManagerContract,
    getAllPartners,
} from "../../services/contractServices";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import "./MyDashboard.css";

function MyDashboard() {
    const { account, provider, signer, loading: authLoading } = useWeb3Auth();

    // --- Token states and general statuses ---
    const [scapBalance, setScapBalance] = useState("0");
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);
    const [dashboardSuccessMessage, setDashboardSuccessMessage] =
        useState(null);

    // --- States for partner registration ---
    const [partnerName, setPartnerName] = useState("");
    const [partnerDescription, setPartnerDescription] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [partnerOwnerAddress, setPartnerOwnerAddress] = useState("");
    const [isRegisteringPartner, setIsRegisteringPartner] = useState(false);

    // --- States for simulation of purchases and Money Flow ---
    const [selectedPartnerId, setSelectedPartnerId] = useState("");
    const [purchaseAmount, setPurchaseAmount] = useState(1000);
    const [simulationResult, setSimulationResult] = useState(null);
    const [userReferrerId, setUserReferrerId] = useState(0);

    // Distribution parameters (from CashbackManager)
    const [contractConfig, setContractConfig] = useState({
        basePercent: 1,
        userShare: 70,
        reserveShare: 20,
        burnShare: 10,
        referrerBonus: 0,
    });

    // --- Status of the list of all partners ---
    const [allPartners, setAllPartners] = useState([]);

    /**
     * Loading the SCAP balance
     */
    const fetchScapBalance = useCallback(async () => {
        if (account && provider) {
            try {
                const balance = await getShopCAPBalance(provider, account);
                setScapBalance(balance);
            } catch (err) {
                console.error("Error fetching SCAP balance:", err);
            }
        }
    }, [account, provider]);

    const fetchData = useCallback(async () => {
        if (!provider) return;
        try {
            const registryContract = await getPartnerRegistryContract(provider);
            const list = await getAllPartners(registryContract);
            setAllPartners(list);
            const manager = await getCashbackManagerContract(provider);
            const [base, uShare, rShare, bShare, refBonus] = await Promise.all([
                manager.cashbackBasePercent(),
                manager.userCashbackShare(),
                manager.reserveShare(),
                manager.burnShare(),
                manager.referrerBonusPercent(),
            ]);

            setContractConfig({
                basePercent: Number(base),
                userShare: Number(uShare),
                reserveShare: Number(rShare),
                burnShare: Number(bShare),
                referrerBonus: Number(refBonus),
            });

            if (account) {
                const refId = await manager.getReferrerInfo(account);
                setUserReferrerId(Number(refId));
            }
        } catch (err) {
            console.error("Error fetching data from contracts:", err);
        }
    }, [account, provider]);

    useEffect(() => {
        if (provider) {
            fetchScapBalance();
            fetchData();
        }
    }, [account, provider, fetchScapBalance, fetchData]);

    const handleMintTokens = async () => {
        if (!signer) return;
        setIsLoadingDashboard(true);
        setDashboardError(null);
        try {
            await mintTokens(signer, account, "100");
            setDashboardSuccessMessage("100 SCAP minted successfully!");
            await fetchScapBalance();
        } catch (err) {
            setDashboardError(`Minting error: ${err.reason || err.message}`);
        } finally {
            setIsLoadingDashboard(false);
        }
    };
    const handleRegisterPartner = async (e) => {
        e.preventDefault();
        if (!signer) return;
        setIsRegisteringPartner(true);
        try {
            const tx = await addPartner(
                signer,
                partnerName,
                partnerDescription,
                referralLink,
                partnerOwnerAddress
            );
            await tx.wait();
            setPartnerName("");
            setPartnerDescription("");
            setReferralLink("");
            setPartnerOwnerAddress("");
            await fetchData();
            alert("Partner registered successfully!");
        } catch (err) {
            alert(`Error: ${err.reason || err.message}`);
        } finally {
            setIsRegisteringPartner(false);
        }
    };

    const runPurchaseSimulation = () => {
        if (!selectedPartnerId) return alert("Select a partner");

        // CashbackManager.issueCashbackAndDistribute()
        const totalCashback =
            (purchaseAmount * contractConfig.basePercent) / 100;

        let userAmount = (totalCashback * contractConfig.userShare) / 100;
        const reserveAmount =
            (totalCashback * contractConfig.reserveShare) / 100;
        const burnAmount = (totalCashback * contractConfig.burnShare) / 100;

        let referrerAmount = 0;
        if (contractConfig.referrerBonus > 0 && userReferrerId !== 0) {
            referrerAmount = (userAmount * contractConfig.referrerBonus) / 100;
            userAmount = userAmount - referrerAmount;
        }

        setSimulationResult({
            total: totalCashback,
            user: userAmount,
            reserve: reserveAmount,
            burn: burnAmount,
            referrer: referrerAmount,
            refId: userReferrerId,
        });
    };

    if (authLoading) return <div className="loading">Loading wallet...</div>;

    return (
        <div className="dashboard-container">
            <h1>Platform Ecosystem Dashboard</h1>

            {/* Balance block */}
            <div className="scap-section card">
                <h3>My SCAP Assets</h3>
                <p className="balance-display">{scapBalance} SCAP</p>
                <button
                    onClick={handleMintTokens}
                    disabled={isLoadingDashboard}
                    className="mint-button"
                >
                    {isLoadingDashboard ? "Minting..." : "Mint Test 100 SCAP"}
                </button>
                {dashboardError && (
                    <p className="error-text">{dashboardError}</p>
                )}
                {dashboardSuccessMessage && (
                    <p className="success-text">{dashboardSuccessMessage}</p>
                )}
            </div>

            {/* NEW BLOCK: Money Flow Simulation */}
            <div className="simulation-section card">
                <h3>Purchase Simulation (Cashback Flow)</h3>
                <div className="sim-inputs">
                    <select
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        value={selectedPartnerId}
                    >
                        <option value="">Select Partner Shop...</option>
                        {allPartners
                            .filter((p) => p.isActive)
                            .map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (ID: {p.id})
                                </option>
                            ))}
                    </select>
                    <input
                        type="number"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        placeholder="Amount"
                    />
                    <button
                        onClick={runPurchaseSimulation}
                        className="calc-btn"
                    >
                        Calculate Flow
                    </button>
                </div>

                {simulationResult && (
                    <div className="flow-results">
                        <p>
                            Total Cashback Pool:{" "}
                            <strong>
                                {simulationResult.total.toFixed(2)} SCAP
                            </strong>
                        </p>
                        <div className="flow-bar">
                            <div
                                className="bar-segment user"
                                style={{
                                    width: `${contractConfig.userShare}%`,
                                }}
                            >
                                User: {simulationResult.user.toFixed(2)}
                            </div>
                            <div
                                className="bar-segment reserve"
                                style={{
                                    width: `${contractConfig.reserveShare}%`,
                                }}
                            >
                                Reserve: {simulationResult.reserve.toFixed(2)}
                            </div>
                            <div
                                className="bar-segment burn"
                                style={{
                                    width: `${contractConfig.burnShare}%`,
                                }}
                            >
                                Burn: {simulationResult.burn.toFixed(2)}
                            </div>
                        </div>
                        {simulationResult.referrer > 0 && (
                            <p className="ref-info">
                                Referrer Bonus (ID {simulationResult.refId}): +
                                {simulationResult.referrer.toFixed(2)} SCAP
                                (deducted from User share)
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Registration block */}
            <div className="registration-section card">
                <h3>Register New Business Partner</h3>
                <form onSubmit={handleRegisterPartner} className="partner-form">
                    <input
                        placeholder="Name"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        required
                    />
                    <input
                        placeholder="Description"
                        value={partnerDescription}
                        onChange={(e) => setPartnerDescription(e.target.value)}
                    />
                    <input
                        placeholder="Referral Link"
                        value={referralLink}
                        onChange={(e) => setReferralLink(e.target.value)}
                    />
                    <input
                        placeholder="Wallet Address"
                        value={partnerOwnerAddress}
                        onChange={(e) => setPartnerOwnerAddress(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={isRegisteringPartner}>
                        {isRegisteringPartner
                            ? "Processing..."
                            : "Register Partner"}
                    </button>
                </form>
            </div>

            {/* Registry block */}
            <div className="registry-section card">
                <h3>Active Partners Directory</h3>
                {allPartners.length === 0 ? (
                    <p>No partners found.</p>
                ) : (
                    <table className="partners-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Partner</th>
                                <th>Wallet</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPartners.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>
                                        <strong>{p.name}</strong>
                                        <br />
                                        <small>{p.description}</small>
                                    </td>
                                    <td className="addr">{p.partnerWallet}</td>
                                    <td>
                                        {p.isActive
                                            ? "✅ Active"
                                            : "❌ Inactive"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default MyDashboard;
