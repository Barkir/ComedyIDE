// src/theme.ts
import { extendTheme } from "@chakra-ui/react";

const oldschoolTheme = extendTheme({
  fonts: {
    body: "'Courier New', monospace",
    heading: "'Courier New', monospace",
  },
  colors: {
    oldschool: {
      bg: "#000000",     // чёрный фон
      text: "#00FF00",   // неоново-зелёный текст (как в терминале)
      accent: "#008000", // тёмно-зелёный для кнопок
      border: "#005500",
    },
  },
  styles: {
    global: {
      body: {
        bg: "#000000",
        color: "#00FF00",
        fontFamily: "'Courier New', monospace",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "normal",
        fontFamily: "'Courier New', monospace",
        textTransform: "uppercase",
        letterSpacing: "1px",
      },
      variants: {
        solid: {
          bg: "oldschool.accent",
          color: "black",
          _hover: { bg: "#00AA00" },
          _active: { bg: "#006600" },
        },
      },
    },
    Text: {
      baseStyle: {
        fontFamily: "'Courier New', monospace",
      },
    },
  },
});

export default oldschoolTheme;
