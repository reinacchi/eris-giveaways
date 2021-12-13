/**
 * A framework to facilitate the creation of giveaways using Eris
 */
declare module 'eris-giveaways' {
    import { EventEmitter } from 'events';
    import { AnyGuildChannel, Client, Constants, EmbedOptions, Member, Message, PartialEmoji, RawPacket, TextChannel } from "eris";

    export const VERSION: string;
    export class GiveawaysManager extends EventEmitter {
        constructor(client: Client, options?: GiveawaysManagerOptions);

        public client: Client;
        public giveaways: Giveaway[];
        public options: GiveawaysManagerOptions;
        public ready: boolean;

        public delete(messageID: string, doNotDeleteMessage?: boolean): Promise<boolean>;
        public deleteGiveaway(messageID: string): Promise<boolean>;
        public edit(messageID: string, options: GiveawayEditOptions): Promise<Giveaway>;
        public end(messageID: string): Promise<Member[]>;
        public reroll(messageID: string, options?: GiveawayRerollOptions, packet?: RawPacket): Promise<Member[]>;
        public start(channel: AnyGuildChannel, options: GiveawayStartOptions): Promise<Giveaway>;
        public pause(messageID: string, options: PauseOptions): Promise<Giveaway>;
        public unpause(messageID: string): Promise<Giveaway>;
        on<K extends keyof GiveawayManagerEvents>(event: K, listener: (...args: GiveawayManagerEvents[K]) => void): this;
        on<S extends string | symbol>(
            event: Exclude<S, keyof GiveawayManagerEvents>,
            listener: (...args: any[]) => void,
        ): this;
        once<K extends keyof GiveawayManagerEvents>(event: K, listener: (...args: GiveawayManagerEvents[K]) => void): this;
        once<S extends string | symbol>(
            event: Exclude<S, keyof GiveawayManagerEvents>,
            listener: (...args: any[]) => void,
        ): this;
        emit<K extends keyof GiveawayManagerEvents>(event: K, ...args: GiveawayManagerEvents[K]): boolean;
        emit<S extends string | symbol>(event: Exclude<S, keyof GiveawayManagerEvents>, ...args: any[]): boolean;
        off<K extends keyof GiveawayManagerEvents>(event: K, listener: (...args: GiveawayManagerEvents[K]) => void): this;
        off<S extends string | symbol>(
            event: Exclude<S, keyof GiveawayManagerEvents>,
            listener: (...args: any[]) => void,
        ): this;
        removeAllListeners<K extends keyof GiveawayManagerEvents>(event?: K): this;
        removeAllListeners<S extends string | symbol>(event?: Exclude<S, keyof GiveawayManagerEvents>): this;
    }
    interface BonusEntry {
        bonus(member?: Member): number | Promise<number>;
        cumulative?: boolean;
    }
    interface LastChanceOptions {
        enabled?: boolean;
        embedColor?: number;
        content?: string;
        threshold?: number;
    }
    interface PauseOptions {
        isPaused: boolean;
        content: string;
        unPauseAfter: number;
        embedColor: number;
        durationAfterPause: number;
    }
    interface GiveawaysManagerOptions {
        storage?: string;
        updateCountdownEvery?: number;
        endedGiveawaysLifetime?: number;
        default?: {
            botsCanWin?: boolean,
            exemptPermissions?: keyof Constants["Permissions"][],
            exemptMembers?: (member?: Member) => boolean | Promise<boolean>,
            embedColor?: number,
            embedColorEnd?: number,
            reaction?: string,
            lastChance?: LastChanceOptions;
        };
    }
    interface GiveawayStartOptions {
        time: number;
        winnerCount: number;
        prize: string;
        hostedBy?: string;
        botsCanWin?: boolean;
        exemptPermissions?: keyof Constants["Permissions"][];
        exemptMembers?: (member?: Member) => boolean | Promise<boolean>;
        bonusEntries?: BonusEntry[];
        embedColor?: number;
        embedColorEnd?: number;
        reaction?: string;
        messages?: GiveawaysMessages;
        thumbnail?: string;
        extraData?: any;
        lastChance?: LastChanceOptions;
        pauseOptions?: PauseOptions;
    }
    interface GiveawaysMessages {
        giveaway?: string;
        giveawayEnded?: string;
        inviteToParticipate?: string;
        timeRemaining?: string;
        winMessage?: string;
        embedFooter?: string | { text?: string; iconURL?: string; };
        noWinner?: string;
        winners?: string;
        endedAt?: string;
        hostedBy?: string;
        units?: {
            seconds?: string;
            minutes?: string;
            hours?: string;
            days?: string;
            pluralS?: false;
        };
    }
    interface GiveawaysManagerEvents {
        giveawayCreated: [giveaway: Giveaway, channel: AnyGuildChannel];
        giveawayDeleted: [giveaway: Giveaway];
        giveawayEnded: [giveaway: Giveaway, members: Member[]];
        giveawayEdited: [giveaway: Giveaway];
        giveawayRerolled: [giveaway: Giveaway, members: Member[]];
        giveawayReactionAdded: [giveaway: Giveaway, member: Member, reaction: PartialEmoji];
        giveawayReactionRemoved: [giveaway: Giveaway, member: Member, reaction: PartialEmoji];
        giveawayPaused: [giveaway: Giveaway];
        giveawayUnpaused: [giveaway: Giveaway];
        endedGiveawayReactionAdded: [giveaway: Giveaway, member: Member, reaction: PartialEmoji];
    }
    class Giveaway extends EventEmitter {
        constructor(manager: GiveawaysManager, options: GiveawayData);

