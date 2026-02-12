import { ComMacro } from './ComMacro.js';

export class ComType {
  constructor(
    public name: string,
    public baud: number,
    public methods: {
      init: ComMacro[];
      [method: string]: ComMacro[];
    }
  ) { }

  toString() {
    return `ComType(name='${this.name}', baud=${this.baud})`
      + `[${Object.entries(this.methods).map(([m, macros]) => (
        `\n\t${m}: [${macros.map(cm => cm.toString()).join(', ')}]`
      )).join('')}\n]`;
  }
}
