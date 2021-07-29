# Eris Giveaways

**Eris Giveaways** is a powerful [NodeJS](https://nodejs.org) third-party library that allows you to easily manage giveaways!

**Note:** This library is an [Eris](https://github.com/abalabahaha/eris) version of [discord-giveaways](https://github.com/Androz2091/discord-giveaways).

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
npm install --save eris-giveaways
```

## Examples

### Launch Of The Library

Before launching your bot with **Eris Giveaways**, here are some information you need to look at:

#### Required Intents:
This library uses Eris' both REST and GATEWAY V9 which indicating intents are a required options. See below for specific intents:

- `guilds` - 1 | 1 << 0
- `guildMessages` - 512 | 1 << 9
- `guildMessageReactions` - 1024 | 1 << 10

#### Optional Intents
This is an optional intents for faster and better performance. You can either choose to enable these intents or not.

- `guildMembers` - 2 | 1 << 1

```js
// Require Libraries
const Eris = require("eris");
const bot = new Eris("Bot TOKEN", { intents: ["guilds", "guildMessages", "guildMessageReactions", "guildMembers"] });
const settings = {
    prefix: "g!"
};

// Requires Manager from eris-giveaways
const { GiveawaysManager } = require("eris-giveaways");
// Create a Giveaways Manager
const manager = new GiveawaysManager(client, {
    storage: "./giveaways.json",
    updateCountdownEvery: 10000,
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
            time: ms(args[0]),
            winnerCount: parseInt(args[1]),
            prize: args.slice(2).join(" ")
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

- Soon™ To Add More README!