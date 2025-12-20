// src/components/Auth/ConnectWalletPage.js
import React, { useContext } from "react";
import { AuthContext } from "./Web3AuthContext";
import "../../App.css";
import "./ConnectWalletPage.css";

const ConnectWalletPage = () => {
    const { connectWallet, loading, error } = useContext(AuthContext);

    const handleConnect = () => {
        connectWallet();
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo">
                            <div className="logo-icon">SC</div>
                            <h1>ShopCAP</h1>
                        </div>
                        <p className="auth-subtitle">
                            Connect your Web3 wallet to access the platform.
                        </p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        onClick={handleConnect}
                        className="auth-button large"
                        disabled={loading}
                    >
                        {loading ? "Connecting..." : "Connect your wallet"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectWalletPage;
