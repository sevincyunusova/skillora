import { common, type Dict } from './common'
import { landing } from './landing'
import { hr } from './hr'
import { candidate } from './candidate'

export const dict: Dict = { ...common, ...landing, ...hr, ...candidate }
