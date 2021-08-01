/**
 * A framework to facilitate the creation of giveaways using Eris
 */
declare module 'eris-giveaways' {
    import { EventEmitter } from 'events';
    import Eris from "eris";

    export const VERSION: string;
    export class GiveawaysManager extends EventEmitter {
        constructor(client: Eris.Client, options?: GiveawaysManagerOptions);

        public client: Eris.Client;
        public giveaways: Giveaway[];
        public options: GiveawaysManagerOptions;
        public ready: boolean;

        public delete(messageID: string, doNotDeleteMessage?: boolean): Promise<boolean>;
        public deleteGiveaway(messageID: string): Promise<boolean>;
        public edit(messageID: string, options: GiveawayEditOptions): Promise<Giveaway>;
        public end(messageID: string): Promise<Member[]>;
        public reroll(messageID: string, options?: GiveawayRerollOptions): Promise<Member[]>;
        public start(channel: Eris.TextChannel, options: GiveawayStartOptions): Promise<Giveaway>;
        public pause(messageID: string, options: PauseOptions): Promise<Giveaway>;
        public unpause(messageID: string): Promise<Giveaway>;
        public on<K extends keyof GiveawaysManagerEvents>(
            event: K,
            listener: (...args: GiveawaysManagerEvents[K]) => void
        ): this;

        public once<K extends keyof GiveawaysManagerEvents>(
            event: K,
            listener: (...args: GiveawaysManagerEvents[K]) => void
        ): this;

        public emit<K extends keyof GiveawaysManagerEvents>(event: K, ...args: GiveawaysManagerEvents[K]): boolean;
    }
    interface BonusEntry {
        bonus(member?: Eris.Member): number | Promise<number>;
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
            exemptPermissions?: keyof Eris.Constants["Permissions"][],
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
        hostedBy?: Eris.User;
        botsCanWin?: boolean;
        exemptPermissions?: keyof Eris.Constants["Permissions"][];
        exemptMembers?: (member?: Eris.Member) => boolean | Promise<boolean>;
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
        giveawayDeleted: [Giveaway];
        giveawayEnded: [Giveaway, GuildMember[]];
        giveawayEdited: [Giveaway];
        giveawayRerolled: [Giveaway, GuildMember[]];
        giveawayReactionAdded: [Giveaway, GuildMember, MessageReaction];
        giveawayReactionRemoved: [Giveaway, GuildMember, MessageReaction];
        giveawayPaused: [Giveaway];
        giveawayUnpaused: [Giveaway];
        endedGiveawayReactionAdded: [Giveaway, GuildMember, MessageReaction];
    }
    class Giveaway extends EventEmitter {
        constructor(manager: GiveawaysManager, options: GiveawayData);

        public channelID: string;
        public client: Client;
        public endAt: Eris.Client;
        public ended: boolean;
        public guildID: string;
        public hostedBy?: Eris.User;
        public manager: GiveawaysManager;
        public message: Eris.Message | null;
        public messageID?: string;
        public messages: GiveawaysMessages;
        public thumbnail?: string;
        public options: GiveawayData;
        public prize: string;
        public startAt: number;
        public winnerCount: number;
        public winnerIDs: string[];

        // getters calculated using default manager options
        readonly exemptPermissions: keyof Eris.Constants["Permissions"][];
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
        readonly channel: Eris.TextChannel;
        readonly exemptMembersFunction: Function | null;
        readonly bonusEntries: BonusEntry[];
        readonly data: GiveawayData;
        readonly pauseOptions: PauseOptions;

        public exemptMembers(member: Eris.Member): Promise<boolean>;
        public edit(options: GiveawayEditOptions): Promise<Giveaway>;
        public end(): Promise<Eris.Member[]>;
        public fetchMessage(): Promise<Eris.Message>;
        public reroll(options?: GiveawayRerollOptions): Promise<Eris.Member[]>;
        public roll(winnerCount?: number): Promise<Eris.Member[]>;
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
    }
    interface GiveawayRerollOptions {
        winnerCount?: number;
        useInteractions?: boolean;
        messages?: {
            congrat?: string;
            error?: string;
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
        exemptPermissions?: keyof Eris.Constants["Permissions"][];
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
