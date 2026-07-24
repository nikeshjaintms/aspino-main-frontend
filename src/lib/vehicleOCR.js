import Tesseract from "tesseract.js";

/*
=========================================
IMAGE PREPROCESSING
=========================================
*/

export const preprocessImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Scale by 2.5 to increase resolution and readability of smaller fonts
      canvas.width = img.width * 2.5;
      canvas.height = img.height * 2.5;

     ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    0,
    0,
    canvas.width,
    canvas.height
);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Find brightness boundaries for simple local adaptive-like contrast stretching
      let min = 255;
      let max = 0;
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        if (gray < min) min = gray;
        if (gray > max) max = gray;
      }

      // Stretch contrast and apply softer thresholding to avoid character breaking
      const range = max - min || 1;
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        let newValue = ((gray - min) / range) * 255;

        // Binarize cleanly but preserve character edge detail
       newValue = newValue > 130 ? 255 : 0;

        data[i] = newValue;
        data[i + 1] = newValue;
        data[i + 2] = newValue;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/*
=========================================
OCR NORMALIZATION
=========================================
*/

export const normalizeOCR = (text) => {
  // Return cleaned uppercase solid text without symbols or watermarks
  // DO NOT replace character confusions globally here, as doing so destroys valid State Codes (e.g. DL, GA, AS, OD)
  return text
    .toUpperCase()
    .replace(/\bIND\b/g, "")
    .replace(/IND/g, "")
    .replace(/INO/g, "")
    .replace(/ND/g, "")
    .replace(/[^A-Z0-9]/g, "");
};

/*
=========================================
OCR EXECUTION
=========================================
*/

export const runOCR = async (image) => {
  try {

    const modes = [7, 6, 11, 13];

    let bestText = "";
    let bestConfidence = -1;

    for (const mode of modes) {

      const result = await Tesseract.recognize(image, "eng", {
        logger: m => {
          if (m.status === "recognizing text") {
            console.log(`Mode ${mode}`, Math.floor(m.progress * 100));
          }
        },

        tessedit_pageseg_mode: mode,

        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",

      });

      const text = normalizeOCR(result.data.text);

      console.log(
        "Mode:",
        mode,
        "Text:",
        text,
        "Confidence:",
        result.data.confidence
      );

      if (
        result.data.confidence > bestConfidence &&
        text.length >= 8 &&
        text.length <= 11
      ) {
        bestConfidence = result.data.confidence;
        bestText = text;
      }

    }

    console.log("Selected OCR:", bestText);

    return bestText;

  } catch (err) {

    console.error(err);

    return "";

  }
};

/*
=========================================
STATE CODES
=========================================
*/

export const stateCodes = [
  "AP", "AR", "AS", "BR", "CG", "CH",
  "DN", "DD", "DL", "GA", "GJ", "HR",
  "HP", "JK", "JH", "KA", "KL", "LA",
  "LD", "MP", "MH", "MN", "ML", "MZ",
  "NL", "OD", "PY", "PB", "RJ", "SK",
  "TN", "TS", "TR", "UP", "UK", "UA",
  "WB"
];

/*
=========================================
OCR HELPERS
=========================================
*/

const toLetters = (text = "") => {
  return text
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/2/g, "Z")
    .replace(/4/g, "A")
    .replace(/5/g, "S")
    .replace(/6/g, "G")
    .replace(/8/g, "B");
};

const toDigits = (text = "") => {
  return text
    .replace(/O/g, "0")
    .replace(/Q/g, "0")
    .replace(/D/g, "0")
    .replace(/I/g, "1")
    .replace(/L/g, "1")
    .replace(/Z/g, "2")
    .replace(/S/g, "5")
    .replace(/G/g, "6")
    .replace(/B/g, "8");
};

/*
=========================================
VEHICLE NUMBER PARSER
=========================================
*/

