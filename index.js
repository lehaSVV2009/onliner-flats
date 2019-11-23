require("dotenv").config();

const { getDistance } = require("geolib");
const moment = require("moment");

const onlinerApi = require("./onlinerApi");
const telegramApi = require("./telegramApi");

const MINSK_SUBWAY_COORDINATES = [
  // Malinovka-Uruch'e
  { latitude: 53.864158, longitude: 27.485512 },
  { latitude: 53.849176, longitude: 27.474448 },
  { latitude: 53.876678, longitude: 27.496891 },
  { latitude: 53.886731, longitude: 27.514831 },
  { latitude: 53.885966, longitude: 27.539919 },
  { latitude: 53.893208, longitude: 27.548023 },
  { latitude: 53.902106, longitude: 27.562023 },
  { latitude: 53.909136, longitude: 27.575755 },
  { latitude: 53.916035, longitude: 27.583276 },
  { latitude: 53.921998, longitude: 27.599417 },
  { latitude: 53.924211, longitude: 27.613534 },
  { latitude: 53.927858, longitude: 27.627354 },
  { latitude: 53.934456, longitude: 27.651273 },
  { latitude: 53.938671, longitude: 27.666422 },
  { latitude: 53.945313, longitude: 27.687981 },
  // Kamenka-Mogilevskaya
  { latitude: 53.906901, longitude: 27.437447 },
  { latitude: 53.906269, longitude: 27.454397 },
  { latitude: 53.908514, longitude: 27.480807 },
  { latitude: 53.908514, longitude: 27.480807 },
  { latitude: 53.906933, longitude: 27.523477 },
  { latitude: 53.905327, longitude: 27.539393 },
  { latitude: 53.905327, longitude: 27.539393 },
  { latitude: 53.900679, longitude: 27.562093 },
  { latitude: 53.893835, longitude: 27.570201 },
  { latitude: 53.890293, longitude: 27.585399 },
  { latitude: 53.889757, longitude: 27.614338 },
  { latitude: 53.875813, longitude: 27.629173 },
  { latitude: 53.869212, longitude: 27.648618 },
  { latitude: 53.862264, longitude: 27.674146 }
];

const DEFAULT_CONFIG = {
  chatId: process.env.TELEGRAM_CHAT_ID,
  priceMin: 34750,
  priceMax: 50500,
  currency: "usd",
  numberOfRooms: 1,
  areaMin: 30,
  areaMax: 1000,
  resale: "true",
  buildingYearMin: 1980,
  buildingYearMax: 2029,
  fromDate: moment()
    .subtract(1, "days")
    .toDate(),
  toDate: moment().toDate(),
  metersToSubway: 4000
};

exports.handler = async event => {
  console.log(event);

  if (isTelegramStartOrHelpEvent(event)) {
    const message = parseTelegramMessage(event);
    await telegramApi.sendMessage(message.chat.id, START_MESSAGE);

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "ok" })
    };
  }

  try {
    const config = toConfig(event);

    const { apartments } = await onlinerApi.fetchApartments(config);

    const filteredApartments = apartments.filter(
      apartment =>
        moment(apartment.created_at).isBetween(
          config.fromDate,
          config.toDate
        ) &&
        MINSK_SUBWAY_COORDINATES.some(
          subwayCoordinates =>
            getDistance(subwayCoordinates, apartment.location) <
            config.metersToSubway
        )
    );

    await telegramApi.sendMessage(
      config.chatId,
      `Новые однушки у метро с Онлайнера за день: ${filteredApartments
        .map(apartment => apartment.url)
        .join(" ")}`
    );

    console.log("Success");
    return {
      statusCode: 200,
      body: JSON.stringify({ apartments: filteredApartments })
    };
  } catch (e) {
    console.log("Error", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: e.message })
    };
  }
};

const toConfig = event => {
  if (isTelegramEvent(event)) {
    const message = parseTelegramMessage(event);
    try {
      const telegramConfig = JSON.parse(message.text.trim());
      return {
        ...telegramConfig,
        ...DEFAULT_CONFIG
      };
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  }

  if (event.queryStringParameters) {
    return {
      ...DEFAULT_CONFIG,
      ...event.queryStringParameters
    };
  }

  return DEFAULT_CONFIG;
};

/**
 * @typedef Message
 * @property {string} text
 * @property {{ id: number }} chat
 *
 * @param {Object} event
 * @returns {Message}
 */
const parseTelegramMessage = event => {
  const { message } = JSON.parse(event.body);
  return message;
};

/**
 * @param {Object} event
 * @returns {boolean}
 */
const isTelegramStartOrHelpEvent = event => {
  if (!isTelegramEvent(event)) {
    return false;
  }
  const message = parseTelegramMessage(event);
  return message.text === "/start" || message.text === "/help";
};

/**
 * @param {Object} event
 * @returns {boolean}
 */
const isTelegramEvent = event => {
  if (!event || !event.body) {
    return false;
  }
  try {
    const body = JSON.parse(event.body);
    return body && body.message && body.message.text;
  } catch (e) {
    return false;
  }
};

const START_MESSAGE = `
  Скопируйте и вставьте мне следующее сообщение:
  {
    fromDate: ${moment().format("YYYY-MM-DD")},
    toDate: ${moment()
      .subtract(1, "days")
      .format("YYYY-MM-DD")},
    priceMin: 34750,
    priceMax: 50500,
    currency: "usd",
    numberOfRooms: 1,
    areaMin: 30,
    areaMax: 1000,
    buildingYearMin: 1980,
    buildingYearMax: 2029,
    metersToSubway: 3000
  }
`;
