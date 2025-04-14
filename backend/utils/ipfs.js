const { PinataSDK } = require("pinata")
require("dotenv").config()

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL
})

export async function fetchFileFromIPFS(cid) {
  try {
    const file = await pinata.gateways.get(cid);
    console.log(file.data)
    return file.data;
  } catch (error) {
    console.log(error);
  }
}