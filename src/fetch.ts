import type { PoolConnection } from 'mariadb'

import type { Api } from 'livecoinwatch-api'
import type { CoinsMap } from 'livecoinwatch-api/dist/coins'

export interface FetchParameters {
	timestamp: string
	database: PoolConnection
	api: Api
	options: CoinsMap.Parameters
}

export const wrap = (value: string) => '`' + value + '`'

export const table = 'livecoinwatch'
export const update = 'price'
export const keys = ['coin', 'price', 'timestamp']
export const values = Array(keys.length).fill('?')

export const sql_table = wrap(table)
export const sql_keys = keys.map(wrap).join(', ')
export const sql_values = values.join(', ')

export const sql = `INSERT INTO ${sql_table} (${sql_keys}) VALUES (${sql_values}) ON DUPLICATE KEY UPDATE ${update} = values(${update});`

export default async function fetch({ timestamp, database, api, options }: FetchParameters) {
	const rows = await api.coins.map(options)

	const data = rows
		.map(row => Object.values(row))
		.map(data => data.concat(timestamp))

	return database.batch(sql, data)
}
