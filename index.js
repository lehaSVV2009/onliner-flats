require("dotenv").config();

const parseArgs = require("minimist");
const moment = require("moment");

const { findFlats } = require("./flats");
const telegramApi = require("./telegramApi");

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

const EVENT_TYPE = {
  TELEGRAM_START: "TELEGRAM_START",
  TELEGRAM_HELP: "TELEGRAM_HELP",
  TELEGRAM_FLATS: "TELEGRAM_FLATS",
  URL_FLATS: "URL_FLATS"
};

const handler = async event => {
  console.log(event);

  try {
    const type = resolveEventType(event);

    switch (type) {
      case EVENT_TYPE.TELEGRAM_START:
      case EVENT_TYPE.TELEGRAM_HELP: {
        await sendHelpMessageToTelegram(event);
        return { statusCode: 200, body: JSON.stringify({ status: "ok" }) };
      }
      case EVENT_TYPE.TELEGRAM_FLATS: {
        const config = parseTelegramConfig(event);
        const flats = await findFlats(config);

        await sendFlatsMessageToTelegram(flats, config);

        return { statusCode: 200, body: JSON.stringify({ flats }) };
      }
      case EVENT_TYPE.URL_FLATS:
      default: {
        const config = parseUrlConfig(event);
        const flats = await findFlats(config);

        if (!config.skipTelegramIfEmpty) {
          await sendFlatsMessageToTelegram(flats, config);
        }

        return { statusCode: 200, body: JSON.stringify({ flats }) };
      }
    }
  } catch (e) {
    console.log("Error", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: e.message })
    };
  }
};

/**
 * @param {any} event
 * @return {string} event type
 */
const resolveEventType = event => {
  if (!event || !event.body) {
    return EVENT_TYPE.URL_FLATS;
  }
  try {
    const body = JSON.parse(event.body);
    const text = body && body.message && body.message.text;
    if (!text) {
      return EVENT_TYPE.TELEGRAM_FLATS;
    }
    if (text.includes("/start")) {
      return EVENT_TYPE.TELEGRAM_START;
    }
    if (text.includes("/help")) {
      return EVENT_TYPE.TELEGRAM_HELP;
    }
    return EVENT_TYPE.TELEGRAM_FLATS;
  } catch (e) {
    return EVENT_TYPE.URL_FLATS;
  }
};

const sendHelpMessageToTelegram = async event => {
  const message = parseTelegramMessage(event);
  await telegramApi.sendMessage(
    message.chat.id,
    formatStartMessage(DEFAULT_CONFIG)
  );
};

const sendFlatsMessageToTelegram = async (flats, config) => {
  const flatsMessage = formatFlatsMessage(flats, config);
  await telegramApi.sendMessage(config.chatId, flatsMessage);
};

const parseUrlConfig = event => {
  return event && event.queryStringParameters
    ? {
        ...DEFAULT_CONFIG,
        ...event.queryStringParameters
      }
    : DEFAULT_CONFIG;
};

const parseTelegramConfig = event => {
  const message = parseTelegramMessage(event);

  const config = { ...DEFAULT_CONFIG };
  if (message.chat && message.chat.id) {
    config.chatId = message.chat.id;
  }

  if (!message.text || !message.text.trim().startsWith("/flats")) {
    return config;
  }

  const argv = message.text
    .trim()
    .replace("/flats", "")
    .match(/\S+/g);
  const telegramConfig = parseArgs(argv) || {};

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
  return JSON.parse(event.body).message;
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
    "\n`/flats --resale=false` - только новостройки" +
    "\n`/flats --outermostFloor=true` - не первый и не последний этажи" +
    "\n`/flats --metersToSubway=3000` - максимум 3км до ближайшего метро" +
    "\n`/flats --fromDate=2019-11-01 --toDate=2019-11-10` - появившиеся в продаже с 1 по 10 ноября 2019 года" +
    "\n\n Параметры по умолчанию:" +
    "\n```\n/flats" +
    ` --priceMin=${startConfig.priceMin}` +
    ` --priceMax=${startConfig.priceMax}` +
    ` --numberOfRooms=${startConfig.numberOfRooms}` +
    ` --areaMin=${startConfig.areaMin}` +
    ` --areaMax=${startConfig.areaMax}` +
    ` --buildingYearMin=${startConfig.buildingYearMin}` +
    ` --buildingYearMax=${startConfig.buildingYearMax}` +
    ` --fromDate=${startConfig.fromDate}` +
    ` --toDate=${startConfig.toDate}` +
    ` --metersToSubway=${startConfig.metersToSubway}` +
    ` --resale=${startConfig.resale}` +
    ` --outermostFloor=${startConfig.outermostFloor}` +
    ` --currency=${startConfig.currency}` +
    "```"
  );
};

/**
 * @param {import("./onlinerApi").Apartment[]} flats
 * @param {Config} config
 * @returns {string}
 */
const formatFlatsMessage = (flats, config) =>
  "Онлайнер Квартиры" +
  `\n\n${flats
    .map(
      flat =>
        `${flat.price.amount} ${flat.price.currency}\n${flat.location.address}\n${flat.url}`
    )
    .join("\n\n")} ` +
  `\n\nНастройки: \`\`\`json\n${JSON.stringify(config, null, 2)}\`\`\`` +
  "\nНажми /help чтобы увидеть примеры использования";

exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
exports.EVENT_TYPE = EVENT_TYPE;
exports.handler = handler;
exports.resolveEventType = resolveEventType;
exports.parseTelegramConfig = parseTelegramConfig;
exports.parseUrlConfig = parseUrlConfig;
