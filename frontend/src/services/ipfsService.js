// src/services/ipfsService.js (Без изменений, так как он уже независим)
import axios from "axios";

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;
const PINATA_BASE_URL = "https://api.pinata.cloud/pinning";

/**
 * Загружает JSON-объект в IPFS через Pinata.
 * @param {object} jsonData - JSON-объект для загрузки.
 * @returns {Promise<string|null>} IPFS CID в случае успеха, иначе null.
 */
export const uploadJSONToPinata = async (jsonData) => {
    try {
        const response = await axios.post(
            `${PINATA_BASE_URL}/pinJSONToIPFS`,
            jsonData,
            {
                headers: {
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data.IpfsHash;
    } catch (error) {
        console.error(
            "Pinata JSON upload error:",
            error.response || error.message
        );
        return null;
    }
};

/**
 * Загружает файл в IPFS через Pinata.
 * @param {File} file - Файл для загрузки.
 * @returns {Promise<string|null>} IPFS CID в случае успеха, иначе null.
 */
export const uploadFileToPinata = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
            `${PINATA_BASE_URL}/pinFileToIPFS`,
            formData,
            {
                headers: {
                    "Content-Type": `multipart/form-data`, // Важно! axios сам поставит правильный boundary
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_API_KEY,
                },
            }
        );
        return response.data.IpfsHash;
    } catch (error) {
        console.error(
            "Pinata file upload error:",
            error.response || error.message
        );
        return null;
    }
};

/**
 * Извлекает данные из IPFS по CID.
 * @param {string} cid - IPFS CID данных.
 * @returns {Promise<any|null>} Извлеченные данные или null в случае ошибки.
 */
export const fetchFromIPFS = async (cid) => {
    try {
        const response = await axios.get(
            `https://gateway.pinata.cloud/ipfs/${cid}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching from IPFS:", error);
        return null;
    }
};
