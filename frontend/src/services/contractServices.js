// src/services/contractServices.js
import { ethers } from "ethers";
import { contractAddresses, contractABIs } from "../utils/contract-config";

/**
 * Вспомогательная функция для получения адресов контрактов для текущей сети.
 * @param {string} chainId - ID текущей сети.
 * @returns {object|null} Объект с адресами контрактов или null, если сеть не поддерживается.
 */
const getContractAddressesForChain = (chainId) => {
    const addresses = contractAddresses[chainId];
    if (!addresses) {
        console.error(`Контракты не развернуты в сети с ID ${chainId}`);
        return null;
    }
    return addresses;
};

/**
 * Создает экземпляр контракта ShopCAPToken.
 * @param {ethers.Signer | ethers.Provider} providerOrSigner - Объект провайдера или подписывающего.
 * @param {string} chainId - ID текущей сети.
 * @returns {ethers.Contract | null} Экземпляр контракта или null.
 */
export const getShopCAPTokenContract = (providerOrSigner, chainId) => {
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses) return null;
    return new ethers.Contract(
        addresses.shopCAPToken,
        contractABIs.ShopCAPToken,
        providerOrSigner
    );
};

/**
 * Создает экземпляр контракта PartnerRegistry.
 * @param {ethers.Signer | ethers.Provider} providerOrSigner - Объект провайдера или подписывающего.
 * @param {string} chainId - ID текущей сети.
 * @returns {ethers.Contract | null} Экземпляр контракта или null.
 */
export const getPartnerRegistryContract = (providerOrSigner, chainId) => {
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses) return null;
    return new ethers.Contract(
        addresses.partnerRegistry,
        contractABIs.PartnerRegistry,
        providerOrSigner
    );
};

/**
 * Создает экземпляр контракта CashbackManager.
 * @param {ethers.Signer | ethers.Provider} providerOrSigner - Объект провайдера или подписывающего.
 * @param {string} chainId - ID текущей сети.
 * @returns {ethers.Contract | null} Экземпляр контракта или null.
 */
export const getCashbackManagerContract = (providerOrSigner, chainId) => {
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses) return null;
    return new ethers.Contract(
        addresses.cashbackManager,
        contractABIs.CashbackManager,
        providerOrSigner
    );
};

/**
 * Создает экземпляр контракта ShopCAPPlatform.
 * @param {ethers.Signer | ethers.Provider} providerOrSigner - Объект провайдера или подписывающего.
 * @param {string} chainId - ID текущей сети.
 * @returns {ethers.Contract | null} Экземпляр контракта или null.
 */
export const getShopCAPPlatformContract = (providerOrSigner, chainId) => {
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses) return null;
    return new ethers.Contract(
        addresses.shopCAPPlatform,
        contractABIs.ShopCAPPlatform,
        providerOrSigner
    );
};

// --- Функции для взаимодействия с контрактами ---

/**
 * Получает баланс токенов пользователя.
 * @param {ethers.Provider} provider - Объект провайдера.
 * @param {string} tokenAddress - Адрес токена.
 * @param {string} accountAddress - Адрес пользователя.
 * @param {string} chainId - ID текущей сети.
 * @returns {Promise<string>} Баланс токенов (отформатированный).
 */
export const getTokenBalance = async (
    provider,
    tokenAddress,
    accountAddress,
    chainId
) => {
    if (!provider || !tokenAddress || !accountAddress) return "0";
    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            contractABIs.ShopCAPToken, // Используем ABI ShopCAPToken, так как это общий ERC20
            provider
        );
        const balance = await tokenContract.balanceOf(accountAddress);
        return ethers.utils.formatUnits(balance, 18); // Предполагаем 18 десятичных знаков
    } catch (error) {
        console.error("Error getting token balance:", error);
        return "0";
    }
};

/**
 * Переводит токены.
 * @param {ethers.Signer} signer - Объект подписывающего.
 * @param {string} tokenAddress - Адрес токена для перевода.
 * @param {string} toAddress - Адрес получателя.
 * @param {string} amount - Количество токенов для перевода (в базовых единицах, если не форматируется).
 * @param {string} chainId - ID текущей сети.
 * @returns {Promise<ethers.providers.TransactionResponse>} Ответ транзакции.
 */
export const transferTokens = async (
    signer,
    tokenAddress,
    toAddress,
    amount,
    chainId
) => {
    if (!signer || !tokenAddress || !toAddress || !amount) {
        throw new Error("Missing parameters for token transfer.");
    }
    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            contractABIs.ShopCAPToken,
            signer
        );
        // Преобразуем сумму в ethers.BigNumber с 18 десятичными знаками
        const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
        const tx = await tokenContract.transfer(toAddress, amountInWei);
        return tx;
    } catch (error) {
        console.error("Error transferring tokens:", error);
        throw error;
    }
};

/**
 * Регистрирует нового партнера в PartnerRegistry.
 * @param {ethers.Signer} signer - Объект подписывающего.
 * @param {string} name - Имя партнера.
 * @param {string} description - Описание партнера.
 * @param {string} referralLink - Реферальная ссылка партнера.
 * @param {string} ownerAddress - Адрес владельца партнера (обычно `signer.getAddress()`).
 * @param {string} chainId - ID текущей сети.
 * @returns {Promise<ethers.providers.TransactionResponse>} Ответ транзакции.
 */
