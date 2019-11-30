require("dotenv").config();

const { getDistance } = require("geolib");
const parseArgs = require("minimist");
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

/**
 * @typedef Config
 * @property {number} chatId
 * @property {number} priceMin
 * @property {number} priceMax
 * @property {string} currency
 * @property {number} numberOfRooms
 * @property {number} areaMin
 * @property {number} areaMax
 * @property {number} buildingYearMin
 * @property {number} buildingYearMax
 * @property {string} resale
 * @property {string} outermostFloor
 * @property {date} fromDate
 * @property {date} toDate
 * @property {number} metersToSubway
 */
const DEFAULT_CONFIG = {
  chatId: `${process.env.TELEGRAM_CHAT_ID}`,
  priceMin: 10000,
  priceMax: 500000,
  currency: "usd",
  numberOfRooms: 1,
  areaMin: 1,
  areaMax: 1000,
  buildingYearMin: 1950,
  buildingYearMax: 2029,
  resale: "true",
  outermostFloor: "false",
  fromDate: moment()
    .subtract(1, "days")
    .toDate(),
  toDate: moment().toDate(),
  metersToSubway: 10000
};

exports.handler = async event => {
  console.log(event);

  try {
    if (isTelegramStartOrHelpEvent(event)) {
      const message = parseTelegramMessage(event);
      await telegramApi.sendMessage(
        message.chat.id,
        formatStartMessage(DEFAULT_CONFIG)
      );
      return { statusCode: 200, body: JSON.stringify({ status: "ok" }) };
    }

    const config = toConfig(event);

    const { apartments: flats } = await onlinerApi.fetchApartments(config);

    const filteredFlats = flats.filter(
      flat =>
        moment(flat.created_at).isBetween(config.fromDate, config.toDate) &&
        MINSK_SUBWAY_COORDINATES.some(
          subwayCoordinates =>
            getDistance(subwayCoordinates, flat.location) <
            config.metersToSubway
        )
    );

    await telegramApi.sendMessage(
      config.chatId,
      formatFlatsMessage(filteredFlats, config)
    );

    console.log("Success");
    return {
      statusCode: 200,
      body: JSON.stringify({ flats: filteredFlats })
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
  if (!isTelegramEvent(event)) {
    return event.queryStringParameters
      ? {
          ...DEFAULT_CONFIG,
          ...event.queryStringParameters
        }
      : DEFAULT_CONFIG;
  }

  const message = parseTelegramMessage(event);

  const config = { ...DEFAULT_CONFIG };
  if (message.chat && message.chat.id) {
    config.chatId = message.chat.id;
  }

  if (!message.text || !message.text.startsWith("/flats")) {
    return config;
  }

  const telegramConfig = parseArgs(message.text.replace("/flats", "")) || {};

  return {
    ...config,
    ...telegramConfig
  };
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
 * @param {Config} config
 * @returns {string}
 */
const formatStartMessage = config => {
  const { chatId, ...startConfig } = config;
  startConfig.fromDate = moment().format("YYYY-MM-DD");
  startConfig.toDate = moment()
    .add(1, "days")
    .format("YYYY-MM-DD");

  return (
    "Введите /flats чтобы увидеть НОВЫЕ объявления о квартирах сегодня" +
    "\n\nПримеры:" +
    "\n`/flats --priceMin=20000 --priceMax=60000` - квартиры от 20.000$ до 60.000$" +
    "\n`/flats --numberOfRooms=2` - двухкомнатные квартиры" +
    "\n`/flats --numberOfRooms=3 --areaMin=50 --areaMax=90` - трехкомнатные от 50 кв.м. до 90 кв.м." +
    "\n`/flats --buildingYearMin=1970 --buildingYearMax=2010` - годом постройки от 1970 до 2010" +
    "\n`/flats --metersToSubway=3000 - максимум 3км до ближайшего метро" +
    "\n`/flats --fromDate=2019-11-01 --toDate=2019-11-10 - появившиеся в продаже с 1 по 10 ноября 2019 года" +
    "\n`/flats --resale=false - только новостройки" +
    "\n`/flats --outermostFloor=true - не первый и не последний этажи" +
    "\n\n Параметры по умолчанию:" +
    "\n`/flats " +
    `--priceMin=${startConfig.priceMin}` +
    `--priceMax=${startConfig.priceMax}` +
    `--numberOfRooms=${startConfig.numberOfRooms}` +
    `--areaMin=${startConfig.areaMin}` +
    ` --areaMax=${startConfig.areaMin}` +
    ` --buildingYearMin=${startConfig.buildingYearMin}` +
    ` --buildingYearMax=${startConfig.buildingYearMax}` +
    ` --fromDate=${startConfig.fromDate}` +
    ` --toDate=${startConfig.toDate}` +
    ` --metersToSubway=${startConfig.metersToSubway}` +
    ` --resale=${startConfig.resale}` +
    ` --outermostFloor=${startConfig.outermostFloor}` +
    ` --currency=${startConfig.currency}` +
    "`"
  );
};

/**
 * @param {import("./onlinerApi").Apartment[]} flats
 * @param {Config} config
 * @returns {string}
 */
const formatFlatsMessage = (flats, config) =>
  "#onliner_flats" +
  `\n${flats
    .map(
      flat =>
        `${flat.price.amount} ${flat.price.currency}\n${flat.location.address}\n${flat.url}`
    )
    .join("\n")} ` +
  `\nНастройки: \`\`\`json\n${JSON.stringify(config, null, 2)}\`\`\`` +
  "\nНажми /help чтобы увидеть примеры использования";