export const parseVehicleNumber = (ocrText = "") => {
  if (!ocrText) return "";
  ocrText = ocrText
  .replace(/\s/g, "")
  .replace(/\n/g, "")
  .toUpperCase();

console.log("Input:", ocrText);

const solid = normalizeOCR(ocrText);

console.log("Normalized:", solid);
  /*
  ----------------------------------
  A. BH SERIES (Bharat Series)
  Allowing character confusion (e.g. B/8, H/4/N/Y/M/K)
  Pattern: YY + BH + #### + XX
  ----------------------------------
  */
  const bhRegex = /([0-9A-Z]{2})([B8][H4NYMK])([0-9A-Z]{4})([A-Z0-9]{1,2})/;
  const bhMatch = solid.match(bhRegex);
  if (bhMatch) {
    const year = toDigits(bhMatch[1]);
    const code = "BH";
    const num = toDigits(bhMatch[3]);
    const series = toLetters(bhMatch[4]);
    if (year.match(/^\d{2}$/) && num.match(/^\d{4}$/)) {
      return `${year}-${code}-${num}-${series}`;
    }
  }

  /*
  ----------------------------------
  B. STANDARD 10-CHARACTER PLATES
  Pattern: State(2) + Dist(2) + Series(2) + Num(4)
  ----------------------------------
  */
  // Strict Pass (Validating against strict Indian State codes list)
  for (let i = 0; i <= solid.length - 10; i++) {
    const part = solid.substring(i, i + 10);
    const state = toLetters(part.substring(0, 2));

    if (!stateCodes.includes(state)) continue;

    const district = toDigits(part.substring(2, 4));
    const series = toLetters(part.substring(4, 6));
    const number = toDigits(part.substring(6, 10));

    if (
      /^\d{2}$/.test(district) &&
      /^[A-Z]{2}$/.test(series) &&
      /^\d{4}$/.test(number)
    ) {
      return `${state}-${district}-${series}-${number}`;
    }
  }

  /*
  ----------------------------------
  C. STANDARD 9-CHARACTER PLATES
  Pattern: State(2) + Dist(2) + Series(1) + Num(4)
  ----------------------------------
  */
  // Strict Pass (Validating against strict Indian State codes list)
  for (let i = 0; i <= solid.length - 9; i++) {
    const part = solid.substring(i, i + 9);
    const state = toLetters(part.substring(0, 2));

    if (!stateCodes.includes(state)) continue;

    const district = toDigits(part.substring(2, 4));
    const series = toLetters(part.substring(4, 5));
    // const number = toDigits(part.substring(5));
const number = toDigits(part.substring(5));

if (!/^\d{4,5}$/.test(number))
    continue;
    if (
      /^\d{2}$/.test(district) &&
      /^[A-Z]$/.test(series) &&
      /^\d{4}$/.test(number)
    ) {
      return `${state}-${district}-${series}-${number}`;
    }
  }

  /*
  ----------------------------------
  D. STANDARD 8-CHARACTER PLATES
  Pattern: State(2) + Dist(2) + Num(4)
  ----------------------------------
  */
  // Strict Pass (Validating against strict Indian State codes list)
  for (let i = 0; i <= solid.length - 8; i++) {
    const part = solid.substring(i, i + 8);
    const state = toLetters(part.substring(0, 2));

    if (!stateCodes.includes(state)) continue;

    const district = toDigits(part.substring(2, 4));
    const number = toDigits(part.substring(4));

    if (/^\d{2}$/.test(district) && /^\d{4}$/.test(number)) {
      return `${state}-${district}-${number}`;
    }
  }

  /*
  ----------------------------------
  E. FLEXIBLE SCAN PASS (Allowing any 2 letters as state code)
  This catches plates where State code is slightly misread (e.g. MH read as NH)
  ----------------------------------
  */
  // Flexible 10-char
  for (let i = 0; i <= solid.length - 10; i++) {
    const part = solid.substring(i, i + 10);
    const state = toLetters(part.substring(0, 2));

    if (!/^[A-Z]{2}$/.test(state)) continue;

    const district = toDigits(part.substring(2, 4));
    const series = toLetters(part.substring(4, 6));
    const number = toDigits(part.substring(6, 10));

    if (
      /^\d{2}$/.test(district) &&
      /^[A-Z]{2}$/.test(series) &&
      /^\d{4}$/.test(number)
    ) {
      return `${state}-${district}-${series}-${number}`;
    }
  }

  // Flexible 9-char
  for (let i = 0; i <= solid.length - 9; i++) {
    const part = solid.substring(i, i + 9);
    const state = toLetters(part.substring(0, 2));

    if (!/^[A-Z]{2}$/.test(state)) continue;

    const district = toDigits(part.substring(2, 4));
    const series = toLetters(part.substring(4, 5));
    const number = toDigits(part.substring(5));

    if (
      /^\d{2}$/.test(district) &&
      /^[A-Z]$/.test(series) &&
      /^\d{4}$/.test(number)
    ) {
      return `${state}-${district}-${series}-${number}`;
    }
  }

  // Flexible 8-char
  for (let i = 0; i <= solid.length - 8; i++) {
    const part = solid.substring(i, i + 8);
    const state = toLetters(part.substring(0, 2));

    if (!/^[A-Z]{2}$/.test(state)) continue;

    const district = toDigits(part.substring(2, 4));
    const number = toDigits(part.substring(4));

    if (/^\d{2}$/.test(district) && /^\d{4}$/.test(number)) {
      return `${state}-${district}-${number}`;
    }
  }

  /*
  ----------------------------------
  F. GENERIC FALLBACK
  ----------------------------------
  */
  const generic = solid.match(/[A-Z0-9]{6,15}/);
  return generic ? generic[0] : "";
};