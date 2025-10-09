#!/usr/bin/env node

import CliApplication from './src/CliApplication.js'

async function main() {
  try {
    const app = new CliApplication(process.argv)
    await app.run()
    
  }
  catch(err) {
    if (typeof (err) === 'string') {
        console.error(err)
    }
    else if (err instanceof Error) {
      console.error(err.message)
    }
    else {
      console.log(err)
    }
  }
}

main()
