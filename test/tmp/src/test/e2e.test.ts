import supertest from "supertest"
import {InitServer} from "../../index.js"

const initServer = new InitServer()
await initServer.init(false)

describe('End-to-end test', () => {
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
    })
})