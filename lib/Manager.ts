/* eslint-disable @typescript-eslint/no-unused-vars */

import {
    AdvancedMessageContent,
    Client,
    CommandInteraction,
    GuildTextableChannel,
    Member,
    Message,
    PossiblyUncachedTextableChannel,
    RawPacket
} from "eris";
import { EventEmitter } from "events";
import {
    GiveawayData,
    GiveawayEditOptions,
    GiveawayManagerOptions,
    GiveawayMessages,
    GiveawayRerollOptions,
    GiveawaysManagerOptions,
    GiveawayStartOptions,
    PauseOptions
} from "./Constants";
import { Giveaway } from "./Giveaway";
import { RichEmbed, Util } from "./Util";
import merge from "deepmerge";
import { access, readFile, writeFile } from "fs/promises";
import serialize from "serialize-javascript";

/**
 * Represents the main Giveaways manager class
 */
export class GiveawaysManager extends EventEmitter {
    /**
     * Eris Client
     * @type {Client}
     */
    client: Client;

    /**
     * An array of Giveaways managed by the manager
     * @type {Array<Giveaway>}
     */
    giveaways: Giveaway[];

    /**
     * The Giveaways manager options
     * @type {GiveawaysManagerOptions}
     */
    options: GiveawaysManagerOptions;

    /**
     * Whether the manager is ready or not
     * @type {Boolean}
     */
    ready: boolean;

    /**
     * Represents the main Giveaways manager class
     * @param client Eris Client
     * @param options The Giveaways manager optioons
     * @param init Whether the manager should initialize automatically
     */
    constructor(client: Client, options?: GiveawaysManagerOptions, init = true) {
        super();

        if (!client) {
            throw new Error("Eris Client is required");
        }

        this.client = client;
        this.giveaways = [];
        this.options = merge(GiveawayManagerOptions, options || {});
        this.ready = false;

        if (init) {
            this._init();
        }
    }

    /**
     * Check every giveaways and update them if necessary
     * @returns {void}
     * @ignore
    */
    private _checkGiveaway() {
        if (this.giveaways.length <= 0) return;

        this.giveaways.forEach(async (giveaway) => {
            // If giveaway is ended, we should first check if it should be deleted from the database
            if (giveaway.ended) {
                if (Number.isFinite(this.options.endedGiveawaysLifetime) && giveaway.endAt + this.options.endedGiveawaysLifetime <= Date.now()) {
                    this.giveaways = this.giveaways.filter((g) => g.messageID === giveaway.messageID);

                    await this.deleteGiveaway(giveaway.messageID);
                }

                return;
            }

            // Check if giveaway is drop and has one reaction
            if (giveaway.isDrop) {
                giveaway.message = await giveaway.fetchMessage().catch(() => { }) as Message<PossiblyUncachedTextableChannel>;

                const reaction = giveaway.message.reactions[giveaway.reaction];

                if (reaction.count - 1 >= giveaway.winnerCount) {
                    return this.end(giveaway.messageID).catch(() => { });
                }
            }

            // Check if giveaway is paused. We should check if it should be unpaused
            if (giveaway.pauseOptions.isPaused) {
                if (!Number.isFinite(giveaway.pauseOptions.unPauseAfter) && !Number.isFinite(giveaway.pauseOptions.durationAfterPause)) {
                    giveaway.options.pauseOptions.durationAfterPause = giveaway.remainingTime;
                    giveaway.endAt = Infinity;

                    await this.editGiveaway(giveaway.messageID, giveaway.data);
                }

                if (Number.isFinite(giveaway.pauseOptions.unPauseAfter) && Date.now() > giveaway.pauseOptions.unPauseAfter) {
                    return this.unpause(giveaway.messageID).catch(() => { });
                }
            }

            // Check if giveaway should ended immediately after a restart session
            if (giveaway.remainingTime <= 0) {
                return this.end(giveaway.messageID).catch(() => { });
            }

            giveaway.ensureEndTimeout();

            // Check if giveaway will be in the last chance state
            if (giveaway.lastChance && giveaway.remainingTime - giveaway.lastChance.threshold < (this.options.forceUpdateEvery)) {
                setTimeout(async () => {
                    giveaway.message ??= await giveaway.fetchMessage().catch(() => { }) as Message<PossiblyUncachedTextableChannel>;

                    const embed = this.generateMainEmbed(giveaway, true);

                    giveaway.message = await giveaway.message?.edit({
                        content: giveaway.fillInString(giveaway.messages.giveaway),
                        embed: embed
                    }).catch(() => { }) as Message<PossiblyUncachedTextableChannel>;
                }, giveaway.remainingTime - giveaway.lastChance.threshold);
            }

            // Fetch the giveaway's message if necessary to ensure everthing is in order
            giveaway.message ??= await giveaway.fetchMessage().catch(() => { }) as Message<PossiblyUncachedTextableChannel>;

            if (!giveaway.message) return;

            if (!giveaway.message.embeds[0]) {
                giveaway.message = await giveaway.message.edit({ flags: 0 }).catch(() => { }) as Message<PossiblyUncachedTextableChannel>;
            }

            // Regular check if giveaway is not ended and required to update it
            const lastChanceEnabled = giveaway.lastChance.enabled && giveaway.remainingTime < giveaway.lastChance.threshold;
            const updatedEmbed = this.generateMainEmbed(giveaway, lastChanceEnabled);
            const requireUpdate = !updatedEmbed.equals(giveaway.message.embeds[0]) || giveaway.message.content !== giveaway.fillInString(giveaway.messages.giveaway);

            if (requireUpdate && this.options.forceUpdateEvery !== null) {
                giveaway.message = await giveaway.message.edit({
                    content: giveaway.fillInString(giveaway.messages.giveaway),
                    embed: updatedEmbed
                }).catch(() => { }) as Message<PossiblyUncachedTextableChannel>;
            }
        });
    }

