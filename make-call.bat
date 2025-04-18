@echo off
echo Making VAPI call...

curl -X POST ^
  https://api.vapi.ai/call ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer d1529b85-51d5-47c0-9332-a73d40f7d62b" ^
  -d "{\"type\":\"outboundPhoneCall\",\"assistantId\":\"cfaa163c-4a47-471b-a39e-95c12d0cb738\",\"phoneNumberId\":\"e65a9e6b-33b7-4711-ad21-90220048e38f\",\"customer\":{\"number\":\"+971565401583\"},\"name\":\"TestCall_%time:~0,2%%time:~3,2%%time:~6,2%\"}"

echo.
echo Call initiated. Check your phone.
pause
