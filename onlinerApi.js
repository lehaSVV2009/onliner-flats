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
  const response = await client.get("/search/apartments", {
    params: {
      "price[min]": priceMin,
      "price[max]": priceMax,
      currency,
      "number_of_rooms[]": numberOfRooms,
      "area[min]": areaMin,
      "area[max]": areaMax,
      "building_year[min]": buildingYearMin,
      "building_year[max]": buildingYearMax,
      resale,
      outermost_floor: outermostFloor
    }
  });
  return response.data;
};
