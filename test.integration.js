const expect = require("chai").expect;

const { handler } = require("./index");

describe("integration tests", () => {
  it.skip("should send message to telegram on /help", async () => {
    const event = {
      body: JSON.stringify({
        message: { text: "/help" }
      })
    };
    const response = await handler(event);
    expect(response.statusCode).equal(200);
  });

  it.skip("should send message to telegram on /flats", async () => {
    const event = {
      body: JSON.stringify({
        message: { text: "/flats" }
      })
    };
    const response = await handler(event);
    expect(response.statusCode).equal(200);
  });

  it.skip("should send to specific telegram chat on /flats", async () => {
    const event = {
      body: JSON.stringify({
        message: { text: "/flats", chat: { id: "-351403469" } }
      })
    };
    const response = await handler(event);
    expect(response.statusCode).equal(200);
  });

  it.skip("should send message to telegram on /flats with options", async () => {
    const event = {
      body: JSON.stringify({
        message: {
          text:
            "/flats --priceMin=30000 --priceMax=50500 --numberOfRooms=1 --numberOfRooms=2 --areaMin=30 --areaMax=1000 --buildingYearMin=1980 --buildingYearMax=2029 --fromDate=2019-11-01 --toDate=2019-12-01 --metersToSubway=3000 --resale=true --outermostFloor=true"
        }
      })
    };
    const response = await handler(event);
    expect(response.statusCode).equal(200);
  });

  it.skip("should send message to telegram on curl", async () => {
    const event = { body: null };
    const response = await handler(event);
    expect(response.statusCode).equal(200);
  });

  it.skip("should send message to telegram on curl with options", async () => {
    const event = {
      queryStringParameters: {
        priceMin: 30000,
        priceMax: 50500,
        numberOfRooms: 1,
        areaMin: 30,
        buildingYearMin: 1980,
        hoursAgo: 3,
        metersToSubway: 1000,
        resale: "true",
        outermostFloor: "true"
      },
      multiValueQueryStringParameters: {
        numberOfRooms: [1]
      }
    };
    const response = await handler(event);
    expect(response.statusCode).equal(200);
  });

  it.skip("should return flats without telegram messages on curl", async () => {
    const event = {
      queryStringParameters: {
        priceMin: 2300000,
        priceMax: 2300000,
        skipTelegramIfEmpty: true
      }
    };

    const response = await handler(event);
    expect(response.statusCode).equal(200);
    expect(response.body).equal(JSON.stringify({ flats: [] }));
  });
});
