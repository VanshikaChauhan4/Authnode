import QRCode from "qrcode";

export const generateQR = async (text) => {
  return await QRCode.toDataURL(text);
};
