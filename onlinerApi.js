const axios = require("axios");
const qs = require("qs");
const curlirize = require("axios-curlirize");

const client = axios.create({
  baseURL: process.env.ONLINER_API_URL || "https://pk.api.onliner.by",
  timeout: 15000
});

curlirize(client);

/**
 * @typedef Location
 * @property {number} latitude 53.944847
 * @property {number} longitude 27.695568
 * @property {string} address "Минск, Стариновская улица, 4"
 * @property {string} user_address "Стариновская улица, 4"
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
 * @property {number} id 303987
 * @property {number} author_id 303987
 * @property {string} created_at "2019-11-22T17:58:26+0300"
 * @property {string} last_time_up "2019-11-22T17:58:26+0300"
 * @property {string} url "https://r.onliner.by/pk/apartments/308981"
 * @property {number} up_available_in 189490
 * @property {string} photo
 * @property {Area} area
 * @property {Location} location
 * @property {Price} price
 * @property {Seller} seller
 * @property {boolean} resale false
 * @property {number} number_of_rooms 5
 * @property {number} number_of_floors 11
 * @property {number} floor 10
 * @property {any} auction_bid
 *
 * @typedef Page
 * @property {number} limit 96
 * @property {number} items 96
 * @property {number} current 1
 * @property {number} last 8
 *
 * @typedef ApartmentResponse
 * @property {Apartment[]} apartments
 * @property {number} total
 * @property {Page} page
 *
 * @returns {Promise<ApartmentResponse>}
 */
exports.fetchApartments = async ({
  priceMin,
  priceMax,
  numberOfRooms,
  areaMin,
  areaMax,
  buildingYearMin,
  buildingYearMax,
  resale,
  outermostFloor,
  walling,
  leftBottomLatitude,
  leftBottomLongitude,
  rightTopLatitude,
  rightTopLongitude,
  page
}) => {
  const params = {
    page: page || 1,
    "price[min]": priceMin >= 1 && priceMin <= 2300000 ? priceMin : 1,
    "price[max]": priceMax >= 1 && priceMax <= 2300000 ? priceMax : 2300000,
    currency: "usd",
    "area[min]": areaMin >= 1 && areaMin <= 1000 ? areaMin : 1,
    "area[max]": areaMax >= 1 && areaMax <= 1000 ? areaMax : 1000,
    "building_year[min]":
      buildingYearMin >= 1900 && buildingYearMin <= 2029
        ? buildingYearMin
        : 1900,
    "building_year[max]":
      buildingYearMax >= 1900 && buildingYearMax <= 2029
        ? buildingYearMax
        : 2029
  };

  if (Array.isArray(numberOfRooms)) {
    params["number_of_rooms[]"] = numberOfRooms.map(number =>
      number >= 1 && number <= 4 ? number : 1
    );
  }

  if (Array.isArray(walling)) {
    params["walling[]"] = walling;
  }

  if (resale) {
    params.resale = resale;
  }

  if (outermostFloor) {
    params.outermostFloor = "true";
  }

  if (leftBottomLatitude) {
    params["bounds[lb][lat]"] = leftBottomLatitude;
  }
  if (leftBottomLongitude) {
    params["bounds[lb][long]"] = leftBottomLongitude;
  }
  if (rightTopLatitude) {
    params["bounds[rt][lat]"] = rightTopLatitude;
  }
  if (rightTopLongitude) {
    params["bounds[rt][long]"] = rightTopLongitude;
  }

  const response = await client.get("/search/apartments", {
    params,
    paramsSerializer: params => qs.stringify(params, { indices: false })
  });
  return response.data;
};
