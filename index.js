require("dotenv").config();

const parseArgs = require("minimist");
const moment = require("moment");

const { findFlats } = require("./flats");
const telegramApi = require("./telegramApi");

const DEFAULT_CONFIG = {
  chatId: `${process.env.TELEGRAM_CHAT_ID}`,
  priceMin: 1,
  priceMax: 2300000,
  currency: "usd",
  numberOfRooms: [1, 2],
  areaMin: 1,
  areaMax: 1000,
  buildingYearMin: 1900,
  buildingYearMax: 2029,
  walling: [],
  fromDate: moment()
    .subtract(24, "hours")
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
        // TODO add Joi.assert
        const config = parseTelegramConfig(event);
        const flats = await findFlats(config);

        await sendFlatsMessageToTelegram(flats, config);

        return { statusCode: 200, body: JSON.stringify({ flats }) };
      }
      case EVENT_TYPE.URL_FLATS:
      default: {
        // TODO add Joi.assert
        const config = parseUrlConfig(event);
        const flats = await findFlats(config);

        if (flats.length !== 0 || !config.skipTelegramIfEmpty) {
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
    (message.chat && message.chat.id) || process.env.TELEGRAM_CHAT_ID,
    formatStartMessage(DEFAULT_CONFIG)
  );
};

const sendFlatsMessageToTelegram = async (flats, config) => {
  const flatsMessage = formatFlatsMessage(flats, config);
  await telegramApi.sendMessage(config.chatId, flatsMessage);
};

const parseUrlConfig = event => {
  if (!event || !event.queryStringParameters) {
    return DEFAULT_CONFIG;
  }

  const config = {
    ...DEFAULT_CONFIG,
    ...event.queryStringParameters
  };

  if (config.numberOfRooms) {
    config.numberOfRooms = event.multiValueQueryStringParameters.numberOfRooms;
  }
  if (config.walling) {
    config.walling = event.multiValueQueryStringParameters.walling;
  }
  if (config.hoursAgo && config.hoursAgo > 0) {
    config.fromDate = config.toDate
      ? moment(config.toDate)
          .subtract(config.hoursAgo, "hours")
          .toDate()
      : moment()
          .subtract(config.hoursAgo, "hours")
          .toDate();
  }

  return config;
};

const parseTelegramConfig = event => {
  const message = parseTelegramMessage(event);

  const config = { ...DEFAULT_CONFIG };
  if (message.chat && message.chat.id) {
    config.chatId = message.chat.id;
  }

  let text = message.text;
  if (!text || !text.trim().startsWith("/flats")) {
    return config;
  }

  text = text.trim();
  if (!text.startsWith("/flats") || text === "/flats") {
    return config;
  }

  const argv = text.replace("/flats", "").match(/\S+/g);
  const telegramConfig = parseArgs(argv) || {};

  // Set potentially multiple options as always multiple
  if (
    telegramConfig.numberOfRooms &&
    !Array.isArray(telegramConfig.numberOfRooms)
  ) {
    telegramConfig.numberOfRooms = [telegramConfig.numberOfRooms];
  }
  if (telegramConfig.walling && !Array.isArray(telegramConfig.walling)) {
    telegramConfig.walling = [telegramConfig.walling];
  }

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
    "\n\nПримеры команд:" +
    "\n`/flats --priceMin=20000 --priceMax=60000` - квартиры от 20.000$ до 60.000$" +
    "\n`/flats --numberOfRooms=2` - двухкомнатные квартиры" +
    "\n`/flats --numberOfRooms=3 --areaMin=50 --areaMax=90` - трехкомнатные от 50 кв.м. до 90 кв.м." +
    "\n`/flats --numberOfRooms=1 --numberOfRooms=2` - только одно или двухкомнатные квартиры" +
    "\n`/flats --buildingYearMin=1970 --buildingYearMax=2010` - годом постройки от 1970 до 2010" +
    "\n`/flats --resale=false` - только новостройки" +
    "\n`/flats --outermostFloor=true` - не первый и не последний этажи" +
    "\n`/flats --metersToSubway=3000` - максимум 3км до ближайшего метро" +
    "\n`/flats --walling=brick --walling=monolith` - только кирпич или монолит (возможные варианты: `brick`, `monolith`, `block`, `panel`)" +
    "\n`/flats --fromDate=2019-11-01 --toDate=2019-11-10` - появившиеся в продаже с 1 по 10 ноября 2019 года" +
    "\n\n Параметры по умолчанию:" +
    "\n```\n/flats" +
    ` --priceMin=${startConfig.priceMin}` +
    ` --priceMax=${startConfig.priceMax}` +
    ` ${startConfig.numberOfRooms
      .map(numberOfRooms => `--numberOfRooms=${numberOfRooms}`)
      .join(" ")}` +
    ` --areaMin=${startConfig.areaMin}` +
    ` --areaMax=${startConfig.areaMax}` +
    ` --buildingYearMin=${startConfig.buildingYearMin}` +
    ` --buildingYearMax=${startConfig.buildingYearMax}` +
    ` --fromDate=${startConfig.fromDate}` +
    ` --toDate=${startConfig.toDate}` +
    ` --metersToSubway=${startConfig.metersToSubway}` +
    "```"
  );
};

/**
 * @param {import("./onlinerApi").Apartment[]} flats
 * @param {Config} config
 * @returns {string}
 */
const formatFlatsMessage = (flats, config) =>
  "Онлайнер новые предложения квартир за день" +
  `\n\n${flats
    .map(
      flat =>
        `${flat.price.amount} ${flat.price.currency}` +
        `\n${flat.location.address}` +
        `\n${flat.closestSubwayDistance} метров до метро` +
        `\nВыложено ${moment().diff(flat.created_at, "hours")}ч назад` +
        `\n${flat.url}`
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
