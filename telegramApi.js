const axios = require("axios");

const client = axios.create({
  baseURL: process.env.TELEGRAM_API_URL || "https://api.telegram.org",
  timeout: 15000
});

/**
 * @param {number} chatId
 * @param {string} text
 * @returns {Promise}
 */
exports.sendMessage = async (chatId, message) => {
  const response = await client.post(
    `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: message
    }
  );

  return response.data;
};
