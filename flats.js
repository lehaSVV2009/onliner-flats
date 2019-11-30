const { getDistance } = require("geolib");
const moment = require("moment");

const onlinerApi = require("./onlinerApi");

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
 *
 * @param {import("./onlinerApi").Apartment[]} flats
 * @param {{ fromDate: Date, toDate: Date, metersToSubway: number }} config
 */
const filterFlats = (flats, config) => {
  return flats
    .filter(flat => {
      return moment(flat.created_at).isBetween(
        config.fromDate,
        config.toDate,
        null,
        "(]"
      );
    })
    .map(flat => {
      let closestSubwayCoordinates = null;
      let closestSubwayDistance = Number.MAX_VALUE;

      for (subwayCoordinates of MINSK_SUBWAY_COORDINATES) {
        const distance = getDistance(subwayCoordinates, flat.location);
        if (distance < closestSubwayDistance) {
          closestSubwayDistance = distance;
          closestSubwayCoordinates = subwayCoordinates;
        }
      }

      return { ...flat, closestSubwayDistance, closestSubwayCoordinates };
    })
    .filter(flat => {
      return flat.closestSubwayDistance < (config.metersToSubway || 10000);
    });
};

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
 *
 * @param {Config} config
 * @returns {Promise<import("./onlinerApi").Apartment>} flats
 */
const findFlats = async config => {
  const { apartments: flats } = await onlinerApi.fetchApartments(config);

  return filterFlats(flats, config);
};

exports.findFlats = findFlats;
exports.filterFlats = filterFlats;
exports.MINSK_SUBWAY_COORDINATES = MINSK_SUBWAY_COORDINATES;