    /**
     * Handle Discord raw gateway events
     * @param packet Discord's Gateway payload packet
     * @returns {Promise<Boolean>}
     * @ignore
     */
    private async _handleRawPacket(packet: RawPacket): Promise<boolean> {
        if (!["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(packet.t)) return;

        const giveaway = this.giveaways.find((g) => g.messageID === (packet.d as any).message_id as string);

        if (!giveaway) return;
        if (giveaway.ended && packet.t === "MESSAGE_REACTION_REMOVE") return;

        const guild = this.client.guilds.get((packet.d as any).guild_id);

        if (!guild) return;

        const member: Member = guild.members.get((packet.d as any).user_id) || (await guild.fetchMembers({ userIDs: [(packet.d as any).user_id] }).catch(() => { }))[0];

        if (!member) return;

        const channel = this.client.getChannel((packet.d as any).channel_id) || guild.channels.get((packet.d as any).channel_id);

        if (!channel) return;

        const message = await this.client.getMessage(channel.id, (packet.d as any).message_id);

        if (!message) return;

        const rawEmoji = Util.resolvePartialEmoji(giveaway.reaction);
        const reaction = message.reactions[giveaway.reaction];

        if (!reaction) return;
        if ((rawEmoji as { animated: boolean; name: string; id: string })?.name !== (packet.d as any).emoji_name) return;
        if (rawEmoji?.id && rawEmoji?.id !== (packet.d as any).emoji_id) return;

        if (packet.t === "MESSAGE_REACTION_ADD") {
            if (giveaway.ended) return this.emit("endedGiveawayReactionAdded", giveaway, member, reaction, rawEmoji);

            this.emit("giveawayReactionAdded", giveaway, member, reaction, rawEmoji);

            if (giveaway.isDrop && reaction.count - 1 >= giveaway.winnerCount) {
                this.end(giveaway.messageID).catch(() => { });
            }
        } else {
            this.emit("giveawayReactionRemoved", giveaway, member, reaction, rawEmoji);
        }
    }

    /**
     * Initialize the Giveaway manager
     * @return {Promise<void>}
     * @ignore
     */
    private async _init(): Promise<void> {
        const rawGiveaways = await this.getAllGiveaways();

        await (this.client.ready ? Promise.resolve() : new Promise((resolve) => this.client.once("ready", resolve)));

        rawGiveaways.forEach((giveaway) => this.giveaways.push(new Giveaway(this, giveaway)));

        setInterval(() => {
            if (this.client.startTime) this._checkGiveaway.call(this);
        }, this.options.forceUpdateEvery || 15_000);

        this.ready = true;

        if (Number.isFinite(this.options.endedGiveawaysLifetime)) {
            const endedGiveaways = this.giveaways.filter((g) => g.ended && g.endAt + this.options.endedGiveawaysLifetime <= Date.now());

            this.giveaways = this.giveaways.filter((g) => !endedGiveaways.map((giveaway) => giveaway.messageID).includes(g.messageID));

            for (const giveaway of endedGiveaways) {
                await this.deleteGiveaway(giveaway.messageID);
            }
        }

        this.client.on("rawWS", (packet) => this._handleRawPacket(packet));
    }

    /**
     * Deletes a giveaway. This will delete the giveaway's message and its data
     * @param messageID The ID of the giveaway message
     * @param doNotDeleteMessage Whether the giveaway message remains or deleted
     * @returns {Promise<Giveaway>}
     */
    delete(messageID: string, doNotDeleteMessage = false): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);

            if (!giveaway) return reject(`No Giveaway found with message ID ${messageID}`);

            if (!doNotDeleteMessage) {
                giveaway.message ??= await giveaway.fetchMessage().catch(() => { }) as Message<PossiblyUncachedTextableChannel>;
                giveaway.message?.delete();
            }

            this.giveaways = this.giveaways.filter((g) => g.messageID !== messageID);

            await this.deleteGiveaway(messageID);

            this.emit("giveawayDeleted", giveaway);
            resolve(giveaway);
        });
    }

    /**
     * Deletes a giveaway from the database. See `GiveawaysManager#delete()` for client usage
     * @param messageID The ID of the giveaway message
     * @returns {Promise<any>}
     */
    async deleteGiveaway(messageID: string): Promise<any> {
        await writeFile(
            this.options.storage,
            JSON.stringify(
                this.giveaways.map((giveaway) => giveaway.data),
                (_, v) => (typeof v === "bigint" ? serialize(v) : v)
            ),
            "utf-8"
        );
        return;
    }

    edit(messageID: string, options: GiveawayEditOptions = {}) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);

            if (!giveaway) return reject(`No Giveaway found with message ID ${messageID}`);

            this.emit("giveawayEdited", giveaway);
            giveaway.edit(options).then(resolve).catch(reject);
        });
    }

    /**
     * Edits a giveaway found in the database. See `GiveawaysManager#edit()` for client usage
     * @param messageID The ID of the giveaway message
     * @param giveawayData The giveaway data
     * @returns {Promise<any>}
     */
    async editGiveaway(messageID: string, giveawayData: GiveawayData): Promise<any> {
        await writeFile(
            this.options.storage,
            JSON.stringify(
                this.giveaways.map((giveaway) => giveaway.data),
                (_, v) => (typeof v === "bigint" ? serialize(v) : v)
            ),
            "utf-8"
        );
        return;
    }

    /**
     * Ends a giveaway. This method  will be called automatically when a giveaway supposes to end
     * @param messageID The ID of the giveaway message
     * @param noWinnerMessage Sent in the channel if there is no valid participant
     * @returns {Promise<Array<Member>>}
     */
    end(messageID: string, noWinnerMessage: AdvancedMessageContent | string = null): Promise<Member[]> {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);

            if (!giveaway) return reject(`No Giveaway found with message ID ${messageID}`);

            giveaway.end(noWinnerMessage).then((winners) => {
                this.emit("giveawayEnded", giveaway, winners);
                resolve(winners);
            }).catch(reject);
        });
    }

    /**
     * Generate an end embed when a giveaway has ended
     * @param giveaway The giveaway
     * @param winners An array of giveaway winners
     * @returns {RichEmbed}
     */
    generateEndEmbed(giveaway: Giveaway, winners: Member[]): RichEmbed {
        let formattedWinners = winners.map((w) => `<@${w.id}>`).join(", ");

        const strings = {
            winners: giveaway.fillInString(giveaway.messages.winners),
            hostedBy: giveaway.fillInString(giveaway.messages.hostedBy),
            endedAt: giveaway.fillInString(giveaway.messages.endedAt),
            prize: giveaway.fillInString(giveaway.prize)
        };

        const descriptionString = (formattedWinners: string) =>
            strings.winners + " " + formattedWinners + (giveaway.hostedBy ? "\n" + strings.hostedBy : "");

        for (
            let i = 1;
            descriptionString(formattedWinners).length > 4096 ||
            strings.prize.length + strings.endedAt.length + descriptionString(formattedWinners).length > 6000;
            i++
        ) {
            formattedWinners = formattedWinners.slice(0, formattedWinners.lastIndexOf(", <@")) + `, ${i} more`;
        }

        return new RichEmbed()
            .setTitle(strings.prize)
            .setDescription(descriptionString(formattedWinners))
            .setColor(giveaway.embedColorEnd)
            .setFooter(strings.endedAt, (giveaway.messages.embedFooter as { text?: string; iconURL?: string }).iconURL)
            .setTimestamp(giveaway.endAt)
            .setThumbnail(giveaway.thumbnail)
            .setImage(giveaway.image);
    }

    /**
     * generate an invalid embed when a giveaway has ended with not participants
     * @param giveaway The giveaway
     * @returns {RichEmbed}
     */
    generateInvalidParticipantsEndEmbed(giveaway: Giveaway): RichEmbed {
        const embed = new RichEmbed()
            .setTitle(giveaway.prize)
            .setColor(giveaway.embedColorEnd)
            .setFooter(giveaway.messages.endedAt, (giveaway.messages.embedFooter as { text?: string; iconURL?: string }).iconURL)
            .setDescription(giveaway.messages.noWinner + (giveaway.hostedBy ? "\n" + giveaway.messages.hostedBy : ""))
            .setTimestamp(giveaway.endAt)
            .setThumbnail(giveaway.thumbnail)
            .setImage(giveaway.image);

        return giveaway.fillInEmbed(embed);
    }

    /**
     * Generate the main embed when a giveaway is active
     * @param giveaway The giveaway
     * @param lastChanceEnabled Whether to enable the last chance mode or not. Default is `false`
     * @returns {RichEmbed}
     */
    generateMainEmbed(giveaway: Giveaway, lastChanceEnabled = false): RichEmbed {
        const embed = new RichEmbed()
            .setTitle(giveaway.prize)
            .setColor(giveaway.isDrop ? giveaway.embedColor : giveaway.pauseOptions.isPaused && giveaway.pauseOptions.embedColor ? giveaway.pauseOptions.embedColor : lastChanceEnabled ? giveaway.lastChance.embedColor : giveaway.embedColor)
            .setFooter(typeof giveaway.messages.embedFooter === "object" ? giveaway.messages.embedFooter.text : giveaway.messages.embedFooter, typeof giveaway.messages.embedFooter === "object" ? giveaway.messages.embedFooter.iconURL : undefined)
            .setDescription(
                giveaway.isDrop
                    ? giveaway.messages.dropMessage
                    : (giveaway.pauseOptions.isPaused
                        ? giveaway.pauseOptions.content + "\n\n"
                        : lastChanceEnabled
                            ? giveaway.lastChance.content + "\n\n"
                            : "") +
                    giveaway.messages.inviteToParticipate +
                    "\n" +
                    giveaway.messages.drawing.replace(
                        "{duration}",
                        giveaway.endAt === Infinity
                            ? giveaway.pauseOptions.infiniteDurationText
                            : `<t:${Math.round(giveaway.endAt / 1000)}:R>`
                    ) +
                    (giveaway.hostedBy ? "\n" + giveaway.messages.hostedBy : "")
            )
            .setThumbnail(giveaway.thumbnail)
            .setImage(giveaway.image);

        if (giveaway.endAt !== Infinity) {
            embed.setTimestamp(giveaway.endAt);
        } else {
            delete embed.timestamp;
        }

        return giveaway.fillInEmbed(embed);
    }

    /**
     * Gets an array of all giveaways from the database.
     * @returns {Promise<Array<GiveawayData>>}
     */
    async getAllGiveaways(): Promise<GiveawayData[]> {
        const storageExists = await access(this.options.storage).then(() => true).catch(() => false);

        if (!storageExists) {
            await writeFile(this.options.storage, "[]", "utf-8");
            return [];
        } else {
            const storageContent = await readFile(this.options.storage, { encoding: "utf-8" });

            if (!storageContent.trim().startsWith("[") || !storageContent.trim().endsWith("]")) {
                console.log(storageContent);
                throw new SyntaxError("The storage file is not property formatted");
            }

            try {
                return await JSON.parse(storageContent, (_, v) =>
                    typeof v === "string" && /BigInt\("(-?\d+)"\)/.test(v) ? eval(v) : v
                );
            } catch (err) {
                if (err.message.startsWith("Unexpected token")) {
                    throw new SyntaxError(
                        /* eslint-disable-next-line */
                        `${err.message} | LINK: (${require("path").resolve(this.options.storage)}:1:${err.message
                            .split(" ")
                            .at(-1)})`
                    );
                }

                throw err;
            }
        }
    }

    /**
     * Pauses a giveaway
     * @param messageID The ID of the giveaway message
     * @param options Optional pause options
     * @returns {Promise<Giveaway>}
     */
    pause(messageID: string, options: PauseOptions = {}): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);

            if (!giveaway) return reject(`No Giveaway found with message ID ${messageID}`);

            this.emit("giveawayPaused", giveaway);
            giveaway.pause(options).then(resolve).catch(reject);
        });
    }

    /**
     * Rerolls a giveaway
     * @param messageID The ID of the giveawya message
     * @param options Optional reroll options
     * @param interaction Optional Eris' command interaction
     * @returns {Promise<Array<Member>>}
     */
    reroll(messageID: string, options: GiveawayRerollOptions = {}, interaction?: CommandInteraction): Promise<Member[]> {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);

            if (!giveaway) return reject(`No Giveaway found with message ID ${messageID}`);

            if (options.interactionOptions.enabled) {
                giveaway.reroll(options, interaction).then((winners) => {
                    this.emit("giveawayRerolled", giveaway, winners);
                    resolve(winners);
                });
            } else {
                giveaway.reroll(options).then((winners) => {
                    this.emit("giveawayRerolled", giveaway, winners);
                    resolve(winners);
                }).catch(reject);
            }
        });

    }

    /**
     * Saves the giveaway data in the database
     * @param messageID The ID of the giveawya message
     * @param giveawayData The giveaway data
     * @returns {Promise<any>}
     */
    async saveGiveaway(messageID: string, giveawayData: GiveawayData): Promise<any> {
        await writeFile(
            this.options.storage,
            JSON.stringify(
                this.giveaways.map((giveaway) => giveaway.data),
                (_, v) => (typeof v === "bigint" ? serialize(v) : v)
            ),
            "utf-8"
        );
        return;
    }

    /**
     * Starts a giveaway
     * @param channel The channel of the giveaway
     * @param options The start options of the giveaway
     * @returns {Promise<Giveaway>}
     */
    start(channel: GuildTextableChannel, options: GiveawayStartOptions): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            if (!this.ready) return reject("The manager is not ready");
            if (!channel?.id) return reject("Channel is not a valid text channel");
            if (typeof options.prize !== "string" || (options.prize = options.prize.trim()).length > 256) return reject("`options.prize` is not a string or longer than 256 characters");
            if (!Number.isInteger(options.winnerCount) || options.winnerCount < 1) return reject("`options.winnerCount` is not a positive integer");
            if (options.isDrop && typeof options.isDrop !== "boolean") return reject("`options.isDrop` is not a boolean");
            if (!options.isDrop && (!Number.isFinite(options.duration) || options.duration < 1)) return reject("`options.duration` is not a positive number");

            const giveaway = new Giveaway(this, {
                startAt: Date.now(),
                endAt: options.isDrop ? Infinity : Date.now() + options.duration,
                winnerCount: options.winnerCount,
                channelID: channel.id,
                guildID: channel.guild.id,
                prize: options.prize,
                hostedBy: options.hostedBy ? options.hostedBy.toString() : undefined,
                messages:
                    options.messages && typeof options.messages === "object"
                        ? merge(GiveawayMessages, options.messages)
                        : GiveawayMessages,
                thumbnail: typeof options.thumbnail === "string" ? options.thumbnail : undefined,
                image: typeof options.image === "string" ? options.image : undefined,
                reaction: Util.resolvePartialEmoji(options.reaction) ? options.reaction : undefined,
                botsCanWin: typeof options.botsCanWin === "boolean" ? options.botsCanWin : undefined,
                exemptPermissions: Array.isArray(options.exemptPermissions) ? options.exemptPermissions : undefined,
                bonusEntries:
                    Array.isArray(options.bonusEntries) && !options.isDrop
                        ? (options.bonusEntries.filter((elem) => typeof elem === "object") as any) : undefined,
                embedColor: typeof options.embedColor === "number" ? options.embedColor : undefined,
                embedColorEnd: typeof options.embedColor === "number" ? options.embedColorEnd : undefined,
                lastChance:
                    options.lastChance && typeof options.lastChance === "object" && !options.isDrop
                        ? options.lastChance
                        : undefined,
                pauseOptions:
                    options.pauseOptions && typeof options.pauseOptions === "object" && !options.isDrop
                        ? options.pauseOptions
                        : undefined,
                isDrop: options.isDrop
            });

            const embed = this.generateMainEmbed(giveaway);
            const message = await channel.createMessage({
                content: giveaway.fillInString(giveaway.messages.giveaway),
                embed: embed
            });
            giveaway.messageID = message.id;
            await message.addReaction(options.reaction);

            this.emit("giveawayStarted", giveaway, channel);
            this.giveaways.push(giveaway);
            await this.saveGiveaway(giveaway.messageID, giveaway.data);
            resolve(giveaway);
        });
    }

    /**
     * Unpauses a giveaway
     * @param messageID The ID of the giveaway message
     * @returns {Promise<Giveaway>}
     */
    unpause(messageID: string): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);

            if (!giveaway) return reject(`No Giveaway found with message ID ${messageID}`);

            this.emit("giveawayUnpaused", giveaway);
            giveaway.unpause().then(resolve).catch(reject);
        });
    }
}
