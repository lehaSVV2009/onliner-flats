const expect = require("chai").expect;
const { filterFlats } = require("./flats");

describe("flats", () => {
  describe("filterFlats", () => {
    it(`should skip too old flats`, () => {
      const flats = [
        {
          created_at: new Date("2019-11-27").toISOString(),
          location: { latitude: 53.864158, longitude: 27.485512 }
        },
        {
          created_at: new Date("2019-11-28").toISOString(),
          location: { latitude: 53.864158, longitude: 27.485512 }
        },
        {
          created_at: new Date("2019-11-29").toISOString(),
          location: { latitude: 53.864158, longitude: 27.485512 }
        },
        {
          created_at: new Date("2019-11-30").toISOString(),
          location: { latitude: 53.864158, longitude: 27.485512 }
        }
      ];

      const filteredFlats = filterFlats(flats, {
        fromDate: new Date("2019-11-28")
      });
      expect(filteredFlats).to.have.length(2);
    });

    it(`should skip too far from subway flats`, () => {
      const flats = [
        {
          created_at: new Date().toISOString(),
          location: { latitude: 53.918339, longitude: 27.560489 } // Bogdanovicha 55 - 1400m
        },
        {
          created_at: new Date().toISOString(),
          location: { latitude: 53.912314, longitude: 27.578723 } // Nezavisimosti 43 - 400m
        },
        {
          created_at: new Date().toISOString(),
          location: { latitude: 53.924619, longitude: 27.544022 } // Starovilensky Trakt 41 - 2100m
        }
      ];

      const filteredFlats = filterFlats(flats, {
        fromDate: new Date("2019-11-29"),
        toDate: new Date(),
        metersToSubway: 2000
      });
      expect(filteredFlats).to.have.length(2);
    });
  });
});
