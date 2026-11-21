import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Small QR code in the corner of the board screen, linking to the send-message page.
// Built from the current site address, so it also works on local/dev builds.
const BoardQR = () => {
  const [svg, setSvg] = useState('');
  const url = `${window.location.origin}/`;

  useEffect(() => {
    QRCode.toString(url, {
      type: 'svg',
      margin: 0,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f1513', light: '#e3efe8' },
    })
      .then(setSvg)
      .catch((err) => console.error('QR code failed:', err));
  }, [url]);

  if (!svg) return null;

  return (
    <div className="board-qr" aria-label={`Scan to post a message: ${url}`}>
      {/* SVG string generated locally by the qrcode library */}
      <div className="board-qr-code" dangerouslySetInnerHTML={{ __html: svg }} />
      <span className="board-qr-label">Scan to post</span>
    </div>
  );
};

export default BoardQR;
