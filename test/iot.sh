# TODO: update a service.

echo
echo Creating IoT test service...

mkdir tmp
cd tmp

node ../../dist/index.js init \
    --name iot \
    --title "IoT Test Service" \
    --desc "IoT example with unique, index, id services and sub-service."

echo
echo Adding repository...
node ../../dist/index.js add repository --file ../datatypes.json

echo
echgo Adding datatype location...
node ../../dist/index.js add datatype \
    --name location

echo
echo Adding service location...
# TODO: --desc and/or --title should be saved to blackbox.json and used in service response.
node ../../dist/index.js add service \
    --name location \
    --summary "Locations" \
    --desc "IoT supported buildings and locations." \
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

npm i -D bb-com-extension
node ../../dist/index.js add extension -p bb-com-extension
node ../../dist/index.js add service -n comm -d string --access unique -m get,post,delete
node ../../dist/index.js generate service
node ../../dist/index.js generate server


echo
echo Testing COM extension:

node ../../dist/index.js add com-type \
    -n com1 \
    --baud 9600 \
    --startup-delay 2000\
    --init-commands "INFO" \
    --init-responses "/MOCK\sDEVICE\sV\d+.?\d*[\n\r]+STATUS: OK[\n\r]+CMD DONE$/" -p "/comm"

node ../../dist/index.js add com-macro -n com1 -p /comm --method get --commands "GET DATA" --responses "/CMD DONE$/"
node ../../dist/index.js add com-macro -n com1 -p /comm --method post --commands "SET DATA {data}" --responses "/CMD DONE$/"
node ../../dist/index.js add com-macro -n com1 -p /comm --method delete --commands "DEL DATA;Y" --responses "/Are you sure\? \(Y\/N\)$/;/CMD DONE$/"
# TODO: Test timeout and return to background with invalid command with no response.
node ../../dist/index.js generate com-utils

# FIXME: hyphens don't work in swagger-tools-oas3. Replace hyphens.
echo
echo Testing metadata with UI hints and testing hyphenated service names...
node ../../dist/index.js add service \
    -n tabbed-service \
    -d string \
    --meta "{\"ui\":{\"subservice-display\":\"tabs\",\"auto-open-single\":\"true\"}}"

node ../../dist/index.js add service \
    -n tabbed-sub1 \
    -d string \
    -p /tabbed-service/# \
    --meta "{\"ui\":{\"service-view\": { \"href\": \"http://localhost:5174/custom\" }}}"

node ../../dist/index.js add service \
    -n tabbed-sub2 \
    -d string \
    -p /tabbed-service/# \
    --meta "{\"ui\":{\"service-view\": { \"href\": \"http://localhost:5174/custom\" }}}"

node ../../dist/index.js add service \
    -n tabbed-sub3 \
    -d string \
    -p /tabbed-service/# \
    --meta "{\"ui\":{\"service-view\": { \"href\": \"http://localhost:5174/custom\" }}}"

node ../../dist/index.js generate service
node ../../dist/index.js generate server


echo
echo Installing dependencies...
npm i


echo
echo Setting up test system in generated server...

npm i jest ts-jest supertest @types/jest @types/supertest --save-dev

mkdir src/test
cp ../e2e._test_.ts ./src/test/e2e.test.ts
cp ../jest.config.cjs ./jest.config.cjs

# Modify the generated services to add test code from the service templates:
node ../TSCodeModifier.cjs ../LocationService.ts ./src/LocationService.ts
node ../TSCodeModifier.cjs ../HelloService.ts ./src/HelloService.ts
node ../TSCodeModifier.cjs ../DeviceService.ts ./src/DeviceService.ts
node ../TSCodeModifier.cjs ../TabbedServiceService.ts ./src/TabbedServiceService.ts
node ../TSCodeModifier.cjs ../TabbedSub1Service.ts ./src/TabbedSub1Service.ts
node ../TSCodeModifier.cjs ../TabbedSub2Service.ts ./src/TabbedSub2Service.ts
node ../TSCodeModifier.cjs ../TabbedSub3Service.ts ./src/TabbedSub3Service.ts

# The com extension service code is more complex and requires additional modifications, so we'll just copy the modified file directly instead of using the code modifier:
cp ../CommService.ts ./src/CommService.ts

# add test script to package.json
node -e "let pkg=require('./package.json'); pkg.scripts.test='node --experimental-vm-modules node_modules/jest/bin/jest.js'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"


echo
echo Building server...
npm run build

echo
echo Running tests...
npm run test

# TODO: Test updating a service.