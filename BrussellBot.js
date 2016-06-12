var reload			= require('require-reload')(require),
	bot				= require('discord.js').Client({autoReconnect: true, forceFetchUsers: true, maxCachedMessages: 100, disableEveryone: true}),
	_chalk			= require('chalk'),
	chalk			= _chalk.constructor({enabled: true}),
	config			= reload('./config.json'),
	validateConfig	= reload('./utils/validateConfig.js'),
	CommandManager	= reload('./utils/CommandManager.js');

var events = {
	ready: reload(`${__dirname}/events/ready.js`),
	message: reload(`${__dirname}/events/message.js`)
};

//console colors
cWarn	= chalk.bgYellow.black;
cError	= chalk.bgRed.black;
cDebug	= chalk.bgWhite.black;
cGreen	= chalk.bold.green;
cRed	= chalk.bold.red;

commandsProcessed = 0;
cleverbotTimesUsed = 0;


validateConfig(config);

var CommandManagers = [];
for (let prefix in config.commandSets) { //Add command sets
	let newManager = new CommandManager(prefix, config.commandSets[prefix]); //If I add it directly eslint thinks I never use the class :/
	CommandManagers.push(newManager);
}


function init(index = 0) {
	return new Promise((resolve, reject) => {
		CommandManagers[index].initialize() //Load CommandManager at {index}
			.then(() => {
				index++;
				if (CommandManagers.length > index) { //If there are more to load
					init(index) //Loop through again
						.then(resolve)
						.catch(reject);
				} else //If that was the last one resolve
					resolve();
			}).catch(reject)
	});
}

function login() {
	console.log(cGreen('Logging in...'));
	bot.loginWithToken(config.token).catch(err => console.error(err));
}

//Load commands and log in
init()
	.then(login)
	.catch(error => {throw new Error(error)});


bot.on('ready', () => {
	events.ready(bot, config);
});

bot.on('disconnected', () => {
	console.log(cRed('Disconnected from Discord'));
});

bot.on('message', msg => {
	events.message.handler(bot, msg, CommandManagers, config);
});
