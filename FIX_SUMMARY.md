# AuthNode OCR verification fix

## Files changed
- `frontend/src/pages/Verify/Verify.jsx`
  - Improved student-name extraction when OCR splits `INTERN NAME` across lines or inserts stray OCR glyphs.
  - Added handling for certificate IDs split across lines, including `TBI-2026-PTQU-` followed by `ID FZ45`.
  - Uses Tesseract sparse-text segmentation for the email screenshot and automatic page segmentation for the certificate.
- `README.md`
  - Added an explanation of the OCR fix and the distinction between OCR extraction and cryptographic verification.

## Regression check against the two supplied images
The OCR parser returned these values for both files:
- Student name: `Vanshika Chauhan`
- Certificate ID: `TBI-2026-PTQU-FZ45`

It correctly does **not** use the separate intern ID `TBI-26100255` as the certificate ID.

## Validation performed
- Backend Python files passed `compileall`.
- FastAPI application imported successfully and registered its routes.
- OCR parser functions were executed in Node against Tesseract OCR text from both supplied images; both name and certificate ID were extracted correctly.
- A full Vite production build was not completed in this environment because npm dependency installation did not finish.

## Important verification limitation
The OCR fix only solves reading and matching the two documents. The backend still checks the certificate against its authoritative AuthNode SQLite record, SHA-256 fingerprint and RSA signature. If this external TBI certificate has not been issued/registered in the AuthNode database, the correct result will be `not_found`; OCR must never mark an unregistered certificate as genuine.
