import {
    AdvancedMessageContent,
    Client,
    CommandInteraction,
    Constants,
    Member,
    Message,
    PossiblyUncachedTextableChannel,
    TextChannel,
    User,
} from "eris";
import { EventEmitter } from "events";
import {
    Endpoints,
    GiveawayData,
    LastChanceOptions,
    BonusEntry,
    PauseOptions,
    GiveawaysMessages,
    GiveawayEditOptions,
    GiveawayRerollOptions,
} from "./Constants";
import { GiveawaysManager } from "./Manager";
import { RichEmbed } from "./Util";
import merge from "deepmerge";
import serialize from "serialize-javascript";

/**
 * Represents the Giveaway data class
 */
export class Giveaway extends EventEmitter {
    /**
     * The ID of the giveaway channel
     * @type {String}
     */
    channelID: string;

    /**
     * Eris Client
     * @type {Client}
     */
    client: Client;

    /**
     * The end timestamp of the giveaway
     * @type {Number}
     */
    endAt: number;

    /**
     * Whether the giveaway has ended or not
     * @type {Boolean}
     */
    ended: boolean;

    /**
     * The end timeout of the giveaway
     * @type {NodeJS.Timeout}
     */
    endTimeout: NodeJS.Timeout;

    /**
     * The extra data of the giveaway
     * @type {any}
     */
    extraData: any;

    /**
     * The ID of the giveaway guild
     * @type {String}
     */
    guildID: string;

    /**
     * The mention format of the user who hosts the giveaway
     * @type {String}
     */
    hostedBy: string;

    /**
     * The image of the giveaway
     * @type {String}
     */
    image: string;

    /**
     * The main giveaways manager
     * @type {GiveawaysManager}
     */
    manager: GiveawaysManager;

    /**
     * The message object of the giveaway
     * @type {Message<PossiblyUncachedTextableChannel>}
     */
    message: Message<PossiblyUncachedTextableChannel>;

    /**
     * The ID of the giveaway message
     * @type {String}
     */
    messageID: string;

    /**
     * The giveaway messages object
     * @type {GiveawaysMessages}
     */
    messages: GiveawaysMessages;

    /**
     * The giveaway data options
     * @type {GiveawayData}
     */
    options: GiveawayData;

    /**
     * The prize of the giveaway
     * @type {String}
     */
    prize: string;

    /**
     * The start timestamp of the giveaway
     * @type {Number}
     */
    startAt: number;

    /**
     * The thumbnail of the giveaway
     * @type {String}
     */
    thumbnail: string;

    /**
     * The winner count of the giveaway
     * @type {Number}
     */
    winnerCount: number;

    /**
     * An array of giveaway winners ID
     * @type {Array<String>}
     */
    winnerIDs: string[];

    /**
     * Represents the Giveaway data class
     * @param manager The giveaways manager
     * @param options The giveaway data options
     */
    constructor(manager: GiveawaysManager, options: GiveawayData) {
        super();

        this.client = manager.client;
        this.channelID = options.channelID;
        this.endAt = options.endAt ?? Infinity;
        this.ended = !!options.ended;
        this.endTimeout = null;
        this.extraData = options.extraData;
        this.hostedBy = options.hostedBy;
        this.image = options.image;
        this.guildID = options.guildID;
        this.manager = manager;
        this.message = null;
        this.messageID = options.messageID;
        this.messages = options.messages;
        this.options = options;
        this.prize = options.prize;
        this.startAt = options.startAt;
        this.thumbnail = options.thumbnail;
        this.winnerCount = options.winnerCount;
        this.winnerIDs = options.winnerIDs ?? [];
    }

    /**
     * An array of `BonusEntry` objects of the giveaway
     * @type {Array<BonusEntry>}
     */
    get bonusEntries(): BonusEntry[] {
        return eval(this.options.bonusEntries) ?? [];
    }

    /**
     * Whether bots can participate and win a giveaway
     * @type {Boolean}
     */
    get botsCanWin(): boolean {
        return typeof this.options.botsCanWin === "boolean"
            ? this.options.botsCanWin
            : this.manager.options.default.botsCanWin;
    }

