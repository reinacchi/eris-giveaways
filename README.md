# Eris Giveaways

[![Discord Server](https://discord.com/api/guilds/772680478888034324/widget.png?style=shield)](https://discord.gg/22v8peAJp8)
[![GitHub Version](https://img.shields.io/github/package-json/v/reinhello/eris-giveaways)](https://github.com/reinhello/eris-giveaways)

**Eris Giveaways** is a powerful [NodeJS](https://nodejs.org) framework that allows you to easily manage giveaways using the [Eris](https://github.com/abalabahaha/eris) library!

## Features

-   ⏱️ Easy to use!
-   🔄 Automatic restart after bot crash!
-   🇫🇷 Support for translations: adapt the strings for your own language!
-   📁 Support for all databases! (default is json)
-   ⚙️ Very customizable! (prize, duration, winners, ignored permissions, bonus entries, etc...)
-   🚀 Super powerful: start, edit, reroll, end, delete and pause giveaways!
-   💥 Events: giveawayEnded, giveawayRerolled, giveawayEdited, giveawayPaused, giveawayUnpaused, giveawayDeleted, giveawayReactionAdded, giveawayReactionRemoved, endedGiveawayReactionAdded
-   🕸️ Support for shards!
-   and much more!

## Installations

```js
npm install eris-giveaways
```

## Examples

### Launch of the Framework

Before launching your bot with **Eris Giveaways**, here are some information you need to look at:

#### Required Intents:
Below are the required intents for the framework to run.

- `guilds`
- `guildMessageReactions`

#### Optional Intents
This is an optional intents for faster and better performance. You can either choose to enable these intents or not.

- `guildMembers`

```js
// Require Libraries
const Eris = require("eris");
const bot = new Eris("Bot TOKEN", { intents: ["guilds", "guildMessageReactions", "guildMembers"] }); // Replace "TOKEN" with your bot's real token
const settings = {
    prefix: "g!"
};

// Requires Manager from eris-giveaways
const { GiveawaysManager } = require("eris-giveaways");
// Create a Giveaways Manager
const manager = new GiveawaysManager(client, {
    storage: "./giveaways.json",
    default: {
        botsCanWin: false,
        embedColor: 0xFF0000,
        embedColorEnd: 0x000000,
        reaction: "🎉"
    }
});

// We can now access the Giveaways Manager everywhere!
client.giveawaysManager = manager;

client.on("ready", () => {
    console.log(`${client.user.username} is Ready!`);
});

// Connect the bot to Discord
client.connect();
```

After that, giveaways that are not yet completed will start to be updated again and new giveaways can be started.

### Start a Giveaway

```js
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const ms = require("ms") // npm install ms
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift();

    if (command === "start-giveaways") {
        client.giveawaysManager.start(message.channel, {
            duration: ms(args[0]),
            prize: args.slice(2).join(" "),
            winnerCount: parseInt(args[1])
        });
    }
});
```

This allows you to start a new giveaway. Once the `start()` function is called, the giveaway starts, and you only have to observe the result, the library does the rest!

<a href="http://zupimages.net/viewer.php?id=19/23/5h0s.png">
    <img src="https://zupimages.net/up/19/23/5h0s.png"/>
</a>

### ⚠ ATTENTION!

The command examples below (reroll, edit delete, end) can be executed on any server your bot is a member of if a person has the `prize` or the `messageID`of a giveaway. To prevent abuse we recommend to check if the `prize` or the `messageID` that was provided  by the command user is for a giveaway on the same server, if it is not, then cancel the command execution.

```js
let giveaway = client.giveawaysManager.giveaways.find((g) => g.guildID === message.channel.guild.id && g.prize === args.join(" ")) || client.giveawaysManager.giveaways.find((g) => g.guildID === message.channel.guild.id && g.messageID ==== args[0]);

if (!giveaway) return message.channel.createMessage(`Unable to find giveaway for \`${args.join(" ")}\``);
```

### Reroll a Giveaway

```js

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift();

    if (command === "reroll") {
        const messageID = args[0];

        client.giveawaysManager.reroll(messageID).then(() => {
            message.channel.createMessage("Giveaway successfully rerolled!");
        }).catch(() => {
            message.channel.createMessage(`No giveaway found for \`${messageID}\`, please check and retry`); 
        });
    }
});

```

<a href="http://zupimages.net/viewer.php?id=19/24/mhuo.png">
    <img src="https://zupimages.net/up/19/24/mhuo.png"/>
</a>

### Edit a Giveaway

```js

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift();

    if (command === "edit") {
        const messageID = args[0];

        client.giveawaysManager.edit(messageID, {
            addTime: 5000, // Add another 5 seconds to the giveaway length
            newWinnerCount: 3, // Set the new winner count to 3
            newPrize: "New Prize!" // Set the new prize
        }).then(() => {
            message.channel.createMessage(`Giveaway successfully edited!`);
        }).catch(() => {
            message.channel.createMessage(`An error has occured, please check and retry`);
        });
    }
});

```

# Coming Soon Features

Here's the current planned list of upcoming and new features which will be release in **Eris Giveaways**.

- Support for buttons 
