export default interface Oas3schema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer'
  properties?: object
  items?: Oas3schema
  required?: string[]
}

