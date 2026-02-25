import supertest from "supertest"
import {InitServer} from "../../index.js"
import { log } from "node:console"

const initServer = new InitServer()
await initServer.init(false)

async function firstLocation(app: any) {
    const listResponse = await supertest(app)
        .get(`/location`)
        .expect(200)
    expect(listResponse.body).toBeInstanceOf(Array)
    const locationToUpdate = listResponse.body[0]
    return locationToUpdate
}

describe('Root service', () => {
    describe('GET root', () => {
        it('should return 200 with correct response body', async () => {
            const response = await supertest(initServer.getApp())
                .get('/')
                .expect(200);

            expect(response.body).toHaveProperty('services');
            expect(response.body.services).toBeInstanceOf(Array);
            expect(response.body.services).toContainEqual({ name: 'location', href: '/location' })
            expect(response.body.services).toContainEqual({ name: 'hello', href: '/hello' })
            expect(response.body.services).toContainEqual({ name: 'comm', href: '/comm' })
            expect(response.body.services).toContainEqual({ name: 'tabbed-service', href: '/tabbed-service' })
        })
    })

    describe('OPTIONS root', () => {
        it('should return 204 or 200 with correct CORS headers', async () => {
            const response = await supertest(initServer.getApp())
                .options('/')
                .expect(res => {
                    if (res.status !== 204 && res.status !== 200) {
                        throw new Error(`Expected status 204 or 200, but got ${res.status}`);
                    }
                })

            expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
            expect(response.headers).toHaveProperty('access-control-allow-headers', 'Allow, Content-Type, Authorization');
            expect(response.headers).toHaveProperty('access-control-expose-headers', 'Allow, Content-Type, Authorization');

            // Allowed methods must only include GET and OPTIONS and not others:
            const allowHeader = response.headers['allow'] || response.headers['Allow'];
            expect(allowHeader).toBeDefined();
            const allowedMethods = allowHeader.split(',').map((method: string) => method.trim().toUpperCase());
            expect(allowedMethods).toContain('GET');
            expect(allowedMethods).toContain('OPTIONS');
            expect(allowedMethods).not.toContain('POST');
            expect(allowedMethods).not.toContain('PUT');
            expect(allowedMethods).not.toContain('DELETE');
            expect(allowedMethods).not.toContain('PATCH');
        })
    })
})

describe('Hello Service', () => {
    describe('GET /hello', () => {
        it('should return 200 with correct response body', async () => {
            const response = await supertest(initServer.getApp())
                .get('/hello')
                .expect(200);

            expect(response.body).toEqual('Hello, World!');
        })
    })

    describe('OPTIONS /hello', () => {
        it('should return 204 or 200 with correct CORS headers', async () => {
            const response = await supertest(initServer.getApp())
                .options('/hello')
                .expect(res => {
                    if (res.status !== 204 && res.status !== 200) {
                        throw new Error(`Expected status 204 or 200, but got ${res.status}`);
                    }
                })

            expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
            expect(response.headers).toHaveProperty('access-control-allow-headers', 'Allow, Content-Type, Authorization');
            expect(response.headers).toHaveProperty('access-control-expose-headers', 'Allow, Content-Type, Authorization');

            // Allowed methods must only include GET and OPTIONS and not others:
            const allowHeader = response.headers['allow'] || response.headers['Allow'];
            expect(allowHeader).toBeDefined();
            const allowedMethods = allowHeader.split(',').map((method: string) => method.trim().toUpperCase());
            expect(allowedMethods).toContain('GET');
            expect(allowedMethods).toContain('OPTIONS');
            expect(allowedMethods).toContain('POST');
            expect(allowedMethods).not.toContain('PUT');
            expect(allowedMethods).not.toContain('DELETE');
            expect(allowedMethods).not.toContain('PATCH');
        })
    })

    describe('POST /hello', () => {
        it('should update the message and return 204', async () => {
            const newMessage = 'Hello, IoT!';

            const response = await supertest(initServer.getApp())
                .post('/hello')
                .set('Content-Type', 'text/plain')
                .send(newMessage)
                .expect(200);

            // Check that the message is updated:
            const getResponse = await supertest(initServer.getApp())
                .get('/hello')
                .expect(200);

            expect(getResponse.body).toEqual(newMessage);
        })
    })
})

