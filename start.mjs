import blessed from "blessed";
import chalk from "chalk";
import { spawn } from "child_process";
import os from "os";
import moment from "moment";
import figlet from "figlet";

// Create a screen object.
const screen = blessed.screen({
	smartCSR: true,
	title: "Taurus Bot Console"
});

// Create a box that fills the entire screen.
const box = blessed.box({
	top: 0,
	left: 0,
	width: "39%",
	height: "100%",
	content: "",
	tags: true,
	border: {
		type: "line"
	},
	style: {
		fg: "white",
		bg: "black",
		border: {
			fg: "#ff0000" // Red
		}
	}
});
// 


// Create a console box at the top right.
const consoleBox = blessed.box({
	top: 0,
	right: 0,
	width: "80%",
	height: "100%",
	content: "{underline}Taurus Console{/underline}",
	tags: true,
	border: {
		type: "line"
	},
	style: {
		fg: "white",
		bg: "black",
		border: {
			fg: "#ff0000" // Red
		}
	}
});

// Append our boxes to the screen.
screen.append(box);
screen.append(consoleBox);

let bot = null;
let botStartTime = null;
let botStatus = "Offline";

// Function to start the Discord bot.
function startBot() {
	if (bot) {
		writeToConsole(chalk.red("Bot is already running. Please stop the bot first."));
		return;
	}

	//impl later, for git pull inside of application

	// Modify this line to start your bot with the correct command and arguments
	bot = spawn("node", ["bot.js"], {
		stdio: ["pipe", "pipe", "pipe", "pipe", "pipe", "pipe", process.stderr]
	});

	botStartTime = moment();
	botStatus = "Online";

	updateStats(); // Update the box content with system and bot stats

	bot.on("error", (err) => {
		writeToConsole(chalk.red(`Error starting bot: ${err.message}`));
	});

	// Pipe the bot's stdout and stderr to the console
	bot.stdout.on("data", (data) => {
		writeToConsole(data.toString());
	});

	bot.stderr.on("data", (data) => {
		writeToConsole(chalk.red(data.toString()));
	});
}

// Function to stop the Discord bot.
function stopBot() {
	if (!bot) {
		writeToConsole(chalk.red("Bot is not running. Please start the bot first."));
		return;
	}

	writeToConsole(chalk.red("Stopping bot..."));

	bot.kill();
	bot = null;
	botStartTime = null;
	botStatus = "Offline";

	setTimeout(() => {
		updateStats(); // Update the box content with system and bot stats after stopping the bot
	}, 1000);
}


// Function to restart the Discord bot.
function restartBot() {
    stopBot();
    const gitPull = spawn('git', ['pull']);

    gitPull.stdout.on('data', (data) => {
        writeToConsole(chalk.italic(`[GIT] stdout: ${data}`));
    });

    gitPull.stderr.on('data', (data) => {
        writeToConsole(chalk.italic(`[GIT] stderr: ${data}`));
    });

    gitPull.on('close', (code) => {
        writeToConsole(chalk.italic(`[GIT] child process exited with code ${code}`));
        setTimeout(() => {
            startBot();
            writeToConsole(chalk.red("Bot restarted."));
        }, 1000); 
    });
}

// Function to refresh the console.
function refreshConsole() {
	consoleBox.setContent("{underline}Taurus Console{/underline}");
	writeToConsole("Console refreshed.");
	screen.render();
}


let title = "";
figlet.text("Taurus", {
	font: "Standard",
	horizontalLayout: "default",
	verticalLayout: "default",
	width: 100,
	whitespaceBreak: true
}, function(err, data) {
	if (err) {
		console.log("Something went wrong...");
		console.dir(err);
		return;
	}
	title = chalk.red(data); // Red
});


// Function to update the box content with system and bot stats
function updateStats() {
	// System stats
	const serverUptime = moment.duration(os.uptime() * 1000).humanize();
	const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB";
	const cpuCores = os.cpus().length.toString();
	const osInfo = `${os.type()} (${os.release()})`;

	const botUptime = botStartTime ? moment.duration(moment().diff(botStartTime)).humanize() : "Not available";
	const botMemoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024 / 1024).toFixed(2) + " GB";

	box.setContent(`${title}\n\n` +
		`${chalk.red("Bot Status:")} ${botStatus === "Online" ? chalk.green(botStatus) : chalk.red(botStatus)}\n\n` +
		`${chalk.red("VPS Uptime:")} ${chalk.white(serverUptime)}\n` +
		`${chalk.red("Total Memory:")} ${chalk.white(totalMemory)}\n` +
		`${chalk.red("Bot Uptime:")} ${chalk.white(botUptime)}\n` +
		`${chalk.red("Bot Memory Usage:")} ${chalk.white(botMemoryUsage)}\n` +
		`${chalk.red("CPU Threads:")} ${chalk.white(cpuCores)}\n` +
		`${chalk.red("OS Info:")} ${chalk.white(osInfo)}\n\n` +
		`${chalk.red("Commands:")}\n` +

		`${chalk.green("S")} - ${chalk.white("Start Bot")}\n` +
		`${chalk.green("X")} - ${chalk.white("Stop Bot")}\n` +
		`${chalk.green("R")} - ${chalk.white("Restart Bot")}\n` +
		`${chalk.green("L")} - ${chalk.white("Refresh Console")}\n\n` +

		`${chalk.red("Press")} ${chalk.white("Ctrl+C")} ${chalk.red("to stop the bot and exit.")}\n\n\n`
	);
	screen.render();
}

// Function to write messages to the console box.
function writeToConsole(message) {
	const content = consoleBox.getContent();
	const newContent = `${content}\n${chalk.green(message)}`;
	consoleBox.setContent(newContent);
	screen.render();
}

// Update the stats immediately and then every minute
updateStats();
setInterval(updateStats, 60000);

// Terminate the bot process on Ctrl+C
process.on("SIGINT", () => {
	stopBot();
	setTimeout(() => {
		process.exit(0);
	}, 1000);
});

// Start the bot when script is run initially.
startBot();


// Listen for keystrokes and map them to commands.
screen.key(["S", "s"], () => {
	startBot();
});

screen.key(["X", "x"], () => {
	stopBot();
});

screen.key(["R", "r"], () => {
	restartBot();
});

screen.key(["L", "l"], () => {
	refreshConsole();
});

screen.key(["escape", "q", "C-c"], function(ch, key) {
	return process.exit(0);
});


// Render the screen.
screen.render();