"use strict";

import { AdvancedMessageContent, Constants, Member } from "eris";
import { Giveaway } from "./Giveaway";

export interface BonusEntry {
    bonus(member?: Member, giveaway?: Giveaway): number | Promise<number>;
    cumulative?: boolean;
}

export interface InteractionOptions {
    enabled?: boolean;
    ephemeral?: boolean
}

export interface LastChanceOptions {
    enabled?: boolean;
    embedColor?: number;
    content?: string;
    threshold?: number;
}
export interface PauseOptions {
    isPaused?: boolean;
    content?: string;
    unPauseAfter?: number;
    embedColor?: number;
    durationAfterPause?: number;
    infiniteDurationText?: string;
}

export interface GiveawayStartOptions {
    prize: string;
    winnerCount: number;
    duration?: number; // can be null for drops
    hostedBy?: string;
    botsCanWin?: boolean;
    exemptPermissions?: [keyof Constants["Permissions"]];
    exemptMembers?: (member: Member) => boolean | Promise<boolean>;
    bonusEntries?: BonusEntry[];
    embedColor?: number;
    embedColorEnd?: number;
    reaction?: string;
    messages?: GiveawaysMessages;
    thumbnail?: string;
    image?: string;
    extraData?: any;
    lastChance?: LastChanceOptions;
    pauseOptions?: PauseOptions;
    isDrop?: boolean;
}

export interface GiveawaysMessages {
    giveaway?: string;
    giveawayEnded?: string;
    inviteToParticipate?: string;
    winMessage?: string | AdvancedMessageContent;
    drawing?: string;
    title?: string;
    dropMessage?: string;
    embedFooter?: string | { text?: string; iconURL?: string };
    noWinner?: string;
    winners?: string;
    endedAt?: string;
    hostedBy?: string;
}

export interface GiveawaysManagerOptions {
    storage?: string;
    forceUpdateEvery?: number;
    endedGiveawaysLifetime?: number;
    default?: {
        botsCanWin?: boolean;
        exemptPermissions?: [keyof Constants["Permissions"]] | any;
        exemptMembers?: (member: Member) => boolean | Promise<boolean>;
        embedColor?: number;
        embedColorEnd?: number;
        reaction?: string;
        lastChance?: LastChanceOptions;
    };
}

export interface GiveawayEditOptions {
    newWinnerCount?: number;
    newPrize?: string;
    addTime?: number;
    setEndTimestamp?: number;
    newMessages?: GiveawaysMessages;
    newThumbnail?: string;
    newImage?: string;
    newBonusEntries?: BonusEntry[];
    newExemptMembers?: (member: Member) => boolean | Promise<boolean>;
    newExtraData?: any;
    newLastChance?: LastChanceOptions;
}
export interface GiveawayRerollOptions {
    winnerCount?: number;
    messages?: {
        congrat?: string | AdvancedMessageContent;
        error?: string | AdvancedMessageContent;
    };
    interactionOptions?: InteractionOptions;
}

export interface GiveawayData {
    startAt: number;
    botsCanWin: boolean;
    endAt: number;
    winnerCount: number;
    messages: GiveawaysMessages;
    prize: string;
    channelID: string;
    guildID: string;
    ended?: boolean;
    winnerIDs?: string[];
    messageID?: string;
    reaction?: string;
    exemptPermissions?: [keyof Constants["Permissions"]];
    exemptMembers?: string;
    bonusEntries?: string;
    embedColor?: number;
    embedColorEnd?: number;
    thumbnail?: string;
    image?: string;
    hostedBy?: string;
    extraData?: any;
    lastChance?: LastChanceOptions;
    pauseOptions?: PauseOptions;
    isDrop?: boolean;
}

export const Endpoints = {
    MESSAGE_URL: (guildID: string, channelID: string, messageID: string) =>
        `https://discord.com/channels/${guildID}/${channelID}/${messageID}`,
};

export const GiveawayMessages: GiveawaysMessages = {
    giveaway: "🎉🎉 **GIVEAWAY** 🎉🎉",
    giveawayEnded: "🎉🎉 **GIVEAWAY ENDED** 🎉🎉",
    inviteToParticipate: "React with 🎉 to participate!",
    drawing: "Drawing: **{duration}**",
    winMessage: "Congratulations, {winners}! You won **{this.prize}**! \n {this.messageURL}",
    dropMessage: "Be the first to react 🎉 !",
    embedFooter: "Powered by givies-framework",
    noWinner: "Giveaway cancelled, no valid participations.",
    winners: "Winner(s):",
    endedAt: "Ended at",
    hostedBy: "Hosted by: {this.hostedBy}",
};

export const InteractionOptions: InteractionOptions = {
    enabled: false,
    ephemeral: false
};

export const LastChanceOptions: LastChanceOptions = {
    enabled: true,
    content: "⚠️ **LAST CHANCE TO ENTER** ⚠️",
    threshold: 10000,
    embedColor: 0xff0000,
};

export const PauseOptions: PauseOptions = {
    isPaused: false,
    content: "⚠️ **THIS GIVEAWAY IS PAUSED** ⚠️",
    unPauseAfter: null,
    embedColor: 0xffff00,
    durationAfterPause: null,
    infiniteDurationText: "`NEVER`"
};

export const GiveawayManagerOptions: GiveawaysManagerOptions = {
    storage: "./giveaways.json",
    forceUpdateEvery: null,
    endedGiveawaysLifetime: null,
    default: {
        botsCanWin: false,
        exemptPermissions: [],
        exemptMembers: () => false,
        embedColor: 0x7289da,
        embedColorEnd: 0x23272a,
        reaction: "🎉",
        lastChance: {
            enabled: true,
            content: "⚠️ **LAST CHANCE TO ENTER** ⚠️",
            threshold: 10000,
            embedColor: 0xff0000,
        },
    },
};

export const GiveawayRerollOptions: GiveawayRerollOptions = {
    winnerCount: 1,
    messages: {
        congrat: "🎉 **New winner(s):** {winners}! Congratulations, you won **{this.prize}**! \n {this.messageURL}",
        error: "No valid participations, no winners can be rerolled!",
    },
    interactionOptions: {
        enabled: false,
        ephemeral: false
    }
};

export const GiveawayData: GiveawayData = {
    startAt: 0,
    botsCanWin: false,
    endAt: 0,
    winnerCount: 0,
    messages: undefined,
    prize: "",
    channelID: "",
    guildID: "",
    ended: false
};

export const GiveawayStartOptions: GiveawayStartOptions = {
    prize: "",
    winnerCount: 0
};
export const GiveawayEditOptions: GiveawayEditOptions = {};
export const BonusEntry: BonusEntry[] = [];
