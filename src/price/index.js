import axios from "axios";
import moment from "moment";

const format = d => `${d.format('YYYY-MM-DD')}T${d.format('HH:mm')}`;

const ohlc = (iso, start, end) => axios({
  url: `https://production.api.coindesk.com/v2/price/values/${iso}?start_date=${format(start)}&end_date=${format(end)}&ohlc=${true}`,
  method: 'get',
})
  .then(({ data: { data } }) => data);

export const createSync = async (iso, callback) => setInterval(
  async () => {
    const currentTime = moment();
    const { entries, ...extras } = await ohlc(iso, moment(currentTime).subtract(1, 'hours'), currentTime);
    const { interval } = extras;
    if (interval === "1-minute") {
      return callback(entries, extras);
    }
    console.warn(`Encountered unexpected duration, "${interval}".`);
  },
  30 * 1000,
);
