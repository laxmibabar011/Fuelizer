// POS Module Exports
export { default as POSInterface } from "./POSInterface";
export { default as ResponsivePOSLayout } from "./components/ResponsivePOSLayout";
export { default as ProductPanel } from "./components/ProductPanel";
export { default as TransactionPanel } from "./components/TransactionPanel";
export { default as ControlPanel } from "./components/ControlPanel";
export { default as AttendantSelector } from "./components/AttendantSelector";
export { default as POSHeader } from "./components/POSHeader";

// Hooks
export { usePOSState } from "./hooks/usePOSState";
export { usePOSCalculations } from "./hooks/usePOSCalculations";
export { useFullscreen } from "./hooks/useFullscreen";

// Types
export type {
  POSState,
  AttendantOption,
  ProductInfo,
  TransactionData,
} from "./types";
