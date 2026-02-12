export default interface Service {
  name?: string
  summary?: string
  description?: string
  href?: string
  access?: 'index' | 'id' | 'unique'
  identifier?: string
  type?: object
}

