@echo off
echo Making VAPI call with documentation format...

curl --tlsv1.2 -X POST ^
  https://api.vapi.ai/call ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer d1529b85-51d5-47c0-9332-a73d40f7d62b" ^
  -d "{\"assistant_id\":\"cfaa163c-4a47-471b-a39e-95c12d0cb738\",\"to\":\"+971565401583\",\"phone_number_id\":\"e65a9e6b-33b7-4711-ad21-90220048e38f\"}"

echo.
echo Call initiated. Check your phone.
pause
