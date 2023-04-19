import loop from "./loop";

loop()
	.then(() => console.log('Loop exited'))
	.catch((error) => console.error(error))
