const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const expect = chai.expect;

const {
  EVENT_TYPE,
  resolveEventType,
  parseTelegramConfig
} = require("./index");

describe("index", () => {
  describe("resolveEventType", () => {
    const tests = [
      { expected: EVENT_TYPE.URL_FLATS, event: null },
      { expected: EVENT_TYPE.URL_FLATS, event: {} },
      { expected: EVENT_TYPE.URL_FLATS, event: { body: {} } },
      { expected: EVENT_TYPE.TELEGRAM_FLATS, event: { body: "{}" } },
      {
        expected: EVENT_TYPE.TELEGRAM_FLATS,
        event: { body: `{ "message": "bla" }` }
      },
      {
        expected: EVENT_TYPE.TELEGRAM_START,
        event: { body: `{ "message": { "text": "/start" } }` }
      },
      {
        expected: EVENT_TYPE.TELEGRAM_HELP,
        event: { body: `{ "message": { "text": "/help " } }` }
      },
      {
        expected: EVENT_TYPE.TELEGRAM_HELP,
        event: { body: `{ "message": { "text": "  /help " } }` }
      },
      {
        expected: EVENT_TYPE.TELEGRAM_HELP,
        event: {
          body: `{ "message": { "text": "/help@lehasvv2009_onliner_flats_bot" } }`
        }
      },
      {
        expected: EVENT_TYPE.TELEGRAM_FLATS,
        event: {
          body: `{ "message": { "text": "/flats" } }`
        }
      },
      {
        expected: EVENT_TYPE.TELEGRAM_FLATS,
        event: {
          body: `{ "message": { "text": "/flats --priceMin=123 --priceMax=456" } }`
        }
      },
      {
        expected: EVENT_TYPE.TELEGRAM_FLATS,
        event: {
          body: `{ "message": { "text": "/flats@lehasvv2009_onliner_flats_bot" } }`
        }
      }
    ];

    tests.forEach(test => {
      const { expected, event } = test;

      it(`should return ${expected} when ${JSON.stringify(event)}`, () => {
        const type = resolveEventType(event);
        expect(type).to.equal(expected);
      });
    });
  });

  describe("parseTelegramConfig", () => {
    it(`should parse telegram message to valid json config`, () => {
      const event = {
        body:
          '{ "message": { "chat": { "id": 123 }, "text": " /flats' +
          "  --priceMin=123" +
          " --priceMax=456" +
          " --numberOfRooms=1" +
          " --numberOfRooms=2" +
          " --areaMin=47" +
          " --areaMax=96" +
          " --buildingYearMin=1980" +
          " --buildingYearMax=2011" +
          " --walling=block" +
          " --walling=monolith" +
          " --walling=brick" +
          " --fromDate=2019-11-30" +
          " --toDate=2019-12-01" +
          " --metersToSubway=10000" +
          " --resale=true" +
          " --outermostFloor=false" +
          " --polygon=53.949138,27.659804" +
          " --polygon=53.952456,27.669926" +
          ' --currency=usd" } }'
      };

      const config = parseTelegramConfig(event);

      expect(config).to.include({
        chatId: 123,
        priceMin: 123,
        priceMax: 456,
        areaMin: 47,
        areaMax: 96,
        buildingYearMin: 1980,
        buildingYearMax: 2011,
        fromDate: "2019-11-30",
        toDate: "2019-12-01",
        resale: "true",
        outermostFloor: "false",
        currency: "usd"
      });
      expect(config.numberOfRooms).to.have.members([1, 2]);
      expect(config.walling).to.have.members(["block", "monolith", "brick"]);
      expect(config.polygon).to.containSubset([
        { latitude: 53.949138, longitude: 27.659804 },
        { latitude: 53.952456, longitude: 27.669926 }
      ]);
    });
  });
});
