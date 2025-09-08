@echo off
echo Making VAPI call with fixed format...

set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

curl --tlsv1.2 -X POST ^
  https://api.vapi.ai/call ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer d1529b85-51d5-47c0-9332-a73d40f7d62b" ^
  -d "{\"assistant_id\":\"cfaa163c-4a47-471b-a39e-95c12d0cb738\",\"org_id\":\"8ddf2438-8b84-42c2-973c-4b7a69272a99\",\"to\":\"+971565401583\",\"phone_number_id\":\"e65a9e6b-33b7-4711-ad21-90220048e38f\",\"name\":\"TestCall_%TIMESTAMP%\"}"

echo.
echo Call initiated. Check your phone.
pause
