import chalk from 'chalk'

let verboseLogging = false
export function setVerboseLogging(v:boolean) {
  verboseLogging = v
}

const logger = (f:(s:string)=>string) => (str:string) => console.log(f(str))

const h1 = chalk.bold
const code = chalk.cyan
const error = chalk.redBright
const warn = chalk.yellow
const em = chalk.bold.green
const p = chalk.reset
const desc = chalk.green
const file = chalk.red
const q = chalk.cyan

const logh1 = logger(h1)
const logcode = logger(code)
const logem = logger(em)
const logp = logger(p)
const logerror = (message:string, err:any = undefined) => {
  logger(error)(message)
  if(verboseLogging && err)
    console.log(err)
}
const logwarn = logger(warn)
const logdesc = logger(desc)
const logfile = logger(file)
const logq = logger(q)

export {
  h1, code, em, p, error, desc, file, q, warn,
  logh1, logcode, logem, logp, logerror, logdesc, logfile, logq, logwarn
}
