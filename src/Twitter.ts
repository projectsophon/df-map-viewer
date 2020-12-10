const isProd = true;
const WEBSERVER_URL = isProd ? 'https://zkga.me' : 'http://localhost:3000';

export type AddressTwitterMap = {
  [ethAddress: string]: string;
};

export const getAllTwitters = async (): Promise<AddressTwitterMap> => {
  try {
    const twitterMap: AddressTwitterMap = await fetch(
      `${WEBSERVER_URL}/twitter/all-twitters`
    ).then((x) => x.json());
    return twitterMap;
  } catch (e) {
    console.log('Error getting twitter handles.');
    console.error(e);
    return {};
  }
};
