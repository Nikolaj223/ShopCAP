# ShopCAP — Consumer Cashback Engine on ICM

## 🚀 Project Overview

ShopCAP — Consumer Cashback Engine on ICM

Users earn tokens as cashback whenever they shop from integrated brands.

Brands pay:
 • referral commissions
 • ad placements
 • feature fees

Cashflow → routed into the token economy.

Token utility: upgrade cashback multipliers, vote on brand integrations.

ICM benefit:
Shopping becomes a revenue-generating financial marke

This repository contains the full-stack infrastructure for the ShopCAP Platform, a decentralized cashback ecosystem built on the Ethereum Smart Chain. The project integrates a React-based dashboard with a robust suite of Solidity smart contracts to automate cashback distribution, partner management, and tokenomics.

## ✨ Features

*   **Automated Cashback Distribution:**  Smart contract logic for calculating and distributing rewards in native ShopCAP tokens (ERC-20) based on verified purchases.
*   **Transparent Partner Registry:** A decentralized directory of verified partners, including descriptions, referral links, and owner addresses, managed directly on-chain.
*   **Fixed Tokenomics Logic:** Automated revenue redistribution model: 70% allocated to user cashback, 20% to the platform reserve, and 10% dedicated to a deflationary burning mechanism.
*   **Secure Architecture:** Built using OpenZeppelin’s industry-standard libraries to ensure secure token handling and access control (Ownable/ERC20).
*   **Developer-Friendly Tooling:** Fully configured Hardhat environment for rapid deployment, testing, and contract verification.
  

## 🛠️ Technologies Used

*   **Smart Contracts & Blockchain (Backend):**
    *   Solidity: Smart contract programming language for Ethereum-compatible networks.
    *   Hardhat: Professional development environment to compile, deploy, and test smart contracts.
    *   Ethers.js (v6): A complete library for interacting with the Ethereum Blockchain and its ecosystem.
    *   OpenZeppelin Contracts: Secure, community-vetted smart contract templates for ERC-20 and Access Control.
    *   TypeScript: Used for writing robust deployment scripts and contract tests.
*   **Frontend Interface:**
    *   React (v19): For building a dynamic and responsive administrative and user dashboard.
    *   React Router (v7): Handling navigation and routing within the application.
    *   Ethers.js: Integrated on the frontend for browser-to-blockchain communication via MetaMask
    *   CSS Variables & Glassmorphism: Custom UI styling using modern CSS techniques for a high-end, aesthetic look without heavy UI libraries.

## 📂 Project Structure

```
.
ShopCAP-project/          
├── contracts/               
│   ├── ShopCAPToken.sol 
│   ├── PartnerRegistry.sol     
│   ├── CashbackManager.sol
    ├── ShopCAPPlatform.sol
│   └── 
│
├── scripts/                 
│   ├── deploy.js            
│  
├── test/                    
├── frontend/                
│   ├── public/              
│   │   └── index.html
│   ├── src/
│   │   ├── components/      
│   │   │   ├── Auth/
│   │   │   ├── Dashboard
│   │   │   ├── Utils/
│          
│   │   ├── services/       
│   │   │   ├── web3Service.js  
│   │   │   └── apiService.js    
│   │   ├── contracts/abi/      
│   │   │   ├──  ShopCAPToken.json 
│   │   │   ├── PartnerRegistry.json
│   │   │   ├── CashbackManager.json
│   │   │   └──  ShopCAPPlatform.json
│   │   │
│   │   ├── App.js           
│   │   ├── index.js        
│   │   ├──
│   │   └──
│   │
│   ├── 
│   ├── package.json         
│   └── ... (other React configuration files)
│
├── hardhat.config.js        
├── package.json             
├── .env                    
├── README.md                
└── ... 

```

### **Root Directory (Blockchain & Config)**
*   `contracts/`: Contains the Solidity smart contracts that power the decentralized logic.
    *   `ShopCAPToken.sol`: The core ERC-20 token implementation for the platform rewards.
    *   `PartnerRegistry.sol`: Management of authorized partners and their metadata.
    *   `CashbackManager.sol`: Logic for processing purchases and calculating cashback distributions.
    *   `ShopCAPPlatform.sol`: The master contract acting as the central entry point and coordinator.
*   `scripts/`: Deployment and automation scripts.
    *   `deploy.js`: Handles the orchestrated deployment of all contracts to the blockchain.
*   `test/`: Suite of unit tests to ensure the security and reliability of the smart contracts.
*   `hardhat.config.js`: Configuration for the Hardhat development environment, including network settings and compiler versions.
*   `package.json`: Dependencies for the blockchain development environment (Hardhat, Ethers, OpenZeppelin).
*   `.env`: Environment variables for sensitive data like Private Keys and RPC URLs.

  
  ### **Frontend Directory (`/frontend/`)**
The user interface is a React-based SPA (Single Page Application) that interacts directly with the blockchain.
*   `public/`: Static assets such as the `index.html` entry point and manifest files.
*   `src/components/`: Modular and reusable UI elements:
    *   `Auth/`: Components for MetaMask connection and wallet authentication.
    *   `Dashboard/`: The main user and partner interface for tracking balance and activities.
    *   `Utils/`: Helper UI components like loaders, notifications, and modals.
*   `src/services/`: Core logic for external interactions:
    *   `web3Service.js`: Integration with `ethers.js` to communicate with the deployed smart contracts.
    *   `apiService.js`: Logic for handling any external API calls or off-chain data.
*   `src/contracts/abi/`: Contains the generated JSON ABIs. These files are essential for the frontend to understand and call the smart contract functions.
*   `src/App.js`: The main application component that handles routing and global state management.
*   `src/index.js`: The entry point for the React application that renders the DOM.
*   `package.json`: Frontend-specific dependencies (React, React-Router-DOM, Ethers.js).

## ⚙️ Installation and Local Development

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or Yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ShopCAP.git
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Start the development server:**
    ```bash
    npm start
    # or
    yarn start
    ```

## 📦 Building for Production

To build the application for production, run:

```bash
npm run build
# or
yarn build
```
This command bundles the React application into static files in the `dist/` directory, ready for deployment.

## 🚀 Deployment

This project is configured for easy deployment with platforms like Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/examples/tree/main/framework-boilerplates/vite-react&template=vite-react)

_Live Example: https://shop-aq55co3d8-nikolaj223s-projects.vercel.app (Note: This link points to a generic Vite React example. Replace with your actual deployment link if available.)

### Deploying From Your Terminal (Vercel CLI)

You can deploy your new Vite project with a single command from your terminal using [Vercel CLI](https://vercel.com/download):

```shell
$ vercel
```

## 🤝 Contributing

We welcome contributions to the ShopCAP frontend! If you have suggestions for improvements, bug reports, or want to contribute code, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature` or `bugfix/FixBug`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

Please ensure your code adheres to the existing style and passes linting checks.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details (if applicable, otherwise specify your license or remove this section).

## 📞 Contact

For support, inquiries, or partnership opportunities, please contact us at:

*   **Email:** info@ShopCAP.com
*   **Website:** [ShopCAP.com](https://ShopCAP.com) (placeholder)
*   **GitHub:** [https://github.com/Nikolaj223/ShopCAP]) (placeholder)

---
© 2025 ShopCAP Inc. All rights reserved.
