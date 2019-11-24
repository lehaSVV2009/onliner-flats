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
exports.sendMessage = async (
  chatId,
  message,
  parseMode = "Markdown",
  disableWebPagePreview = true
) => {
  const response = await client.post(
    `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: disableWebPagePreview
    }
  );

  return response.data;
};
