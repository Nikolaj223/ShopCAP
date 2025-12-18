// src/services/ipfsService.js
import axios from "axios";

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;
const PINATA_BASE_URL = "https://api.pinata.cloud/pinning";

/**
 * Loads a JSON object into IPFS via Pinata.
 * @param {object} jsonData - JSON object to load.
 * @returns {Promise<string|null>} IPFS CID if successful, otherwise null.
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
 * Uploads a file to IPFS via Pinata.
 * @param {File} file - The file to upload.
 * @returns {Promise<string|null>} The IPFS CID if successful, otherwise null.
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
                    "Content-Type": `multipart/form-data`,
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
 * Retrieves data from IPFS by CID.
 * @param {string} cid - IPFS CID of the data.
 * @returns {Promise<any|null>} The retrieved data or null if an error occurs.
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
