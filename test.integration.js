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

  // ?chatId=-351403469&priceMin=34750&priceMax=55500&currency=usd&numberOfRooms=1&numberOfRooms=2&areaMin=30&areaMax=1000&buildingYearMin=1980&buildingYearMax=2029&resale=true&outermostFloor=false&metersToSubway=5000
  it.skip("Daily onliner flats", async () => {
    const event = {
      queryStringParameters: {
        priceMin: 34750,
        priceMax: 55500,
        numberOfRooms: 1,
        currency: "usd",
        areaMin: 30,
        areaMax: 1000,
        buildingYearMin: 1980,
        buildingYearMax: 2029,
        metersToSubway: 5000,
        resale: "true",
        outermostFloor: "false"
      },
      multiValueQueryStringParameters: {
        numberOfRooms: [1, 2]
      }
    };
    const response = await handler(event);
    expect(response.statusCode).equal(200);
  });

  // ?chatId=-351403469&priceMin=34750&priceMax=55500&currency=usd&numberOfRooms=1&numberOfRooms=2&areaMin=30&areaMax=1000&buildingYearMin=1980&buildingYearMax=2029&resale=true&outermostFloor=false&metersToSubway=1000&skipTelegramIfEmpty=true&hoursAgo=1
  it.skip("Super-new onliner flats", async () => {
    const event = {
      queryStringParameters: {
        priceMin: 34750,
        priceMax: 55500,
        numberOfRooms: 1,
        currency: "usd",
        areaMin: 30,
        areaMax: 1000,
        buildingYearMin: 1980,
        buildingYearMax: 2029,
        metersToSubway: 1000,
        outermostFloor: "false",
        skipTelegramIfEmpty: true,
        hoursAgo: 1
      },
      multiValueQueryStringParameters: {
        numberOfRooms: [1, 2]
      }
    };
    const response = await handler(event);
    expect(response.statusCode).equal(200);
  });

  // https://pk.api.onliner.by/search/apartments?bounds%5Blb%5D%5Blat%5D=53.94990237377555&bounds%5Blb%5D%5Blong%5D=27.64920093119145&bounds%5Brt%5D%5Blat%5D=53.967299682838075&bounds%5Brt%5D%5Blong%5D=27.670658603310592&page=1
  // ?chatId=-351403469&priceMin=34750&priceMax=65000&currency=usd&numberOfRooms=1&numberOfRooms=2&areaMin=20&areaMax=1000&skipTelegramIfEmpty=true&polygon=53.949138,27.659804&polygon=53.952456,27.669926&polygon=53.964345,27.667506&polygon=53.965759,27.648362&polygon=53.957926,27.634967
  it.skip("Novaya Borovaya daily cheap flats", async () => {
    const event = {
      queryStringParameters: {
        priceMin: 34750,
        priceMax: 65000,
        currency: "usd",
        numberOfRooms: 1,
        areaMin: 20,
        areaMax: 1000,
        leftBottomLatitiude: 53.94990237377555,
        leftBottomLongitude: 27.64920093119145,
        rightTopLatitude: 53.967299682838075,
        rightTopLongitude: 27.670658603310592
      },
      multiValueQueryStringParameters: {
        numberOfRooms: [1, 2]
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