    /**
     * The channel of the giveaway
     * @type {TextChannel}
     */
    get channel(): TextChannel {
        return this.client.getChannel(this.channelID) as TextChannel;
    }

    /**
     * The giveaway data
     * @type {GiveawayData}
     */
    get data(): GiveawayData {
        return {
            messageID: this.messageID,
            channelID: this.channelID,
            guildID: this.guildID,
            startAt: this.startAt,
            endAt: this.endAt,
            ended: this.ended,
            winnerCount: this.winnerCount,
            prize: this.prize,
            messages: this.messages,
            thumbnail: this.thumbnail,
            image: this.image,
            hostedBy: this.hostedBy,
            embedColor: this.embedColor,
            embedColorEnd: this.embedColorEnd,
            botsCanWin: this.botsCanWin,
            exemptPermissions: this.exemptPermissions,
            exemptMembers:
                !this.options.exemptMembers ||
                    typeof this.options.exemptMembers === "string"
                    ? this.options.exemptMembers || undefined
                    : serialize(this.options.exemptMembers),
            bonusEntries:
                !this.options.bonusEntries ||
                    typeof this.options.bonusEntries === "string"
                    ? this.options.bonusEntries || undefined
                    : serialize(this.options.bonusEntries),
            reaction: this.reaction,
            winnerIDs: this.winnerIDs.length ? this.winnerIDs : undefined,
            extraData: this.extraData,
            lastChance: this.options.lastChance,
            pauseOptions: this.options.pauseOptions,
            isDrop: this.options.isDrop || undefined,
        };
    }

    /**
     * The duration of the giveaway
     * @type {Number}
     */
    get duration(): number {
        return this.endAt - this.startAt;
    }

    /**
     * The embed color of the giveaway
     * @type {Number}
     */
    get embedColor(): number {
        return this.options.embedColor ?? this.manager.options.default.embedColor;
    }

    /**
     * The end embed color of the giveaway
     * @type {Number}
     */
    get embedColorEnd(): number {
        return (
            this.options.embedColorEnd ?? this.manager.options.default.embedColorEnd
        );
    }

    /**
     * The exemptMembers function of the giveaway
     * @type {any}
     */
    get exemptMembersFunction(): any {
        return this.options.exemptMembers
            ? typeof this.options.exemptMembers === "string" &&
                this.options.exemptMembers.includes("function anonymous")
                ? eval(`(${this.options.exemptMembers})`)
                : eval(this.options.exemptMembers)
            : null;
    }

    /**
     * The exempt permissions of the giveaway
     * @type {Array<String>}
     */
    get exemptPermissions(): [keyof Constants["Permissions"]] {
        return this.options.exemptPermissions?.length
            ? this.options.exemptPermissions
            : this.manager.options.default.exemptPermissions;
    }

    /**
     * Whether the giveaway is a drop or not
     * @type {Boolean}
     */
    get isDrop(): boolean {
        return !!this.options.isDrop;
    }

    /**
     * The last chance object of the giveaway
     * @type {LastChanceOptions}
     */
    get lastChance(): LastChanceOptions {
        return merge(
            this.manager.options.default.lastChance,
            this.options.lastChance ?? {}
        );
    }

    /**
     * The original message URL of the giveaway
     * @type {String}
     */
    get messageURL(): string {
        return Endpoints.MESSAGE_URL(this.guildID, this.channelID, this.messageID);
    }

    /**
     * The pause options object of the giveaway
     * @type {PauseOptions}
     */
    get pauseOptions(): PauseOptions {
        return merge(PauseOptions, this.options.pauseOptions ?? {});
    }

    /**
     * The reaction of the giveaway
     * @type {String}
     */
    get reaction(): string {
        return this.options.reaction ?? this.manager.options.default.reaction;
    }

    /**
     * The remaining time of the giveaway
     * @type {Number}
     */
    get remainingTime(): number {
        return this.endAt - Date.now();
    }

