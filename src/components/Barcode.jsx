import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function Barcode({ value, width = 1, height = 24 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue: false,
        background: 'transparent',
        margin: 0,
      });
    }
  }, [value, width, height]);

  return <svg ref={svgRef} className="inline-block" />;
}
