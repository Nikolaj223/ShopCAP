// src/App.js
import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Импортируем Routes и Route
import { AuthProvider, AuthContext } from "./components/Auth/Web3AuthContext"; // Используем новый Web3AuthContext
import ConnectWalletPage from "./components/Auth/ConnectWalletPage"; // Используем новую страницу
import Dashboard from "./components/Dashboard/Dashboard"; // Предполагается, что вы создали этот файл
import "./App.css";

// Keyframes для спиннера, если он не в App.css
// Можно добавить их прямо в App.css или сюда в виде стилей
const spinKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function AppContent() {
    const { account, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                }}
            >
                {/* Добавляем стили для keyframes, если они не глобальны */}
                <style>{spinKeyframes}</style>
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: "3rem",
                            height: "3rem",
                            border: "3px solid transparent",
                            borderTop: "3px solid #3b82f6",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 1rem",
                        }}
                    ></div>
                    <p>Загрузка данных кошелька...</p>
                </div>
            </div>
        );
    }

    // Если account есть, значит пользователь подключен, показываем Dashboard
    // Иначе показываем страницу подключения кошелька
    return account ? <Dashboard /> : <ConnectWalletPage />;
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;
