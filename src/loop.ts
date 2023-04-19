import mariadb from 'mariadb'
import fetch, { FetchParameters } from './fetch'
import { Api } from 'livecoinwatch-api'
import sleep from './sleep'

const MILILSECONDS = 1
const SECONDS = 1000 * MILILSECONDS
const MINUTES = 60 * SECONDS
const HOURS = 60 * MINUTES
const DAYS = 24 * HOURS

const coins = ['ETH', 'BTC', 'KAS', 'NEXA']

export default async function loop() {
	if (process.env.LIVECOINWATCH_API_TOKEN === undefined)
		throw new Error(`process.env.LIVECOINWATCH_API_TOKEN === undefined`)

	const api = new Api(process.env.LIVECOINWATCH_API_TOKEN)

	let interval = 0

	let pool: mariadb.Pool
	let connection: mariadb.PoolConnection

	while (true) {
		if (interval > 0) {
			console.log(`Sleeping for ${Math.floor(interval / MINUTES)} minutes`)

			await sleep(interval)

			console.log(`Sleeping done`)
		}

		try {
			pool = mariadb.createPool({
				host: process.env.DB_HOST,
				port: Number(process.env.DB_PORT),
				user: process.env.DB_USER,
				password: process.env.DB_PASS,
				database: process.env.DB_DATA
			})
		} catch (error) {
			console.error('Pool creation error')
			console.error(error)

			interval = 1 * MINUTES

			continue
		}

		try {
			connection = await pool.getConnection()
		} catch (error) {
			console.error('Connection creation error')
			console.error(error)

			interval = 1 * MINUTES

			continue
		}

		const timestamp = new Date().toISOString().split('T')[0]

		const parameters: FetchParameters = {
			timestamp,
			database: connection,
			api,
			options: {
				codes: coins,
			},
		}

		try {
			await fetch(parameters)
		} catch (error) {
			console.error('Error: fetch')
			console.error(error)

			interval = 10 * MINUTES

			continue
		}

		console.log(`Run successful, going to sleep`)

		interval = 8 * HOURS

		try {
			await connection.end()
			await pool.end()
		} catch (error) {
			console.error('Disconnect error')
			console.error(error)
		}

	}
}
