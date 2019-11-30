const axios = require("axios");

const client = axios.create({
  baseURL: process.env.ONLINER_API_URL || "https://pk.api.onliner.by",
  timeout: 15000
});

/**
 * @typedef Location
 * @property {number} latitude 53.944847
 * @property {number} longitude 27.695568
 * @property {string} address "Минск, Стариновская улица, 4"
 *
 * @typedef Price
 * @property {number} amount "50000.00"
 * @property {string} currency "USD"
 *
 * @typedef Seller
 * @property {string} type "owner" or "agent"
 *
 * @typedef Area
 * @property {number} kitchen 7.2
 * @property {number} living 11.4
 * @property {number} total 30
 *
 * @typedef Apartment
 * @property {string} created_at "2019-11-22T17:58:26+0300"
 * @property {string} last_time_up "2019-11-22T17:58:26+0300"
 * @property {string} url "https://r.onliner.by/pk/apartments/308981"
 * @property {number} up_available_in 189490
 * @property {string} photo
 * @property {Area} area
 * @property {Location} location
 * @property {Price} price
 * @property {Seller} seller
 *
 * @typedef ApartmentResponse
 * @property {Apartment[]} apartments
 * @property {number} total
 * @property {Object} page
 *
 * @returns {Promise<ApartmentResponse>}
 */
// TODO add multiple params (numberOfRooms, walling)
exports.fetchApartments = async ({
  priceMin,
  priceMax,
  currency,
  numberOfRooms,
  areaMin,
  areaMax,
  buildingYearMin,
  buildingYearMax,
  resale,
  outermostFloor
}) => {
  const params = {
    "price[min]": priceMin >= 1 && priceMin <= 2300000 ? priceMin : 1,
    "price[max]": priceMax >= 1 && priceMax <= 2300000 ? priceMax : 2300000,
    currency: currency || "usd",
    "number_of_rooms[]":
      numberOfRooms >= 1 && numberOfRooms <= 4 ? numberOfRooms : 1,
    "area[min]": areaMin >= 1 && areaMin <= 1000 ? areaMin : 1,
    "area[max]": areaMax >= 1 && areaMax <= 1000 ? areaMax : 1000,
    "building_year[min]":
      buildingYearMin >= 1900 && buildingYearMin <= 2029
        ? buildingYearMin
        : 1900,
    "building_year[max]":
      buildingYearMax >= 1900 && buildingYearMax <= 2029
        ? buildingYearMax
        : 2029,
    resale
  };

  if (outermostFloor) {
    params.outermostFloor = "true";
  }

  const response = await client.get("/search/apartments", { params });
  return response.data;
};
