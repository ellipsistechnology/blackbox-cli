echo
echo Creating IoT test service...

mkdir tmp
cd tmp

node ../../dist/index.js init \
    --name iot \
    --title "IoT Test Service" \
    --desc "IoT example with unique, index, id services and sub-service." \
    --summary "IoT example."

echo
echo Adding repository...
node ../../dist/index.js add repository --file ../datatypes.json

echo
echgo Adding datatype location...
# FIXME: The following should automatically add the datatype from the repository without --file.
node ../../dist/index.js add datatype \
    --name location

echo
echo Adding service location...
# TODO: --desc and/or --title should be saved to blackbox.json and used in service response.
node ../../dist/index.js add service \
    --name location \
    --title "Locations" \
    --desc "IoT supported buildings and locatoins." \
    --access id \
    --identifier name \
    --datatype location \
    --methods get,post,put,patch,delete

echo
echo Adding datatype iot-device from repository...
node ../../dist/index.js add datatype \
    --name iot-device

echo
echo Adding service device with path and index access...
node ../../dist/index.js add service \
    --name device \
    --path /location/# \
    --datatype iot-device \
    --access index

echo
echo Generating server, datatype, and service code...
node ../../dist/index.js generate server
node ../../dist/index.js generate datatype
node ../../dist/index.js generate service

echo
echo Adding service hello with unique access to the root...
node ../../dist/index.js add service \
    --name hello \
    --datatype string \
    --access unique \
    --methods get,post

node ../../dist/index.js generate service \
    --path /hello

node ../../dist/index.js generate server

echo
echo Testing extensions with add, list, and add test extension...

node ../../dist/index.js add extension --file ../testExtension.js
node ../../dist/index.js list extension
node ../../dist/index.js add test


# Add COM extension
# This will require connecting an Arduino with test firmware.
echo
echo Adding COM extension with a new service...

node ../../dist/index.js add extension -f ../../../bb-com-extension/bundle/index.js
node ../../dist/index.js add service -n comm -d string --access unique
node ../../dist/index.js generate service
node ../../dist/index.js generate server


echo
echo Testing COM extension:

node ../../dist/index.js add com-type -n com1 --baud 115200 --init-commands ":HELP" --init-responses "/TEST SERVICE/" -p "/comm"

node ../../dist/index.js add com-macro -p /comm --method get --commands "SYS:Q" --responses "/^System Cmd Received(.*[\n\r]+)*Cmd Finished$/"


echo
echo Testing metadata with UI hints and testing hyphenated service names...
node ../../dist/index.js add service \
    -n tabbed-service \
    -d string \
    --meta "{\"ui\":{\"subservice-display\":\"tabs\",\"auto-open-single\":\"true\",\"service-view\": { \"href\": \"http://localhost:5174/tabbed-service\" }}}"

node ../../dist/index.js generate service
node ../../dist/index.js generate server


echo
echo Installing dependencies...
npm i


echo
echo Setting up test system in generated server...

npm i jest supertest @types/jest @types/supertest --save-dev

mkdir src/test
cp ../e2e._test_.ts ./src/test/e2e.test.ts
cp ../jest.config.cjs ./jest.config.cjs

# add test script to package.json
node -e "let pkg=require('./package.json'); pkg.scripts.test='jest'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"


echo
echo Building server...

npm run build


echo
echo Test server generation complete.
cd ..