    /**
     * Check if a user gets a bonus entries for the giveaway
     * @param user The user to check
     * @returns {Promise<Number>}
     */
    async checkBonusEntries(user: User): Promise<number> {
        const member: Member =
            this.channel.guild.members.get(user.id) ||
            (
                await this.channel.guild
                    .fetchMembers({ userIDs: [user.id] })
                    .catch(() => { })
            )[0];
        const entries: number[] = [0];
        const cumulativeEntries: number[] = [];

        if (!member) return 0;

        if (this.bonusEntries.length) {
            for (const obj of this.bonusEntries) {
                if (typeof obj.bonus === "function") {
                    try {
                        const result = await obj.bonus.apply(this, [member, this]);

                        if (Number.isInteger(result) && result > 0) {
                            if (obj.cumulative) {
                                cumulativeEntries.push(result);
                            } else {
                                entries.push(result);
                            }
                        }
                    } catch (err) {
                        throw new Error(
                            `Giveaway Message ID: ${this.messageID} \n ${serialize(
                                obj.bonus
                            )} \n ${err}`
                        );
                    }
                }
            }
        }

        if (cumulativeEntries.length) {
            entries.push(cumulativeEntries.reduce((a, b) => a + b));
        }

        return Math.max(...entries);
    }

    /**
     * Check if a user meets the certain criteria to participate for the giveaway
     * @param user The user to check
     * @returns {Promise<Boolean>}
     */
    async checkWinnerEntry(user: User): Promise<boolean> {
        if (this.winnerIDs.includes(user.id)) return false;

        const member: Member =
            this.channel.guild.members.get(user.id) ||
            (
                await this.channel.guild
                    .fetchMembers({ userIDs: [user.id] })
                    .catch(() => { })
            )[0];

        if (!member) return false;

        const exemptMember = await this.exemptMembers(member);

        if (exemptMember) return false;

        const hasPermission = this.exemptPermissions.some((permission) =>
            member.permissions.has(permission)
        );

        if (hasPermission) return false;

        return true;
    }

    /**
     * Edits a giveaway
     * @param options The edit options
     * @returns {Promise<Giveaway>}
     */
    async edit(options: GiveawayEditOptions = {}): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            if (this.ended) {
                return reject(`Giveaway Message ID: ${this.messageID} has ended`);
            }

            await this.fetchMessage().catch(() => { });

            if (!this.message) {
                return reject(`Unable to find Giveaway with ID: ${this.messageID}`);
            }

            // Update Giveaway data
            if (options.newMessages && typeof options.newMessages === "object") {
                this.messages = merge(this.messages, options.newMessages);
            }

            if (typeof options.newThumbnail === "string") {
                this.thumbnail = options.newThumbnail;
            }

            if (typeof options.newImage === "string") {
                this.image = options.newImage;
            }

            if (typeof options.newPrize === "string") {
                this.prize = options.newPrize;
            }

            if (options.newExtraData) {
                this.extraData = options.newExtraData;
            }

            if (
                Number.isInteger(options.newWinnerCount) &&
                options.newWinnerCount > 0 &&
                !this.isDrop
            ) {
                this.winnerCount = options.newWinnerCount;
            }

            if (Number.isFinite(options.addTime) && !this.isDrop) {
                this.endAt = this.endAt + options.addTime;
                if (this.endTimeout) clearTimeout(this.endTimeout);
                this.ensureEndTimeout();
            }

            if (Number.isFinite(options.setEndTimestamp) && !this.isDrop)
                this.endAt = options.setEndTimestamp;

            if (Array.isArray(options.newBonusEntries) && !this.isDrop) {
                this.options.bonusEntries = options.newBonusEntries.filter(
                    (elem) => typeof elem === "object"
                ) as any;
            }

            if (typeof options.newExemptMembers === "function") {
                this.options.exemptMembers = options.newExemptMembers as any;
            }

            if (
                options.newLastChance &&
                typeof options.newLastChance === "object" &&
                !this.isDrop
            ) {
                this.options.lastChance = merge(
                    this.options.lastChance || {},
                    options.newLastChance
                );
            }

