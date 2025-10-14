export default function (
  {name}:
  {
    name: string
  }
) {
  return `{
  "name": "${name}",
  "version": "0.0.0",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "nodemon --exec node --loader ts-node/esm index.ts",
    "build": "tsc && cp openapi.json dist/openapi.json",
    "start": "node dist/index.js"
  },
  "author": "Ellipsis",
  "license": "ISC",
  "description": "",
  "devDependencies": {
    "@types/connect": "^3.4.38",
    "@types/express": "^5.0.3",
    "@types/node": "^24.6.1",
    "nodemon": "^3.1.10",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  },
  "dependencies": {
    "ellipsis-ioc": "file:../../../ellipsis-ioc",
    "express": "^5.1.0",
    "glob": "^11.0.3",
    "swagger-tools-oas3": "^1.3.1"
  }
}`
}