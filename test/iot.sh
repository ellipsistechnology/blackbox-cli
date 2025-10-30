mkdir iot
cd iot

node ../../dist/index.js init \
    --name iot \
    --title "IoT Test Service" \
    --desc "IoT example with unique, index, id services and sub-service." \
    --summary "IoT example."

echo Adding repository...
node ../../dist/index.js add repository --file ../datatypes.json

# FIXME: The following should automatically add the datatype from the repository without --file.
node ../../dist/index.js add datatype \
    --name location

# TODO: --desc and/or --title should be saved to blackbox.json and used in service response.
node ../../dist/index.js add service \
    --name location \
    --title "Locations" \
    --desc "IoT supported buildings and locatoins." \
    --access id \
    --identifier name \
    --datatype location \
    --methods get,post,put,patch,delete

node ../../dist/index.js add datatype \
    --name iot-device

node ../../dist/index.js add service \
    --name device \
    --path /location/# \
    --datatype iot-device \
    --access index

node ../../dist/index.js generate server

node ../../dist/index.js generate datatype

node ../../dist/index.js generate service

node ../../dist/index.js add service \
    --name hello \
    --datatype string \
    --access unique \
    --methods get,post

node ../../dist/index.js generate service \
    --path /hello

node ../../dist/index.js generate server

node ../../dist/index.js add extension --file ../testExtension.js

node ../../dist/index.js list extension

node ../../dist/index.js add test


# Add COM extension
# This will require connecting an Arduino with test firmware.

node ../../dist/index.js add extension -f ../../../bb-com-extension/dist/index.js

node ../../dist/index.js add service -n comm -d string --access unique

node ../../dist/index.js generate service

node ../../dist/index.js generate server

node ../../dist/index.js add com-type -n com1 --baud 115200 --init-commands ":HELP" --init-responses "/TEST SERVICE/" -p "/comm"

node ../../dist/index.js add com-macro -p /comm --method get --commands "SYS:Q" --responses "/^System Cmd Received(.*[\n\r]+)*Cmd Finished$/"

cd ..