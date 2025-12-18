// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PartnerRegistry.sol";
import "./CashbackManager.sol";

// ============================================================================
// 4. ShopCAPPlatform.sol
// Purpose: Central point of interaction.
// Coordinates calls between UI/other external systems and internal contracts.
// Responsible for managing access to core operations.
// ============================================================================
contract ShopCAPPlatform is Ownable {
   
    PartnerRegistry public immutable partnerRegistry;
    CashbackManager public immutable cashbackManager;

    event PlatformPartnerAdded(uint256 indexed partnerId, string name, address partnerWallet);
    event PlatformPartnerUpdated(uint256 indexed partnerId, string name, address partnerWallet);
    event PlatformPartnerStatusToggled(uint256 indexed partnerId, bool isActive);
    event PlatformUserRegistered(address indexed user, uint256 indexed referrerPartnerId);
    event PlatformCashbackProcessed(address indexed user, uint256 purchaseAmount, uint256 indexed partnerId);
    event PlatformWithdrawAnyERC20Tokens(address indexed tokenAddress, address indexed to, uint256 amount);


    /**
   * @dev Platform contract constructor. Sets the deployer as the owner.
 * Accepts the addresses of the already deployed PartnerRegistry and CashbackManager contracts.
 * @param _partnerRegistryAddress The address of the deployed PartnerRegistry contract.
 * @param _cashbackManagerAddress The address of the deployed CashbackManager contract.
 */
    constructor(address _partnerRegistryAddress, address _cashbackManagerAddress) Ownable(msg.sender) {
        require(_partnerRegistryAddress != address(0), "PartnerRegistry address cannot be zero");
        require(_cashbackManagerAddress != address(0), "CashbackManager address cannot be zero");

        partnerRegistry = PartnerRegistry(_partnerRegistryAddress);
        cashbackManager = CashbackManager(_cashbackManagerAddress);
        // cashbackManager.transferOwnership(address(this));
    }

    // ========================================================================
// Functions for managing partners (proxy to PartnerRegistry)
 // These functions can only be called by the owner of ShopCAPPlatform.
    // ========================================================================

    /**
   * @dev Adds a new partner. Calls the function in PartnerRegistry.
 * @param _name The name of the partner.
 * @param _description The description of the partner.
 * @param _referralLink The referral link of the partner.
 * @param _partnerWallet The wallet address of the partner.
 * @return partnerId The ID of the added partner.
 */
    function addPartner(
        string memory _name,
        string memory _description,
        string memory _referralLink,
        address _partnerWallet
    ) external onlyOwner returns (uint256) {
        uint256 partnerId = partnerRegistry.addPartner(_name, _description, _referralLink, _partnerWallet);
        emit PlatformPartnerAdded(partnerId, _name, _partnerWallet);
        return partnerId;
    }

  /**
 * @dev Updates information about an existing partner. Calls a function in PartnerRegistry.
 * @param _partnerId The ID of the partner to update.
 * @param _name The new name of the partner.
 * @param _description The new description of the partner.
 * @param _referralLink The new referral link of the partner.
 * @param _partnerWallet The new wallet address of the partner.
 */
    function updatePartner(
        uint256 _partnerId,
        string memory _name,
        string memory _description,
        string memory _referralLink,
        address _partnerWallet
    ) external onlyOwner {
        partnerRegistry.updatePartner(_partnerId, _name, _description, _referralLink, _partnerWallet);
        emit PlatformPartnerUpdated(_partnerId, _name, _partnerWallet);
    }

  /**
 * @dev Changes the partner's activity status. Calls a function in PartnerRegistry.
 * @param _partnerId The partner's ID.
 * @param _isActive The new activity status (true for activation, false for deactivation).
 */
    function togglePartnerStatus(uint256 _partnerId, bool _isActive) external onlyOwner {
        partnerRegistry.togglePartnerStatus(_partnerId, _isActive);
        emit PlatformPartnerStatusToggled(_partnerId, _isActive);
    }

   /**
 * @dev Returns full information about a partner. Calls a function in PartnerRegistry.
 * @param _partnerId The ID of the partner.
 * @return isActive The status of the partner's activity.
 * @return name The name of the partner.
 * @return description The description of the partner.
 * @return referralLink The referral link of the partner.
 * @return partnerWallet The address of the partner's wallet.
 */
    function getPartnerDetails(uint256 _partnerId)
        external
        view
        returns (bool isActive, string memory name, string memory description, string memory referralLink, address partnerWallet)
    {
        return partnerRegistry.getPartnerDetails(_partnerId);
    }
/**
 * @dev Returns the partner's wallet address by its ID. Calls the function in PartnerRegistry.
 * @param _partnerId The partner's ID.
 * @return The partner's wallet address.
 */
    function getPartnerWallet(uint256 _partnerId) external view returns (address) {
        return partnerRegistry.getPartnerWallet(_partnerId);
    }

    // ========================================================================
// Functions for managing users and cashback (proxy to CashbackManager)
 // These functions can only be called by the owner of ShopCAPPlatform.
    // ========================================================================

   /**
 * @dev Registers a new user in the cashback system. Calls a function in CashbackManager.
 * @param _userAddress The user's address for registration.
 * @param _referrerPartnerId The ID of the referral partner (0 if none).
 */
    function registerUserOnPlatform(address _userAddress, uint256 _referrerPartnerId) external onlyOwner {
        cashbackManager.registerUser(_userAddress, _referrerPartnerId);
        emit PlatformUserRegistered(_userAddress, _referrerPartnerId);
    }

 /**
 * @dev Processes the purchase and initiates the distribution of cashback.
 * Calls the function in CashbackManager. This is the main function for integration with the outside world
 * @param _user The address of the user who made the purchase.
 * @param _purchaseAmount The amount of the purchase (in units corresponding to the ShopCAP token).
 * @param _partnerId The ID of the partner through whom the purchase was made.
 */
    function processPurchaseAndIssueCashback(address _user, uint256 _purchaseAmount, uint256 _partnerId) external onlyOwner {
        cashbackManager.issueCashbackAndDistribute(_user, _purchaseAmount, _partnerId);
        emit PlatformCashbackProcessed(_user, _purchaseAmount, _partnerId);
    }

   /**
 * @dev Returns information about the user's referrer from CashbackManager.
 * @param _user User's address.
 * @return ID of the referrer partner.
 */
    function getUserReferrerInfo(address _user) external view returns (uint256) {
        return cashbackManager.getReferrerInfo(_user);
    }

    // ========================================================================
// Functions for viewing status and managing parameters (proxy to CashbackManager)
 // These functions can only be called by the owner of ShopCAPPlatform.
    // ========================================================================

   /**
 * @dev Function declaration for retrieving the balance of ShopCAP tokens on the CashbackManager contract.
 */
    function getCashbackManagerShopCapBalance() external view returns (uint256) {
        return cashbackManager.getShopCapTokenBalance();
    }
    function setCashbackManagerReserveWallet(address _newReserveWallet) external onlyOwner {
        cashbackManager.setReserveWallet(_newReserveWallet);
    }
    function setCashbackManagerParams(
        uint256 _newBasePercent,
        uint256 _newUserShare,
        uint256 _newReserveShare,
        uint256 _newBurnShare
    ) external onlyOwner {
        cashbackManager.setCashbackParams(_newBasePercent, _newUserShare, _newReserveShare, _newBurnShare);
    }
    function setCashbackManagerReferrerBonusPercent(uint256 _newPercent) external onlyOwner {
        cashbackManager.setReferrerBonusPercent(_newPercent);
    }

  // ========================================================================
 // Additional utility functions
 // ========================================================================

 /**
 * @dev Allows the platform owner to withdraw any ERC20 tokens that are not related to ShopCAP,
 * if they have been mistakenly transferred to the Platform contract.
 * Disallows the withdrawal of ShopCAP tokens to avoid violating the system's logic.
 * @param _tokenAddress The address of the token to be withdrawn.
 * @param _amount The number of tokens to be withdrawn.
 * @param _to The address of the recipient.
 */
    function withdrawAnyERC20TokensFromPlatform(address _tokenAddress, uint256 _amount, address _to) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_to != address(0), "Invalid recipient address");
        IERC20 token = IERC20(_tokenAddress);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient platform token balance for withdrawal");
        bool success = token.transfer(_to, _amount);
        require(success, "Token withdrawal failed");
        emit PlatformWithdrawAnyERC20Tokens(_tokenAddress, _to, _amount);
    }
    function getCashbackManagerOwner() external view returns (address) {
        return cashbackManager.owner();
    }
}