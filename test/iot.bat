cd ..
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
cd test
mkdir iot
cd iot

call ../bb.bat init ^
    --name iot ^
    --title "IoT Test Service" ^
    --desc "IoT example with unique, index, id services and sub-service." ^
    --summary "IoT example." ^

@echo Adding repository...
call ../bb.bat add repository --file ../datatypes.json

REM FIXME: The following should automatically add the datatype from the repository without --file.
call ../bb.bat add datatype ^
    --name location

REM TODO: --desc and/or --title should be saved to blackbox.json and used in service response.
call ../bb.bat add service ^
    --name location ^
    --title "Locations" ^
    --desc "IoT supported buildings and locatoins." ^
    --access id ^
    --identifier name ^
    --datatype location ^
    --methods get,post,put,patch,delete

call ../bb.bat add datatype ^
    --name iot-device

call ../bb.bat add service ^
    --name device ^
    --path /location/# ^
    --datatype iot-device ^
    --access index

call ../bb.bat generate server

call ../bb.bat generate datatype

call ../bb.bat generate service

call ../bb.bat add service ^
    --name hello ^
    --datatype string ^
    --access unique ^
    --methods get,post

call ../bb.bat generate service ^
    --path /hello

call ../bb.bat generate server

call ../bb.bat add extension --file ../testExtension.js

call ../bb.bat list extension

call ../bb.bat add test


REM Add COM extension
REM This will require connecting an Arduino with test firmware.

call ../bb.bat add extension -f ../../../bb-com-extension/dist/index.js

call  ../bb.bat add service -n comm -d string --access unique

call ../bb.bat generate service

call ../bb.bat generate server

call ../bb.bat add com-type -n com1 --baud 9600 --init ":HELP" --init-response "/TEST SERVICE/" -p "/comm"

call  ../bb.bat add com-macro -p /comm --method get --commands "SYS:Q" --responses /Status:.*\\nCmd\ Complete/

cd ..