            await this.manager.editGiveaway(this.messageID, this.data);

            if (this.remainingTime <= 0) {
                this.manager.end(this.messageID).catch(() => { });
            } else {
                const embed = this.manager.generateMainEmbed(this);

                await this.message.edit({
                    content: this.fillInString(this.messages.giveaway),
                    embed: embed
                }).catch(() => { });
            }

            resolve(this);
        });
    }

    /**
     * Ends a giveaway
     * @param noWinnerMessage Sent in the channel if there is no valid participants for the giveaway
     * @returns {Promise<Array<Member>>}
     */
    end(noWinnerMessage: AdvancedMessageContent | string = null): Promise<Member[]> {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject(`Giveaway with Message ID ${this.messageID} has already ended`);

            this.ended = true;
            this.message ??= await this.fetchMessage().catch((err) =>
                err.includes("Try again!") ? (this.ended = false) : undefined
            ) as any;

            if (!this.message) return reject(`Unable to fetch Giveaway with ID ${this.messageID}`);

            if (this.isDrop || this.endAt < this.client.startTime) this.endAt = Date.now();

            await this.manager.editGiveaway(this.messageID, this.data);

            const winners = await this.roll();

            if (winners.length > 0) {
                this.winnerIDs = winners.map((w) => w.id);

                await this.manager.editGiveaway(this.messageID, this.data);

                const embed = this.manager.generateEndEmbed(this, winners);

                this.message = await this.message.edit({
                    content: this.fillInString(this.messages.giveawayEnded),
                    embed: embed
                }).catch(() => { }) as Message<PossiblyUncachedTextableChannel>;

                let formattedWinners = winners.map((w) => `<@${w.id}>`).join(", ");
                const winMessage = this.fillInString((this.messages.winMessage as AdvancedMessageContent).content || this.messages.winMessage as string);
                const message = winMessage?.replace("{winners}", formattedWinners);

                if (message?.length > 2000) {
                    const firstContentPart = winMessage.slice(0, winMessage.indexOf("{winners}"));

                    if (firstContentPart.length) {
                        this.channel.createMessage({
                            content: firstContentPart,
                        });
                    }

                    while (formattedWinners.length >= 2000) {
                        await this.channel.createMessage({
                            content: formattedWinners.slice(0, formattedWinners.lastIndexOf(",", 1999)) + ","
                        });

                        formattedWinners = formattedWinners.slice(
                            formattedWinners.slice(0, formattedWinners.lastIndexOf(",", 1999) + 2).length
                        );
                    }

                    this.channel.createMessage({ content: formattedWinners });

                    const lastContentPart = winMessage.slice(winMessage.indexOf("{winners}") + 9);

                    if (lastContentPart.length) {
                        this.channel.createMessage({ content: lastContentPart });
                    }
                }

                if ((this.messages.winMessage as AdvancedMessageContent).embed && typeof (this.messages.winMessage as AdvancedMessageContent).embed === "object") {
                    if (message?.length > 2000) formattedWinners = winners.map((w) => `<@${w.id}>`).join(", ");

                    const embed = this.fillInEmbed((this.messages.winMessage as AdvancedMessageContent).embed as RichEmbed);
                    const embedDescription = embed.description?.replace("{winners}", formattedWinners) ?? "";

                    if (embedDescription.length <= 4096) {
                        this.channel.createMessage({
                            content: message?.length <= 2000 ? message : null,
                            embed: embed.setDescription(embedDescription),
                        });
                    } else {
                        const firstEmbed = new RichEmbed(embed).setDescription(
                            embed.description.slice(0, embed.description.indexOf("{winners}"))
                        );

                        if (firstEmbed.length) {
                            this.channel.createMessage({
                                content: message?.length <= 2000 ? message : null,
                                embed: firstEmbed
                            });
                        }

                        const tempEmbed = new RichEmbed().setColor(embed.color);

                        while (formattedWinners.length >= 4096) {
                            await this.channel.createMessage({
                                embed: tempEmbed.setDescription(
                                    formattedWinners.slice(0, formattedWinners.lastIndexOf(",", 4095)) + ","
                                )
                            });

                            formattedWinners = formattedWinners.slice(
                                formattedWinners.slice(0, formattedWinners.lastIndexOf(",", 4095) + 2).length
                            );
                        }

                        this.channel.createMessage({
                            embed: tempEmbed.setDescription(formattedWinners)
                        });

                        const lastEmbed = tempEmbed.setDescription(
                            embed.description.slice(embed.description.indexOf("{winners}") + 9)
                        );

                        if (lastEmbed.length) {
                            this.channel.createMessage({ embed: lastEmbed });
                        }
                    }
                } else if (message?.length <= 2000) {
                    this.channel.createMessage({
                        content: message
                    });
                }

                resolve(winners);
            } else {
                const message = this.fillInString((noWinnerMessage as AdvancedMessageContent)?.content || noWinnerMessage as string);
                const embed = this.fillInEmbed((noWinnerMessage as AdvancedMessageContent)?.embed as RichEmbed);

                if (message || embed) {
                    this.channel.createMessage({
                        content: message,
                        embed: embed
                    });
                }

                this.message = await this.message.edit({
                    content: this.fillInString(this.messages.giveawayEnded),
                    embed: this.fillInEmbed(this.manager.generateInvalidParticipantsEndEmbed(this))
                }).catch(() => { }) as Message<PossiblyUncachedTextableChannel>;

                resolve([]);
            }
        });
    }

    /**
     * Ensure that end timeout is created for this giveaway
     * @returns {NodeJS.Timeout}
     */
    ensureEndTimeout(): NodeJS.Timeout {
        if (this.endTimeout) return;
        /* eslint-disable-next-line */
        if (this.remainingTime > this.manager.options.forceUpdateEvery || 15_000)
            return;
        /* eslint-disable-next-line */
        this.endTimeout = setTimeout(
            () => this.manager.end.call(this.manager, this.messageID).catch(() => { }),
            this.remainingTime
        );
    }

    /**
     * Filter members who are able to participate for the giveaway
     * @param member The member to check
     * @returns {Promise<Boolean>}
     */
    async exemptMembers(member: Member): Promise<boolean> {
        if (typeof this.exemptMembersFunction === "function") {
            try {
                const result = await this.exemptMembersFunction(member);
                return result;
            } catch (err) {
                new Error(
                    `Giveaway Message ID: ${this.messageID} \n ${serialize(
                        this.exemptMembersFunction
                    )} \n ${err}`
                );
                return false;
            }
        }

        if (typeof this.manager.options.default.exemptMembers === "function") {
            return await this.manager.options.default.exemptMembers(member);
        }

        return false;
    }

    /**
     * Fetches the giveaway message from its channel
     * @returns {Promise<Message>}
     */
    async fetchMessage(): Promise<Message> {
        return new Promise(async (resolve, reject) => {
            if (!this.messageID) return;
            const message =
                this.channel.messages.get(this.messageID) ||
                (await this.channel.getMessage(this.messageID).catch(() => { }));

            if (!message) {
                this.manager.giveaways = this.manager.giveaways.filter(
                    (g) => g.messageID !== this.messageID
                );
                await (this.manager as any).deleteGiveaway(this.messageID);
                return reject(`Unable to fetch Message ID: ${this.messageID}`);
            }

            this.message = message;
            resolve(message);
        });
    }

    /**
     * Fills in a embed with giveaway properties
     * @param embed The filled in embed
     * @returns {?RichEmbed}
     */
    fillInEmbed(embed: RichEmbed): RichEmbed | null {
        if (!embed || typeof embed !== "object") return null;
        embed = new RichEmbed(embed);
        embed.title = this.fillInString(embed.title);
        embed.description = this.fillInString(embed.description);
        if (typeof embed.author?.name === "string")
            embed.author.name = this.fillInString(embed.author.name);
        if (typeof embed.footer?.text === "string")
            embed.footer.text = this.fillInString(embed.footer.text);
        embed.spliceFields(
            0,
            embed.fields.length,
            embed.fields.map((field) => {
                field.name = this.fillInString(field.name);
                field.value = this.fillInString(field.value);
                return field;
            })
        );
        return embed;
    }

    /**
     * Fills in a string with giveaway properties
     * @param text The filled in text
     * @returns {?String}
     */
    fillInString(text: string): string | null {
        if (typeof text !== "string") return null;
        [...new Set(text.match(/\{[^{}]{1,}\}/g))]
            .filter((match) => match?.slice(1, -1).trim() !== "")
            .forEach((match) => {
                let replacer;

                try {
                    replacer = eval(match.slice(1, -1));
                } catch (err) {
                    replacer = match;
                }

                text = text.replaceAll(match, replacer);
            });
        return text;
    }

    /**
     * Pauses a giveaway
     * @param options The pause options
     * @returns {Promise<Giveaway>}
     */
    pause(options: PauseOptions = {}): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject(`Giveaway with Message ID ${this.messageID} has ended`);

            this.message ??= await this.fetchMessage().catch(() => { }) as Message<PossiblyUncachedTextableChannel>;

            if (!this.message) return reject(`Unable to find Giveaway with ID ${this.messageID}`);
            if (this.pauseOptions.isPaused) return reject(`Giveaway with Message ID ${this.messageID} has already been paused`);
            if (this.isDrop) return reject("Drop Giveaways cannot be paused");
            if (this.endTimeout) clearTimeout(this.endTimeout);

            const pauseOptions = this.options.pauseOptions || {};

            if (typeof options.content === "string") pauseOptions.content = options.content;

            if (Number.isFinite(options.unPauseAfter)) {
                if (options.unPauseAfter < Date.now()) {
                    pauseOptions.unPauseAfter = Date.now() + options.unPauseAfter;
                    this.endAt = this.endAt + options.unPauseAfter;
                } else {
                    pauseOptions.unPauseAfter = options.unPauseAfter;
                    this.endAt = this.endAt + options.unPauseAfter - Date.now();
                }
            } else {
                delete pauseOptions.unPauseAfter;
                pauseOptions.durationAfterPause = this.remainingTime;
                this.endAt = Infinity;
            }

            if (options.embedColor) {
                pauseOptions.embedColor = options.embedColor;
            }

            if (typeof options.infiniteDurationText === "string") {
                pauseOptions.infiniteDurationText = options.infiniteDurationText;
            }

            pauseOptions.isPaused = true;
            this.options.pauseOptions = pauseOptions;

            await this.manager.editGiveaway(this.messageID, this.data);

            const embed = this.manager.generateMainEmbed(this);

            this.message.edit({
                content: this.fillInString(this.messages.giveaway),
                embed: embed,
            }).catch(() => { });
            resolve(this);
        });
    }

    /**
     * Rerolls a giveaway
     * @param options The reroll options
     * @param interaction Optional Eris' command interaction
     * @returns {Promise<Array<Member>>}
     */
    reroll(options: GiveawayRerollOptions = {}, interaction?: CommandInteraction): Promise<Member[]> {
        return new Promise(async (resolve, reject) => {
            if (!this.ended) return reject(`Giveaway with Message ID ${this.messageID} hasn't ended`);

            this.message ??= await this.fetchMessage().catch(() => { }) as Message<PossiblyUncachedTextableChannel>;

            if (!this.message) return reject(`Unable to find Giveaway with ID ${this.messageID}`);
            if (this.isDrop) return reject("You cannot reroll drop Giveaways");
            if (!options || typeof options !== "object") return reject(`"options" is not an object (val=${options})`);
            options = merge(GiveawayRerollOptions, options);

            if (options.winnerCount && (!Number.isInteger(options.winnerCount) || options.winnerCount < 1)) return reject(`options.winnerCount is not an integet (val=${options.winnerCount})`);

            const winners = await this.roll(options.winnerCount || undefined);

            if (winners.length > 0) {
                this.winnerIDs = winners.map((w) => w.id);
                await this.manager.editGiveaway(this.messageID, this.data);

                const embed = this.manager.generateEndEmbed(this, winners);

                this.message.edit({
                    content: this.fillInString(this.messages.giveawayEnded),
                    embed: embed
                }).catch(() => { });

                let formattedWinners = winners.map((w) => `<@${w.id}>`).join(", ");
                const congratMessage = this.fillInString((options.messages.congrat as AdvancedMessageContent).content || options.messages.congrat as string);
                const message = congratMessage?.replace("{winners}", formattedWinners);

                if (message?.length > 2000) {
                    const firstContentPart = congratMessage.slice(0, congratMessage.indexOf("{winners}"));

                    if (firstContentPart.length) {
                        this.channel.createMessage({
                            content: firstContentPart
                        });
                    }

                    while (formattedWinners.length >= 2000) {
                        await this.channel.createMessage({
                            content: formattedWinners.slice(0, formattedWinners.lastIndexOf(",", 1999)) + ","
                        });

                        formattedWinners = formattedWinners.slice(
                            formattedWinners.slice(0, formattedWinners.lastIndexOf(",", 1999) + 2).length
                        );
                    }

                    this.channel.createMessage({
                        content: formattedWinners
                    });

                    const lastContentPart = congratMessage.slice(congratMessage.indexOf("{winners}") + 9);

                    if (lastContentPart.length) {
                        this.channel.createMessage({
                            content: lastContentPart
                        });
                    }
                }

                if ((options.messages.congrat as AdvancedMessageContent).embed && typeof (options.messages.congrat as AdvancedMessageContent).embed === "object") {
                    if (message?.length > 2000) formattedWinners = winners.map((w) => `<@${w.id}>`).join(", ");

                    const embed = this.fillInEmbed((options.messages.congrat as AdvancedMessageContent).embed as RichEmbed);
                    const embedDescription = embed.description?.replace("{winners}", formattedWinners) ?? "";

                    if (embedDescription.length <= 4096) {
                        this.channel.createMessage({
                            content: message?.length <= 2000 ? message : null,
                            embed: embed.setDescription(embedDescription)
                        });
                    } else {
                        const firstEmbed = new RichEmbed(embed).setDescription(
                            embed.description.slice(0, embed.description.indexOf("{winners}"))
                        );

                        if (firstEmbed.length) {
                            this.channel.createMessage({
                                content: message?.length <= 2000 ? message : null,
                                embed: firstEmbed
                            });
                        }

                        const tempEmbed = new RichEmbed().setColor(embed.color);

                        while (formattedWinners.length >= 4096) {
                            await this.channel.createMessage({
                                embed: tempEmbed.setDescription(
                                    formattedWinners.slice(0, formattedWinners.lastIndexOf(",", 4095)) + ","
                                )
                            });

                            formattedWinners = formattedWinners.slice(
                                formattedWinners.slice(0, formattedWinners.lastIndexOf(",", 4095) + 2).length
                            );
                        }

                        this.channel.createMessage({
                            embed: tempEmbed.setDescription(formattedWinners)
                        });

                        const lastEmbed = tempEmbed.setDescription(
                            embed.description.slice(embed.description.indexOf("{winners}") + 9)
                        );

                        if (lastEmbed.length) {
                            this.channel.createMessage({
                                embed: lastEmbed
                            });
                        }
                    }
                } else if (message?.length <= 2000) {
                    this.channel.createMessage({
                        content: message
                    });
                }

                resolve(winners);
            } else {
                const embed = this.fillInEmbed((options.messages.error as AdvancedMessageContent).embed as RichEmbed);

                if (options.interactionOptions.enabled) {
                    interaction.createMessage({
                        content: this.fillInString((options.messages.error as AdvancedMessageContent).content || options.messages.error as string),
                        embeds: (options.messages.error as AdvancedMessageContent).embed ? [(options.messages.error as AdvancedMessageContent).embed] : [],
                        flags: options.interactionOptions.ephemeral ? 64 : null
                    });
                } else {
                    this.channel.createMessage({
                        content: this.fillInString((options.messages.error as AdvancedMessageContent).content || options.messages.error as string),
                        embed: embed ?? null
                    });
                }

                resolve([]);
            }
        });
    }

    /**
     * Roll a giveaway to obtains winner(s)
     * @param winnerCount The winner count
     * @returns {Promise<Array<Member>>}
     */
    async roll(winnerCount = this.winnerCount): Promise<Member[]> {
        if (!this.message) return [];

        const reactionUsers = await this.message.getReaction(this.reaction);

        if (!reactionUsers.length) return [];

        this.channel.guild.fetchMembers().catch(() => { });

        let userCollection = reactionUsers;

        while (userCollection.length % 100 === 0) {
            const newUsers = await this.message.getReaction(this.reaction, {
                after: userCollection[userCollection.length - 1] as any,
            });

            if (newUsers.length === 0) break;

            userCollection = userCollection.concat(newUsers);
        }

        const users = userCollection
            .filter((u) => !u.bot || u.bot === this.botsCanWin)
            .filter((u) => u.id !== this.client.user.id);

        if (!users.length) return [];

        let userArray: User[];

        if (this.bonusEntries.length) {
            userArray = users;

            for (const user of userArray.slice()) {
                const isUserValidEntry = await this.checkWinnerEntry(user);

                if (!isUserValidEntry) continue;

                const highestBonusEntries = await this.checkBonusEntries(user);
                if (!highestBonusEntries) continue;

                for (let i = 0; i < highestBonusEntries; i++) userArray.push(user);
            }
        }

        let rolledWinners: User[];

        userArray = userArray?.length > users.length ? userArray : users;
        /* eslint-disable-next-line */
        rolledWinners = Array.from(
            {
                length: Math.min(winnerCount, users.length),
            },
            () => userArray.splice(Math.floor(Math.random() * userArray.length), 1)[0]
        );

        const winners: User[] = [];

        for (const u of rolledWinners) {
            const isValidEntry =
                !winners.some((winner) => winner.id === u.id) &&
                (await this.checkWinnerEntry(u));

            if (isValidEntry) {
                winners.push(u);
            } else {
                for (const user of userArray || users) {
                    const isUserValidEntry =
                        !winners.some((winner) => winner.id === user.id) &&
                        (await this.checkWinnerEntry(user));

                    if (isUserValidEntry) {
                        winners.push(user);
                        break;
                    }
                }
            }
        }

        return Promise.all(
            winners.map(
                async (user) =>
                    this.channel.guild.members.get(user.id) ||
                    (
                        await this.channel.guild
                            .fetchMembers({ userIDs: [user.id] })
                            .catch(() => { })
                    )[0]
            )
        );
    }

    /**
     * Unpause a giveaway
     * @returns {Promise<Giveaway>}
     */
    unpause(): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject(`Giveaway with Message ID ${this.messageID} has ended`);

            this.message ??= await this.fetchMessage().catch(() => { }) as Message<PossiblyUncachedTextableChannel>;

            if (!this.message) return reject(`Unable to find Giveaway with Message ID ${this.messageID}`);
            if (!this.pauseOptions.isPaused) return reject(`Giveaway with Message ID ${this.messageID} is not paused`);
            if (this.isDrop) return reject("Drop Giveaways cannot be unpaused");

            if (Number.isFinite(this.pauseOptions.durationAfterPause)) {
                this.endAt = Date.now() + this.pauseOptions.durationAfterPause;
            }

            delete this.options.pauseOptions.unPauseAfter;
            this.options.pauseOptions.isPaused = false;

            this.ensureEndTimeout();

            await this.manager.editGiveaway(this.messageID, this.data);

            const embed = this.manager.generateMainEmbed(this);

            this.message = await this.message.edit({
                content: this.fillInString(this.messages.giveaway),
                embed: embed
            }).catch(() => { }) as Message<PossiblyUncachedTextableChannel>;
            resolve(this);
        });
    }
}
