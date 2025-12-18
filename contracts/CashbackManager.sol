// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ShopCAPToken.sol";
import "./PartnerRegistry.sol";

// ============================================================================
// 3. CashbackManager.sol
// Purpose: The main contract for all the logic related to cashback,
// referral bonuses, and token distribution (70/20/10).
// ============================================================================
contract CashbackManager is Ownable {
    address public constant BURN_ADDRESS = address(0x000000000000000000000000000000000000dEaD); 
    ShopCAPToken public immutable shopCapToken;
    PartnerRegistry public immutable partnerRegistry;

    address public reserveWallet; 
    uint256 public userCashbackShare = 70;    // User's share
    uint256 public reserveShare = 20;        // Share in the reserve fund
    uint256 public burnShare = 10;            // Share of incineration

    uint256 public cashbackBasePercent = 1; // 1%
// Denominator for percentages to work with integers (100 for percentages)
    uint256 private constant CASHBACK_PERCENT_DENOMINATOR = 100;
    uint256 public referrerBonusPercent = 0; // 0%

// Map for storing the ID of the referral partner for each user
    mapping(address => uint256) public userReferrerPartnerId;

    event UserRegistered(address indexed user, uint256 indexed referrerPartnerId);
    event CashbackIssued(address indexed user, uint256 indexed partnerId, uint256 purchaseAmount, uint256 userCashbackAmount);
    event ReferrerBonusIssued(address indexed referrer, uint256 indexed partnerId, uint256 bonusAmount);
    event TokensToReserve(address indexed wallet, uint256 amount);
    event TokensBurned(uint256 amount);
    event ReserveWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event CashbackParamsUpdated(uint256 newBasePercent, uint256 newUserShare, uint256 newReserveShare, uint256 newBurnShare);
    event ReferrerBonusPercentUpdated(uint256 newPercent);
    event TokenTransferred(address indexed to, uint256 amount); // Для _withdrawAnyERC20Tokens

    /**
* @dev Constructor of the CashbackManager. contract.
 * @param _shopCapTokenAddress The address of the deployed ShopCAPToken. contract.
 * @param _partnerRegistryAddress The address of the deployed PartnerRegistry. contract.
 * @param _initialReserveWallet The initial wallet address for the reserve fund.
     */
    constructor(
        address _shopCapTokenAddress,
        address _partnerRegistryAddress,
        address _initialReserveWallet
    ) Ownable(msg.sender) {
        require(_shopCapTokenAddress != address(0), "ShopCAPToken address cannot be zero");
        require(_partnerRegistryAddress != address(0), "PartnerRegistry address cannot be zero");
        require(_initialReserveWallet != address(0), "Initial reserve wallet cannot be zero");

        shopCapToken = ShopCAPToken(_shopCapTokenAddress);
        partnerRegistry = PartnerRegistry(_partnerRegistryAddress);
        reserveWallet = _initialReserveWallet;
    }

    /**
     * @dev Registers a user in the system and links them to a referrer partner.
 * Can only be called by the contract owner (or a trusted contract, such as ShopCAPPlatform).
 * @param _userAddress The address of the user who is being registered.
 * @param _referrerPartnerId The ID of the partner who is the referrer (0 if there is no referrer).
     */
    function registerUser(address _userAddress, uint256 _referrerPartnerId) external onlyOwner {
        require(_userAddress != address(0), "User address cannot be zero");
        if (_referrerPartnerId != 0) {
            (bool isActive, , , , ) = partnerRegistry.getPartnerDetails(_referrerPartnerId);
            require(isActive, "Referrer partner is not active or does not exist");
        }
        if (userReferrerPartnerId[_userAddress] == 0) {
             userReferrerPartnerId[_userAddress] = _referrerPartnerId;
             emit UserRegistered(_userAddress, _referrerPartnerId);
        }
    }

    /**
 * @dev Processes a purchase, calculates cashback, and distributes tokens.
 * Can only be called by the contract owner (i.e., from ShopCAPPlatform).
 * @param _user The address of the user who made the purchase.
 * @param _purchaseAmount The amount of the purchase (e.g., in minimum currency units).
 * @param _partnerId The ID of the partner through whom the purchase was made.
 */
    function issueCashbackAndDistribute(address _user, uint256 _purchaseAmount, uint256 _partnerId) external onlyOwner {
        require(_user != address(0), "User address cannot be zero");
        require(_purchaseAmount > 0, "Purchase amount must be greater than zero");
        require(_partnerId > 0, "Partner ID must be greater than zero");
        (bool partnerIsActive, , , , address partnerWallet) = partnerRegistry.getPartnerDetails(_partnerId);
        require(partnerIsActive, "Partner is not active or does not exist");

        // 1. Calculate the total amount of cashback
 // Assume that _purchaseAmount is already in the correct units,
        uint256 totalCashbackAmount = (_purchaseAmount * cashbackBasePercent) / CASHBACK_PERCENT_DENOMINATOR;
        require(shopCapToken.balanceOf(address(this)) >= totalCashbackAmount, "Insufficient ShopCAP token balance in contract");

      // 2. Divide the total amount of cashback into shares
        uint256 userAmount = (totalCashbackAmount * userCashbackShare) / CASHBACK_PERCENT_DENOMINATOR;
        uint256 reserveAmount = (totalCashbackAmount * reserveShare) / CASHBACK_PERCENT_DENOMINATOR;
        uint256 burnAmount = (totalCashbackAmount * burnShare) / CASHBACK_PERCENT_DENOMINATOR;

        uint256 referrerAmount = 0;
        address referrerAddress = address(0);

    // 3. Processing of a referral bonus if there is a referrer and the bonus percentage is > 0
        uint256 referrerPartnerId = userReferrerPartnerId[_user];
        if (referrerBonusPercent > 0 && referrerPartnerId != 0) {
            (bool referrerIsActive, , , , address _referrerWallet) = partnerRegistry.getPartnerDetails(referrerPartnerId);
            if (referrerIsActive) { 
                referrerAddress = _referrerWallet;
                referrerAmount = (userAmount * referrerBonusPercent) / CASHBACK_PERCENT_DENOMINATOR; 
                userAmount = userAmount - referrerAmount; 
            }
        }

       // 4. Transfer tokens
        if (userAmount > 0) {
            shopCapToken.transfer(_user, userAmount);
            emit CashbackIssued(_user, _partnerId, _purchaseAmount, userAmount);
        }

        if (referrerAmount > 0 && referrerAddress != address(0)) {
            shopCapToken.transfer(referrerAddress, referrerAmount);
            emit ReferrerBonusIssued(referrerAddress, referrerPartnerId, referrerAmount);
        }
        if (reserveAmount > 0) {
            shopCapToken.transfer(reserveWallet, reserveAmount);
            emit TokensToReserve(reserveWallet, reserveAmount);
        }
        if (burnAmount > 0) {
            shopCapToken.transfer(BURN_ADDRESS, burnAmount);
            emit TokensBurned(burnAmount);
        }
    }

   /**
 * @dev Updates the wallet address for the reserve fund. Can only be called by the owner.
 * @param _newReserveWallet The new reserve wallet address.
 */
    function setReserveWallet(address _newReserveWallet) external onlyOwner {
        require(_newReserveWallet != address(0), "Reserve wallet cannot be zero address");
        emit ReserveWalletUpdated(reserveWallet, _newReserveWallet);
        reserveWallet = _newReserveWallet;
    }

    /**
 * @dev Updates the cashback distribution parameters and the base percentage.
 * Can only be called by the owner.
 * @param _newBasePercent The new base percentage of cashback from the purchase amount (for example, 1 for 1%).
 * @param _newUserShare The new user share (out of 100%).
 * @param _newReserveShare The new reserve share (out of 100%).
 * @param _newBurnShare The new burn share (out of 100%).
 */
    function setCashbackParams(
        uint256 _newBasePercent,
        uint256 _newUserShare,
        uint256 _newReserveShare,
        uint256 _newBurnShare
    ) external onlyOwner {
        require(_newBasePercent > 0 && _newBasePercent <= CASHBACK_PERCENT_DENOMINATOR, "Invalid base cashback percent (must be > 0 and <= 100)");
        require(_newUserShare + _newReserveShare + _newBurnShare == CASHBACK_PERCENT_DENOMINATOR, "Shares must sum up to 100%");
        cashbackBasePercent = _newBasePercent;
        userCashbackShare = _newUserShare;
        reserveShare = _newReserveShare;
        burnShare = _newBurnShare;
        emit CashbackParamsUpdated(_newBasePercent, _newUserShare, _newReserveShare, _newBurnShare);
    }

  /**
 * @dev Updates the referral bonus percentage. Can only be called by the owner.
 * This percentage is deducted from the user's share and awarded to the referrer.
 * @param _newPercent The new referral bonus percentage (for example, 5 for 5%).
 */
    function setReferrerBonusPercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= 100, "Referrer bonus percent cannot exceed 100%"); 
        require(_newPercent <= userCashbackShare, "Referrer bonus percent cannot exceed user's share"); 
        referrerBonusPercent = _newPercent;
        emit ReferrerBonusPercentUpdated(_newPercent);
    }

    function withdrawAnyERC20Tokens(address _tokenAddress, uint256 _amount, address _to) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_to != address(0), "Invalid recipient address");
        require(_tokenAddress != address(shopCapToken), "Cannot withdraw main ShopCAP token via this function");

        IERC20 token = IERC20(_tokenAddress);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient contract token balance for withdrawal");
        bool success = token.transfer(_to, _amount);
        require(success, "Token withdrawal failed");
        emit TokenTransferred(_to, _amount);
    }

    function getShopCapTokenBalance() external view returns (uint256) {
        return shopCapToken.balanceOf(address(this));
    }

    function getReferrerInfo(address _user) external view returns (uint256) {
        return userReferrerPartnerId[_user];
    }
}