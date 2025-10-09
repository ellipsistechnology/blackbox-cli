import {logcode} from './logging.js'

const defaultFormat = (prefix:string, key:string, value:string) => `${prefix}${key} ${value}`

const fixWidth = (str:string, length:number):string => {
  const padding = length - str.length + 2
  return str + Array(padding).fill(' ').join('')
}

const maxLength = (strs:string[]) => (
  strs
    .map( (key:string) => key.length)
    .reduce( (accumulator, currentValue) => Math.max(accumulator, currentValue), 0 )
)

const printEnum = (Enum:any) => {
  const colWidth = maxLength(Object.keys(Enum))

  return (prefix:string, format = defaultFormat) => (
    Object.keys(Enum)
      .map( (key:string) => format(prefix, fixWidth(key, colWidth), Enum[key as keyof typeof Enum]) )
      .reduce( (accumulator, currentValue) => accumulator + currentValue + '\n', '' )
  )
}

const printList = (list:string[]) => {
  let col = 0
  let line = ''
  for (let item of list) {
    ++col
    line += item+"\t\t"
    if(col === 5) {
      logcode(line)
      line = ''
      col = 0
    }
  }
  if(line !== '')
    logcode(line)
}

export {printEnum, fixWidth, defaultFormat, maxLength, printList}
