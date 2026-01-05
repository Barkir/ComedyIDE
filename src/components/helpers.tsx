
export const smartParse = (rawContent) => {
  try {
    let clean = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

    const firstBrace = clean.search(/[\[\{]/);
    const lastBrace = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));

    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(clean);
  } catch (err) {
    console.error("sorry, not parsing.");
    console.log("rawData", rawContent);
    return null;
  }
};

export const getGlowColor = (score) => {
  if (score >= 7) return "#38A169"; // Аналог green.500
  if (score >= 5) return "#ECC94B"; // Аналог yellow.400
  if (score >= 0) return "#E53E3E"; // Аналог red.500
  return "#A0AEC0";                // Аналог gray.500
}

export const getStatusColor = (score) => {
  if (score >= 7) return "green.500";
  if (score >= 5) return "yellow.400";
  if (score >= 0) return "red.500";
  return "gray.500";
}