export const registerPartner = async (
    signer,
    name,
    description,
    referralLink,
    ownerAddress,
    chainId
) => {
    if (!signer) throw new Error("Signer is not available.");
    const partnerRegistryContract = getPartnerRegistryContract(signer, chainId);
    if (!partnerRegistryContract)
        throw new Error("PartnerRegistry contract not found for this chain.");

    try {
        const tx = await partnerRegistryContract.registerPartner(
            name,
            description,
            referralLink,
            ownerAddress
        );
        return tx;
    } catch (error) {
        console.error("Error registering partner:", error);
        throw error;
    }
};

/**
 * Получает детали партнера по его ID.
 * @param {ethers.Provider} provider - Объект провайдера.
 * @param {number} partnerId - ID партнера.
 * @param {string} chainId - ID текущей сети.
 * @returns {Promise<object>} Детали партнера.
 */
export const getPartnerDetails = async (provider, partnerId, chainId) => {
    if (!provider) throw new Error("Provider is not available.");
    const partnerRegistryContract = getPartnerRegistryContract(
        provider,
        chainId
    );
    if (!partnerRegistryContract)
        throw new Error("PartnerRegistry contract not found for this chain.");

    try {
        const details = await partnerRegistryContract.getPartner(partnerId);
        // Преобразовать BigNumber в читаемые значения, если необходимо
        return {
            id: details.id.toString(),
            ownerAddress: details.ownerAddress,
            name: details.name,
            description: details.description,
            referralLink: details.referralLink,
            isActive: details.isActive,
            // Другие поля, если есть
        };
    } catch (error) {
        console.error("Error getting partner details:", error);
        throw error;
    }
};

/**
 * Получает общее количество зарегистрированных партнеров.
 * @param {ethers.Provider} provider - Объект провайдера.
 * @param {string} chainId - ID текущей сети.
 * @returns {Promise<number>} Общее количество партнеров.
 */
export const getTotalPartners = async (provider, chainId) => {
    if (!provider) throw new Error("Provider is not available.");
    const partnerRegistryContract = getPartnerRegistryContract(
        provider,
        chainId
    );
    if (!partnerRegistryContract)
        throw new Error("PartnerRegistry contract not found for this chain.");

    try {
        const count = await partnerRegistryContract.totalPartners();
        return count.toNumber();
    } catch (error) {
        console.error("Error getting total partners:", error);
        throw error;
    }
};

/**
 * Получает все зарегистрированные партнеры.
 * @param {ethers.Provider} provider - Объект провайдера.
 * @param {string} chainId - ID текущей сети.
 * @returns {Promise<Array<object>>} Массив с деталями всех партнеров.
 */
export const getAllPartners = async (provider, chainId) => {
    if (!provider) throw new Error("Provider is not available.");
    const partnerRegistryContract = getPartnerRegistryContract(
        provider,
        chainId
    );
    if (!partnerRegistryContract)
        throw new Error("PartnerRegistry contract not found for this chain.");

    try {
        const total = await getTotalPartners(provider, chainId);
        const partners = [];
        for (let i = 1; i <= total; i++) {
            // Предполагаем, что ID начинаются с 1
            const partner = await getPartnerDetails(provider, i, chainId);
            partners.push(partner);
        }
        return partners;
    } catch (error) {
        console.error("Error getting all partners:", error);
        throw error;
    }
};

/**
 * Чеканит токены за реферальные действия через ShopCAPPlatform.
 * @param {ethers.Signer} signer - Объект подписывающего.
 * @param {string} userAddress - Адрес пользователя, для которого чеканятся токены (реферал).
 * @param {string} referrerId - ID партнера-реферера в PartnerRegistry.
 * @param {string} amount - Количество токенов (в базовых единицах, если не форматируется).
 * @param {string} chainId - ID текущей сети.
 * @returns {Promise<ethers.providers.TransactionResponse>} Ответ транзакции.
 */
export const mintTokensForReferral = async (
    signer,
    userAddress,
    referrerId,
    amount,
    chainId
) => {
    if (!signer) throw new Error("Signer is not available.");
    const shopCAPPlatformContract = getShopCAPPlatformContract(signer, chainId);
    if (!shopCAPPlatformContract)
        throw new Error("ShopCAPPlatform contract not found for this chain.");

    try {
        const amountInWei = ethers.utils.parseUnits(amount.toString(), 18); // Предполагаем 18 десятичных знаков
        const tx = await shopCAPPlatformContract.mintForReferral(
            userAddress,
            referrerId,
            amountInWei
        );
        return tx;
    } catch (error) {
        console.error("Error minting tokens for referral:", error);
        throw error;
    }
};

// Добавьте другие функции для взаимодействия с CashbackManager и ShopCAPPlatform
// Например, для получения кэшбэка, установки правил, инициирования выплат и т.д.
// Просто следуйте тому же паттерну: создайте контракт, вызовите метод.
