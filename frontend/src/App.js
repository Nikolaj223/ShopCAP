// src/App.js
import "./App.css";
import MyDashboard from "./components/Dashboard/MyDashboard";
import { AuthProvider } from "./components/Auth/Web3AuthContext";

function App() {
    return (
        <div className="App">
            {}
            <AuthProvider>
                <MyDashboard />
            </AuthProvider>
        </div>
    );
}

export default App;