        public channelID: string;
        public client: Client;
        public endAt: number;
        public ended: boolean;
        public guildID: string;
        public hostedBy?: string;
        public manager: GiveawaysManager;
        public message: Message | null;
        public messageID?: string;
        public messages: GiveawaysMessages;
        public thumbnail?: string;
        public options: GiveawayData;
        public prize: string;
        public startAt: number;
        public winnerCount: number;
        public winnerIDs: string[];

        // getters calculated using default manager options
        readonly exemptPermissions: keyof Constants["Permissions"][];
        readonly embedColor: string;
        readonly embedColorEnd: string;
        readonly botsCanWin: boolean;
        readonly reaction: string;
        readonly lastChance: LastChanceOptions;

        // getters calculated using other values
        readonly remainingTime: number;
        readonly duration: number;
        readonly messageURL: string;
        readonly remainingTimeText: string;
        readonly channel: TextChannel;
        readonly exemptMembersFunction: Function | null;
        readonly bonusEntries: BonusEntry[];
        readonly data: GiveawayData;
        readonly pauseOptions: PauseOptions;

        public exemptMembers(member: Member): Promise<boolean>;
        public edit(options: GiveawayEditOptions): Promise<Giveaway>;
        public end(): Promise<Member[]>;
        public fetchMessage(): Promise<Message>;
        public reroll(options?: GiveawayRerollOptions, packet?: RawPacket): Promise<Member[]>;
        public roll(winnerCount?: number): Promise<Member[]>;
        public pause(options: PauseOptions): Promise<Giveaway>;
        public unpause(): Promise<Giveaway>;
    }
    interface GiveawayEditOptions {
        newWinnerCount?: number;
        newPrize?: string;
        addTime?: number;
        setEndTimestamp?: number;
        newMessages?: GiveawaysMessages;
        newThumbnail?: string;
        newBonusEntries?: BonusEntry[];
        newExtraData?: any;
        newLastChance?: LastChanceOptions
    }
    interface GiveawayRerollOptions {
        winnerCount?: number;
        useInteractions?: boolean;
        messages?: {
            congrat?: string;
            error?: { content?: string, embed?: EmbedOptions } | string;
        };
    }
    interface GiveawayData {
        startAt: number;
        endAt: number;
        winnerCount: number;
        messages: Required<GiveawaysMessages>;
        prize: string;
        channelID: string;
        guildID: string;
        ended?: boolean;
        winnerIDs?: string[];
        messageID?: string;
        reaction?: string;
        exemptPermissions?: keyof Constants["Permissions"][];
        exemptMembers?: string;
        bonusEntries?: string;
        embedColor?: string;
        embedColorEnd?: string;
        thumbnail?: string;
        hostedBy?: string;
        extraData?: any;
        lastChance?: LastChanceOptions;
        pauseOptions?: PauseOptions;
    }
}
