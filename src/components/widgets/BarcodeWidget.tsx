import { BarcodeGenerator } from "@/components/BarcodeGenerator";

export const BarcodeWidget = () => {
  return (
    <BarcodeGenerator
      onGenerate={(code, type) => {
        console.log('Generated barcode:', code, type);
      }}
    />
  );
};