describe('Location Service', () => {
    describe('GET /location', () => {
        it('should return 200 with correct response body', async () => {
            const response = await supertest(initServer.getApp())
                .get('/location')
                .expect(200);

            // Should return an array of dummy data:
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
            response.body.forEach((item: any) => {
                expect(item).toHaveProperty('name');
                expect(item).toHaveProperty('address');
                expect(typeof item.name).toBe('string');
                expect(typeof item.address).toBe('string');
            })
        })
        it('should return metadata when requested with the meta query parameter', async () => {
            const response = await supertest(initServer.getApp())
                .get('/location?meta')
                .expect(200);

            // Should return an object with data and meta properties:
            /**
             {
                "name": "location",
                "summary": "Operations on location",
                "description": "IoT supported buildings and locatoins.",
                "href": "/location",
                "type": {
                    "format": "oas3",
                    "schema": {
                        "href": "/api-specifications.yaml#/components/schemas/location"
                    }
                },
                "access": "id",
                "identifier": "name"
             }
             */
            expect(response.body).toHaveProperty('name', 'location');
            expect(response.body).toHaveProperty('summary', 'Locations');
            expect(response.body).toHaveProperty('description', 'IoT supported buildings and locations.');
            expect(response.body).toHaveProperty('href', '/location');
            expect(response.body).toHaveProperty('type');
            expect(response.body.type).toHaveProperty('format', 'oas3');
            expect(response.body.type).toHaveProperty('schema');
            expect(response.body.type.schema).toHaveProperty('href', '/api-specifications.yaml#/components/schemas/location');
            expect(response.body).toHaveProperty('access', 'id');
            expect(response.body).toHaveProperty('identifier', 'name');
        })
    })

    describe('OPTIONS /location', () => {
        it('should return 204 or 200 with correct CORS headers', async () => {
            const response = await supertest(initServer.getApp())
                .options('/location')
                .expect(res => {
                    if (res.status !== 204 && res.status !== 200) {
                        throw new Error(`Expected status 204 or 200, but got ${res.status}`);
                    }
                })

            expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
            expect(response.headers).toHaveProperty('access-control-allow-headers', 'Allow, Content-Type, Authorization');
            expect(response.headers).toHaveProperty('access-control-expose-headers', 'Allow, Content-Type, Authorization');

            // Allowed methods must only include GET and OPTIONS and not others:
            const allowHeader = response.headers['allow'] || response.headers['Allow'];
            expect(allowHeader).toBeDefined();
            const allowedMethods = allowHeader.split(',').map((method: string) => method.trim().toUpperCase());
            expect(allowedMethods).toContain('GET');
            expect(allowedMethods).toContain('OPTIONS');
            expect(allowedMethods).toContain('POST');
            expect(allowedMethods).not.toContain('PUT');
            expect(allowedMethods).not.toContain('DELETE');
            expect(allowedMethods).not.toContain('PATCH');
        })
    })

    describe('POST /location', () => {
        it('should create a new location and return 201', async () => {
            const newLocation = {
                name: 'New Location',
                address: '123 Main St'
            };

            const response = await supertest(initServer.getApp())
                .post('/location')
                .send(newLocation)
                .expect(201);

            // Should return the name of the created location:
            expect(response.body).toHaveProperty('name', newLocation.name);

            // Check that the location is included in the list of locations:
            const listResponse = await supertest(initServer.getApp())
                .get('/location')
                .expect(200);

            expect(listResponse.body).toBeInstanceOf(Array);
            expect(listResponse.body).toContainEqual(newLocation);
        })
    })

    describe('GET /location/{locationname}', () => {
        it('should return 200 with correct response body', async () => {
            const locationName = 'New Location';
            
            const response = await supertest(initServer.getApp())
                .get(`/location/${encodeURIComponent(locationName)}`)
                .expect(200);
            
            // Should return the location details:
            expect(response.body).toHaveProperty('name', locationName);
            expect(response.body).toHaveProperty('address', '123 Main St');
        })
    })

    describe('OPTIONS /location/{locationname}', () => {
        it('should return 204 or 200 with correct CORS headers', async () => {
            const locationName = 'New Location';
            
            const response = await supertest(initServer.getApp())
                .options(`/location/${encodeURIComponent(locationName)}`)
                .expect(res => {
                    if (res.status !== 204 && res.status !== 200) {
                        throw new Error(`Expected status 204 or 200, but got ${res.status}`);
                    }
                })

            expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
            expect(response.headers).toHaveProperty('access-control-allow-headers', 'Allow, Content-Type, Authorization');
            expect(response.headers).toHaveProperty('access-control-expose-headers', 'Allow, Content-Type, Authorization');

            // Allowed methods must only include GET, POST, PUT, PATCH, DELETE and OPTIONS:
            const allowHeader = response.headers['allow'] || response.headers['Allow'];
            expect(allowHeader).toBeDefined();
            const allowedMethods = allowHeader.split(',').map((method: string) => method.trim().toUpperCase());
            expect(allowedMethods).toContain('GET');
            expect(allowedMethods).not.toContain('POST');
            expect(allowedMethods).toContain('PUT');
            expect(allowedMethods).toContain('PATCH');
            expect(allowedMethods).toContain('DELETE');
            expect(allowedMethods).toContain('OPTIONS');
        })
    })
    
    describe('PUT /location/{locationname}', () => {
        it('should update the location and return 200', async () => {
            const updatedData = {
                name: 'Updated Location',
                address: '456 Elm St'
            };

            const app = initServer.getApp();

            // Get a location to update:
            const locationToUpdate = await firstLocation(app)

            const response = await supertest(app)
                .put(`/location/${encodeURIComponent(locationToUpdate.name)}`)
                .send(updatedData)
                .expect(204);

            // Check that the location details are updated:
            const getResponse = await supertest(app)
                .get(`/location/${encodeURIComponent(updatedData.name)}`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('name', updatedData.name);
            expect(getResponse.body).toHaveProperty('address', updatedData.address);
        })
    })

    describe('PATCH /location/{locationname}', () => {
        it('should partially update the location and return 200', async () => {
            const partialUpdate = {
                address: '789 Oak St'
            };

            const app = initServer.getApp();
            const locationToUpdate = await firstLocation(app)

            const response = await supertest(app)
                .patch(`/location/${encodeURIComponent(locationToUpdate.name)}`)
                .send(partialUpdate)
                .expect(204);

            // Check that the location details are updated:
            const getResponse = await supertest(app)
                .get(`/location/${encodeURIComponent(locationToUpdate.name)}`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('name', locationToUpdate.name); // name should remain unchanged
            expect(getResponse.body).toHaveProperty('address', partialUpdate.address); // address should be updated
        })
    })

    describe('DELETE /location/{locationname}', () => {
        it('should delete the location and return 204', async () => {
            const app = initServer.getApp();

            const locationToDelete = await firstLocation(app)

            const response = await supertest(app)
                .delete(`/location/${encodeURIComponent(locationToDelete.name)}`)
                .expect(204);

            // Check that the location is deleted:
            await supertest(app)
                .get(`/location/${encodeURIComponent(locationToDelete.name)}`)
                .expect(404);
        })
    })
})

describe('Device Service', () => {
    describe('GET /location/{locationname}/device', () => {
        it('should return 200 with correct response body', async () => {
            const app = initServer.getApp()
            const location = await firstLocation(app)

            const response = await supertest(app)
                .get(`/location/${encodeURIComponent(location.name)}/device`)
                .expect(200);

            // Should return an array of dummy data:
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
            response.body.forEach((item: any) => {
                expect(item).toHaveProperty('type');
                expect(typeof item.type).toBe('string');
                expect(item).toHaveProperty('state');
                expect(typeof item.state).toBe('string');
            })
        })
    })

    describe('OPTIONS /location/{locationname}/device', () => {
        it('should return 204 or 200 with correct CORS headers', async () => {
            const app = initServer.getApp()
            const location = await firstLocation(app)

            const response = await supertest(app)
                .options(`/location/${encodeURIComponent(location.name)}/device`)
                .expect(res => {
                    if (res.status !== 204 && res.status !== 200) {
                        throw new Error(`Expected status 204 or 200, but got ${res.status}`);
                    }
                })

            expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
            expect(response.headers).toHaveProperty('access-control-allow-headers', 'Allow, Content-Type, Authorization');
            expect(response.headers).toHaveProperty('access-control-expose-headers', 'Allow, Content-Type, Authorization');

            // Allowed methods must only include GET and OPTIONS and not others:
            const allowHeader = response.headers['allow'] || response.headers['Allow'];
            expect(allowHeader).toBeDefined();
            const allowedMethods = allowHeader.split(',').map((method: string) => method.trim().toUpperCase());
            expect(allowedMethods).toContain('GET');
            expect(allowedMethods).toContain('OPTIONS');
            expect(allowedMethods).toContain('POST');
            expect(allowedMethods).not.toContain('PUT');
            expect(allowedMethods).not.toContain('DELETE');
            expect(allowedMethods).not.toContain('PATCH');
        })
    })

    describe('POST /location/{locationname}/device', () => {
        it('should create a new device and return 201', async () => {
            const app = initServer.getApp()
            const location = await firstLocation(app)

            const newDevice = {
                type: 'New Device',
                state: 'off'
            };

            const response = await supertest(app)
                .post(`/location/${encodeURIComponent(location.name)}/device`)
                .send(newDevice)
                .expect(201);

            // The response should include the index of the created device:
            expect(response.body).toHaveProperty('index');
            expect(typeof response.body.index).toBe('number');

            // Check that the device is included in the list of devices for the location:
            const listResponse = await supertest(app)
                .get(`/location/${encodeURIComponent(location.name)}/device`)
                .expect(200);

            expect(listResponse.body).toBeInstanceOf(Array);
            expect(listResponse.body).toContainEqual(newDevice);
        })
    })

    describe('GET /location/{locationname}/device/{deviceindex}', () => {
        it('should return 200 with correct response body', async () => {
            const app = initServer.getApp()
            const location = await firstLocation(app)

            // Get the list of devices for the location:
            const listResponse = await supertest(app)
                .get(`/location/${encodeURIComponent(location.name)}/device`)
                .expect(200);

            expect(listResponse.body).toBeInstanceOf(Array);
            expect(listResponse.body.length).toBeGreaterThan(0);
            const device = listResponse.body[0];

            const response = await supertest(app)
                .get(`/location/${encodeURIComponent(location.name)}/device/0`)
                .expect(200);

            // Should return the device details:
            expect(response.body).toHaveProperty('type', device.type);
            expect(response.body).toHaveProperty('state', device.state);
        })
    })

    describe('OPTIONS /location/{locationname}/device/{deviceindex}', () => {
        it('should return 204 or 200 with correct CORS headers', async () => {
            const app = initServer.getApp()
            const location = await firstLocation(app)

            const response = await supertest(app)
                .options(`/location/${encodeURIComponent(location.name)}/device/0`)
                .expect(res => {
                    if (res.status !== 204 && res.status !== 200) {
                        throw new Error(`Expected status 204 or 200, but got ${res.status}`);
                    }
                })
                
            expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
            expect(response.headers).toHaveProperty('access-control-allow-headers', 'Allow, Content-Type, Authorization');
            expect(response.headers).toHaveProperty('access-control-expose-headers', 'Allow, Content-Type, Authorization');

            // Allowed methods must only include GET and OPTIONS and not others:
            const allowHeader = response.headers['allow'] || response.headers['Allow'];
            expect(allowHeader).toBeDefined();
            const allowedMethods = allowHeader.split(',').map((method: string) => method.trim().toUpperCase());
            expect(allowedMethods).toContain('GET');
            expect(allowedMethods).toContain('OPTIONS');
            expect(allowedMethods).not.toContain('POST');
            expect(allowedMethods).toContain('PUT');
            expect(allowedMethods).toContain('DELETE');
            expect(allowedMethods).toContain('PATCH');
        })
    })

    describe('PUT /location/{locationname}/device/{deviceindex}', () => {
        it('should update the device and return 200', async () => {
            const app = initServer.getApp()
            const location = await firstLocation(app)

            const updatedData = {
                type: 'Updated Device',
                state: 'on'
            };

            const response = await supertest(app)
                .put(`/location/${encodeURIComponent(location.name)}/device/0`)
                .send(updatedData)
                .expect(204);

            // Check that the device details are updated:
            const getResponse = await supertest(app)
                .get(`/location/${encodeURIComponent(location.name)}/device/0`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('type', updatedData.type);
            expect(getResponse.body).toHaveProperty('state', updatedData.state);
        })
    })
    
    describe('PATCH /location/{locationname}/device/{deviceindex}', () => {
        it('should partially update the device and return 200', async () => {
            const app = initServer.getApp()
            const location = await firstLocation(app)

            const partialUpdate = {
                state: 'off'
            };

            const response = await supertest(app)
                .patch(`/location/${encodeURIComponent(location.name)}/device/0`)
                .send(partialUpdate)
                .expect(204);

            // Check that the device details are updated:
            const getResponse = await supertest(app)
                .get(`/location/${encodeURIComponent(location.name)}/device/0`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('type'); // type should remain unchanged
            expect(getResponse.body).toHaveProperty('state', partialUpdate.state); // state should be updated
        })
    })

    describe('DELETE /location/{locationname}/device/{deviceindex}', () => {
        it('should delete the device and return 204', async () => {
            const app = initServer.getApp()
            const location = await firstLocation(app)

            // Get the device for later reference:
            const listResponse = await supertest(app)
                .get(`/location/${encodeURIComponent(location.name)}/device/0`)
                .expect(200);
            const device = listResponse.body;

            const response = await supertest(app)
                .delete(`/location/${encodeURIComponent(location.name)}/device/0`)
                .expect(204);

            // Check that the device is deleted:
            const deviceListResponse = await supertest(app)
                .get(`/location/${encodeURIComponent(location.name)}/device`)
                .expect(200);
            const devices = deviceListResponse.body;
            expect(devices).toBeInstanceOf(Array);
            expect(devices).not.toContainEqual(device);
        })
    })
})


