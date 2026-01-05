
import { keyframes } from "@emotion/react"

export const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export const getPulseAnim = (color) => keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0px ${color}
  }
  50% {
    transform: scale(1.05);
    /* Внутреннее плотное свечение + внешнее мягкое облако */
    box-shadow: 0 0 15px 5px ${color}
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0px ${color}
`;

export const glowAnimation = keyframes`
  0% { box-shadow: 0 0 0 0px rgba(72, 187, 120, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
  100% { box-shadow: 0 0 0 0px rgba(72, 187, 120, 0); }
`;
